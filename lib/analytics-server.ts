import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { sql } from "@vercel/postgres"

import type {
  AnalyticsDevice,
  AnalyticsEvent,
  AnalyticsRecentEvent,
  AnalyticsSource,
  AnalyticsSummary,
  AnalyticsTargetStat,
  AnalyticsTimePoint,
  AnalyticsWeeklyTrendPoint,
  RecordAnalyticsEventInput,
} from "@/lib/analytics-types"

const ANALYTICS_DIR = path.join(process.cwd(), "data")
const ANALYTICS_PATH = path.join(ANALYTICS_DIR, "analytics-events.json")
const MAX_STORED_EVENTS = 25000
const GEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const GEO_LOOKUP_TIMEOUT_MS = 1200

const botPattern = /bot|spider|crawl|headless|curl|wget|preview|monitor|uptime|slurp|facebookexternalhit|discordbot|whatsapp|telegram/i
const geoCache = new Map<string, { country: string; city: string; expiresAt: number }>()

function hasPostgresConfig() {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)
}

function ensurePostgresEnvAlias() {
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL
  }
}

async function ensureAnalyticsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS cms_analytics_events (
      id BIGSERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      event_name TEXT NOT NULL,
      session_id TEXT NOT NULL,
      path TEXT NOT NULL,
      source TEXT NOT NULL,
      source_context TEXT NOT NULL,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      section TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      value DOUBLE PRECISION NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_bot BOOLEAN NOT NULL DEFAULT FALSE
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS cms_analytics_events_occurred_at_idx
    ON cms_analytics_events (occurred_at DESC)
  `
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function normalizeSource(value: unknown): AnalyticsSource {
  if (value === "nav" || value === "folder" || value === "command" || value === "gallery" || value === "outbound" || value === "section" || value === "scroll" || value === "performance" || value === "system") {
    return value
  }
  return "other"
}

function classifyDevice(userAgent: string): AnalyticsDevice {
  const ua = userAgent.toLowerCase()
  if (!ua) return "unknown"
  if (botPattern.test(ua)) return "bot"
  if (/ipad|tablet|nexus 7|nexus 10|sm-t|kindle/.test(ua)) return "tablet"
  if (/iphone|android|mobile|ipod/.test(ua)) return "mobile"
  if (/macintosh|windows|linux/.test(ua)) return "desktop"
  return "unknown"
}

function safeDate(value: unknown) {
  if (typeof value !== "string") return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  const now = Date.now()
  const maxFutureMs = now + 5 * 60 * 1000
  if (parsed.getTime() > maxFutureMs) {
    return new Date(now)
  }
  return parsed
}

function parseHost(value: string) {
  if (!value) return ""
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return ""
  }
}

function getClientIpFromHeaders(headers?: Headers) {
  if (!headers) return ""

  const forwardedFor = headers.get("x-forwarded-for") ?? headers.get("x-vercel-forwarded-for") ?? ""
  if (forwardedFor) {
    const first = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find(Boolean)
    if (first) return first
  }

  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-client-ip") ??
    headers.get("fastly-client-ip") ??
    ""
  )
}

function isPrivateOrLocalIp(ip: string) {
  const value = ip.trim().toLowerCase()
  if (!value) return true
  if (value === "::1" || value === "localhost") return true
  if (value.startsWith("127.")) return true
  if (value.startsWith("10.")) return true
  if (value.startsWith("192.168.")) return true
  if (value.startsWith("169.254.")) return true
  if (value.startsWith("172.")) {
    const secondOctet = Number(value.split(".")[1])
    if (secondOctet >= 16 && secondOctet <= 31) return true
  }
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80")) return true
  return false
}

function isGeoEnrichmentEnabled() {
  return process.env.ANALYTICS_GEO_ENRICHMENT !== "0"
}

async function lookupGeoByIp(ip: string): Promise<{ country: string; city: string } | null> {
  if (!ip || isPrivateOrLocalIp(ip) || !isGeoEnrichmentEnabled()) return null

  const cached = geoCache.get(ip)
  if (cached && cached.expiresAt > Date.now()) {
    return { country: cached.country, city: cached.city }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GEO_LOOKUP_TIMEOUT_MS)

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) return null

    const payload = (await response.json()) as {
      success?: boolean
      country_code?: string
      country?: string
      city?: string
    }

    if (payload.success === false) return null

    const countryCode = sanitizeText(payload.country_code, 8).toUpperCase()
    const countryName = sanitizeText(payload.country, 80)
    const city = sanitizeText(payload.city, 120)
    const country = countryCode || countryName

    if (!country && !city) return null

    geoCache.set(ip, {
      country,
      city,
      expiresAt: Date.now() + GEO_CACHE_TTL_MS,
    })

    return { country, city }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

function normalizeMetricName(value: unknown) {
  const raw = sanitizeText(value, 12).toUpperCase()
  if (raw === "LCP" || raw === "INP" || raw === "CLS") return raw
  if (raw) return "OTHER"
  return ""
}

function normalizeEvent(input: Omit<Partial<AnalyticsEvent>, "meta"> & { meta?: Partial<AnalyticsEvent["meta"]> }): AnalyticsEvent | null {
  const occurredAt = safeDate(input.occurredAt)?.toISOString()
  if (!occurredAt) return null

  const userAgent = sanitizeText(input.meta?.userAgent, 300)
  const device = input.meta?.device ?? classifyDevice(userAgent)

  return {
    occurredAt,
    eventName: sanitizeText(input.eventName, 64) || "event",
    sessionId: sanitizeText(input.sessionId, 80) || "",
    path: sanitizeText(input.path, 240) || "/",
    source: normalizeSource(input.source),
    sourceContext: sanitizeText(input.sourceContext, 140),
    label: sanitizeText(input.label, 180),
    href: sanitizeText(input.href, 700),
    section: sanitizeText(input.section, 120),
    itemId: sanitizeText(input.itemId, 240),
    itemType: sanitizeText(input.itemType, 80),
    value: toFiniteNumber(input.value),
    durationMs: Math.max(0, Math.round(toFiniteNumber(input.durationMs))),
    isBot: Boolean(input.isBot ?? (device === "bot" || botPattern.test(userAgent))),
    meta: {
      referrer: sanitizeText(input.meta?.referrer, 700),
      referrerHost: sanitizeText(input.meta?.referrerHost, 180),
      utmSource: sanitizeText(input.meta?.utmSource, 120),
      utmMedium: sanitizeText(input.meta?.utmMedium, 120),
      utmCampaign: sanitizeText(input.meta?.utmCampaign, 120),
      locale: sanitizeText(input.meta?.locale, 80),
      timezone: sanitizeText(input.meta?.timezone, 80),
      country: sanitizeText(input.meta?.country, 80),
      city: sanitizeText(input.meta?.city, 120),
      siteHost: sanitizeText(input.meta?.siteHost, 180).toLowerCase(),
      siteOrigin: sanitizeText(input.meta?.siteOrigin, 260).toLowerCase(),
      userAgent,
      device,
      metricName: normalizeMetricName(input.meta?.metricName),
    },
  }
}

async function readLocalEvents() {
  try {
    const raw = await readFile(ANALYTICS_PATH, "utf8")
    const payload = JSON.parse(raw)
    if (!Array.isArray(payload)) return [] as AnalyticsEvent[]

    return payload
      .map((entry) => normalizeEvent(entry as Partial<AnalyticsEvent>))
      .filter((entry): entry is AnalyticsEvent => Boolean(entry))
  } catch {
    return [] as AnalyticsEvent[]
  }
}

async function writeLocalEvents(events: AnalyticsEvent[]) {
  await mkdir(ANALYTICS_DIR, { recursive: true })
  await writeFile(ANALYTICS_PATH, `${JSON.stringify(events, null, 2)}\n`, "utf8")
}

function buildServerMetaFromHeaders(headers?: Headers) {
  if (!headers) {
    return {
      country: "",
      city: "",
      userAgent: "",
      referrer: "",
      referrerHost: "",
      ip: "",
      siteHost: "",
      siteOrigin: "",
    }
  }

  const country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? headers.get("x-country-code") ?? ""
  const city = headers.get("x-vercel-ip-city") ?? headers.get("x-city") ?? ""
  const userAgent = headers.get("user-agent") ?? ""
  const referrer = headers.get("referer") ?? ""
  const ip = getClientIpFromHeaders(headers)
  const siteHost = headers.get("x-forwarded-host") ?? headers.get("host") ?? ""
  const proto = headers.get("x-forwarded-proto") ?? "https"
  const siteOrigin = siteHost ? `${proto}://${siteHost}` : ""

  return {
    country,
    city,
    userAgent,
    referrer,
    referrerHost: parseHost(referrer),
    ip,
    siteHost,
    siteOrigin,
  }
}

function randomSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function recordAnalyticsEvent(input: RecordAnalyticsEventInput, headers?: Headers) {
  const serverMeta = buildServerMetaFromHeaders(headers)
  const geoFromIp = await lookupGeoByIp(serverMeta.ip)

  const trustedReferrer = sanitizeText(serverMeta.referrer, 700)
  const fallbackReferrer = sanitizeText(input.meta?.referrer, 700)
  const resolvedReferrer = trustedReferrer || fallbackReferrer
  const resolvedReferrerHost = parseHost(resolvedReferrer) || sanitizeText(input.meta?.referrerHost, 180)
  const resolvedCountry = sanitizeText(serverMeta.country, 80) || geoFromIp?.country || sanitizeText(input.meta?.country, 80)
  const resolvedCity = sanitizeText(serverMeta.city, 120) || geoFromIp?.city || sanitizeText(input.meta?.city, 120)
  const resolvedUserAgent = sanitizeText(serverMeta.userAgent, 300) || sanitizeText(input.meta?.userAgent, 300)
  const resolvedSiteHost = sanitizeText(serverMeta.siteHost, 180).toLowerCase() || sanitizeText(input.meta?.siteHost, 180).toLowerCase()
  const resolvedSiteOrigin = sanitizeText(serverMeta.siteOrigin, 260).toLowerCase() || sanitizeText(input.meta?.siteOrigin, 260).toLowerCase()

  const normalized = normalizeEvent({
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    eventName: input.eventName,
    sessionId: input.sessionId ?? randomSessionId(),
    path: input.path ?? "/",
    source: input.source ?? "other",
    sourceContext: input.sourceContext ?? input.source ?? "other",
    label: input.label ?? "",
    href: input.href ?? "",
    section: input.section ?? "",
    itemId: input.itemId ?? "",
    itemType: input.itemType ?? "",
    value: input.value ?? 0,
    durationMs: input.durationMs ?? 0,
    meta: {
      ...input.meta,
      country: resolvedCountry,
      city: resolvedCity,
      siteHost: resolvedSiteHost,
      siteOrigin: resolvedSiteOrigin,
      userAgent: resolvedUserAgent,
      referrer: resolvedReferrer,
      referrerHost: resolvedReferrerHost,
      device: undefined,
    },
  })

  if (!normalized) return

  if (hasPostgresConfig()) {
    try {
      ensurePostgresEnvAlias()
      await ensureAnalyticsTable()
      await sql`
        INSERT INTO cms_analytics_events (
          occurred_at,
          event_name,
          session_id,
          path,
          source,
          source_context,
          label,
          href,
          section,
          item_id,
          item_type,
          value,
          duration_ms,
          meta,
          is_bot
        ) VALUES (
          ${normalized.occurredAt},
          ${normalized.eventName},
          ${normalized.sessionId},
          ${normalized.path},
          ${normalized.source},
          ${normalized.sourceContext},
          ${normalized.label},
          ${normalized.href},
          ${normalized.section},
          ${normalized.itemId},
          ${normalized.itemType},
          ${normalized.value},
          ${normalized.durationMs},
          ${JSON.stringify(normalized.meta)}::jsonb,
          ${normalized.isBot}
        )
      `
      return
    } catch {
      // Fallback to file storage.
    }
  }

  const events = await readLocalEvents()
  events.push(normalized)
  await writeLocalEvents(events.slice(-MAX_STORED_EVENTS))
}

export async function recordAnalyticsClick(input: { source: string; label: string; href: string }, headers?: Headers) {
  await recordAnalyticsEvent(
    {
      eventName: "click",
      source: normalizeSource(input.source),
      sourceContext: input.source,
      label: input.label,
      href: input.href,
    },
    headers,
  )
}

async function readAnalyticsEvents(limit = MAX_STORED_EVENTS) {
  if (hasPostgresConfig()) {
    try {
      ensurePostgresEnvAlias()
      await ensureAnalyticsTable()
      const result = await sql<{
        occurred_at: Date
        event_name: string
        session_id: string
        path: string
        source: string
        source_context: string
        label: string
        href: string
        section: string
        item_id: string
        item_type: string
        value: number
        duration_ms: number
        meta: AnalyticsEvent["meta"]
        is_bot: boolean
      }>`
        SELECT occurred_at, event_name, session_id, path, source, source_context, label, href, section, item_id, item_type, value, duration_ms, meta, is_bot
        FROM cms_analytics_events
        ORDER BY occurred_at DESC
        LIMIT ${limit}
      `

      return result.rows
        .map((row) =>
          normalizeEvent({
            occurredAt: new Date(row.occurred_at).toISOString(),
            eventName: row.event_name,
            sessionId: row.session_id,
            path: row.path,
            source: normalizeSource(row.source),
            sourceContext: row.source_context,
            label: row.label,
            href: row.href,
            section: row.section,
            itemId: row.item_id,
            itemType: row.item_type,
            value: row.value,
            durationMs: row.duration_ms,
            isBot: row.is_bot,
            meta: row.meta,
          }),
        )
        .filter((entry): entry is AnalyticsEvent => Boolean(entry))
    } catch {
      // Fallback to local file storage.
    }
  }

  const local = await readLocalEvents()
  return local.slice(-limit).reverse()
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index] ?? 0
}

function toRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function isContactHref(href: string) {
  const lower = href.toLowerCase()
  return lower.startsWith("mailto:") || lower.includes("cal.com")
}

function isPublicPath(pathValue: string) {
  return !pathValue.startsWith("/admin") && !pathValue.startsWith("/api")
}

function isClickLike(event: AnalyticsEvent) {
  return event.eventName.includes("click")
  // return event.eventName.includes("click") || event.eventName.includes("open")
}

function buildDailySeries(events: AnalyticsEvent[], days: number): AnalyticsTimePoint[] {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  const labels: Array<{ key: string; label: string }> = []
  for (let i = 0; i < days; i += 1) {
    const current = new Date(start)
    current.setDate(start.getDate() + i)
    labels.push({
      key: current.toISOString().slice(0, 10),
      label: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })
  }

  const counts = new Map(labels.map((entry) => [entry.key, 0]))
  for (const event of events) {
    const key = event.occurredAt.slice(0, 10)
    if (!counts.has(key)) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return labels.map((entry) => ({ label: entry.label, clicks: counts.get(entry.key) ?? 0 }))
}

function buildHourlySeries(events: AnalyticsEvent[]): AnalyticsTimePoint[] {
  const now = new Date()
  const start = new Date(now.getTime() - 23 * 60 * 60 * 1000)

  const buckets: Array<{ label: string; clicks: number; startMs: number; endMs: number }> = []
  for (let i = 0; i < 24; i += 1) {
    const bucketDate = new Date(start.getTime() + i * 60 * 60 * 1000)
    bucketDate.setMinutes(0, 0, 0)
    const startMs = bucketDate.getTime()
    buckets.push({
      label: bucketDate.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      clicks: 0,
      startMs,
      endMs: startMs + 60 * 60 * 1000,
    })
  }

  for (const event of events) {
    const timeMs = new Date(event.occurredAt).getTime()
    for (const bucket of buckets) {
      if (timeMs >= bucket.startMs && timeMs < bucket.endMs) {
        bucket.clicks += 1
        break
      }
    }
  }

  return buckets.map((bucket) => ({ label: bucket.label, clicks: bucket.clicks }))
}

function buildWeeklyTrends(events: AnalyticsEvent[]): AnalyticsWeeklyTrendPoint[] {
  const now = new Date()
  const weeks: AnalyticsWeeklyTrendPoint[] = []

  for (let offset = 7; offset >= 0; offset -= 1) {
    const end = new Date(now)
    end.setDate(now.getDate() - offset * 7)
    end.setHours(23, 59, 59, 999)

    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    let clicks = 0
    let conversions = 0

    for (const event of events) {
      const eventMs = new Date(event.occurredAt).getTime()
      if (eventMs < start.getTime() || eventMs > end.getTime()) continue
      if (isClickLike(event)) clicks += 1
      if (event.eventName === "outbound_click" && isContactHref(event.href)) conversions += 1
    }

    weeks.push({
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      clicks,
      conversions,
    })
  }

  return weeks
}

function safeDivision(value: number, by: number) {
  if (by <= 0) return 0
  return value / by
}

export async function getAnalyticsSummary(days = 14): Promise<AnalyticsSummary> {
  const boundedDays = Math.max(7, Math.min(60, Math.floor(days)))
  const events = await readAnalyticsEvents()
  const totalEvents = events.length

  const nonBotEvents = events.filter((event) => !event.isBot)
  const publicEvents = nonBotEvents.filter((event) => isPublicPath(event.path))
  const clickEvents = publicEvents.filter((event) => isClickLike(event))

  const now = Date.now()
  const realTimeThreshold = now - 5 * 60 * 1000
  const last24hThreshold = now - 24 * 60 * 60 * 1000

  const realTimeSessions = new Set(
    publicEvents
      .filter((event) => {
        const eventMs = new Date(event.occurredAt).getTime()
        return eventMs >= realTimeThreshold && (event.eventName === "page_view" || event.eventName === "page_heartbeat")
      })
      .map((event) => event.sessionId),
  )

  const last24hClicks = clickEvents.filter((event) => new Date(event.occurredAt).getTime() >= last24hThreshold).length

  const targetMap = new Map<string, { href: string; label: string; clicks: number; dayKeys: Set<string> }>()
  const sourceMap = new Map<string, number>()

  for (const event of clickEvents) {
    const targetKey = `${event.href}::${event.label}`
    const currentTarget = targetMap.get(targetKey)
    if (currentTarget) {
      currentTarget.clicks += 1
      currentTarget.dayKeys.add(event.occurredAt.slice(0, 10))
    } else {
      targetMap.set(targetKey, {
        href: event.href,
        label: event.label || event.href || event.sourceContext,
        clicks: 1,
        dayKeys: new Set([event.occurredAt.slice(0, 10)]),
      })
    }

    const sourceKey = event.sourceContext || event.source
    sourceMap.set(sourceKey, (sourceMap.get(sourceKey) ?? 0) + 1)
  }

  const topTargets: AnalyticsTargetStat[] = Array.from(targetMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12)
    .map((target) => ({
      href: target.href,
      label: target.label,
      clicks: target.clicks,
      uniqueDays: target.dayKeys.size,
    }))

  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([source, clicks]) => ({ source, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12)

  const dailyClicks = buildDailySeries(clickEvents, boundedDays)
  const hourlyClicks = buildHourlySeries(clickEvents)
  const weeklyTrends = buildWeeklyTrends(clickEvents)

  const eventsBySession = new Map<string, AnalyticsEvent[]>()
  for (const event of publicEvents) {
    const list = eventsBySession.get(event.sessionId) ?? []
    list.push(event)
    eventsBySession.set(event.sessionId, list)
  }

  for (const list of eventsBySession.values()) {
    list.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
  }

  let landingSessions = 0
  let caseStudySessions = 0
  let contactSectionSessions = 0
  let contactClickSessions = 0

  const contentStats = new Map<string, {
    itemId: string
    label: string
    itemType: string
    opens: number
    totalViewMs: number
    sessions: Set<string>
    followThroughSessions: Set<string>
  }>()

  const outboundMap = new Map<string, { href: string; sourceContext: string; clicks: number; contactClicks: number }>()

  const pageSessionDepthMap = new Map<string, number[]>()
  const pageSessionMaxDepth = new Map<string, number>()

  const sectionMap = new Map<string, { views: number; sessions: Set<string>; dropOffSessions: Set<string> }>()

  const segmentByDevice = new Map<string, { sessions: Set<string>; clicks: number; contactClicks: number }>()
  const segmentBySource = new Map<string, { sessions: Set<string>; clicks: number; contactClicks: number }>()
  const segmentByCountry = new Map<string, { sessions: Set<string>; clicks: number; contactClicks: number }>()

  const byHour = new Map<string, number>()

  const pageViewsBySession = new Map<string, number>()
  const contactClicksBySession = new Set<string>()

  for (const [sessionId, sessionEvents] of eventsBySession.entries()) {
    const landing = sessionEvents.find((event) => event.eventName === "page_view" && event.path === "/")
    const caseStudy = sessionEvents.find(
      (event) =>
        (event.eventName === "page_view" && /^\/(apps|website|sites|labs)(\/|$)/.test(event.path)) ||
        (event.eventName === "section_view" && event.section.toLowerCase() === "case-studies"),
    )
    const contactView = sessionEvents.find((event) => event.eventName === "section_view" && event.section.toLowerCase() === "contact")
    const contactClick = sessionEvents.find((event) => event.eventName === "outbound_click" && isContactHref(event.href))

    if (landing) {
      landingSessions += 1
      if (caseStudy && new Date(caseStudy.occurredAt).getTime() >= new Date(landing.occurredAt).getTime()) {
        caseStudySessions += 1
      }
      if (caseStudy && contactView && new Date(contactView.occurredAt).getTime() >= new Date(caseStudy.occurredAt).getTime()) {
        contactSectionSessions += 1
      }
      if (caseStudy && contactView && contactClick && new Date(contactClick.occurredAt).getTime() >= new Date(contactView.occurredAt).getTime()) {
        contactClickSessions += 1
      }
    }

    const pageViews = sessionEvents.filter((event) => event.eventName === "page_view").length
    pageViewsBySession.set(sessionId, pageViews)

    if (sessionEvents.some((event) => event.eventName === "outbound_click" && isContactHref(event.href))) {
      contactClicksBySession.add(sessionId)
    }

    const firstEvent = sessionEvents[0]
    if (firstEvent) {
      const sourceLabel = firstEvent.meta.utmSource || firstEvent.meta.referrerHost || "direct"
      const deviceLabel = firstEvent.meta.device || "unknown"
      const countryLabel = firstEvent.meta.country || "unknown"

      const upsertSegment = (map: Map<string, { sessions: Set<string>; clicks: number; contactClicks: number }>, label: string) => {
        const current = map.get(label) ?? { sessions: new Set<string>(), clicks: 0, contactClicks: 0 }
        current.sessions.add(sessionId)
        map.set(label, current)
      }

      upsertSegment(segmentBySource, sourceLabel)
      upsertSegment(segmentByDevice, deviceLabel)
      upsertSegment(segmentByCountry, countryLabel)
    }

    let hasContactClick = false

    for (const event of sessionEvents) {
      if (isClickLike(event)) {
        const sourceBucket = segmentBySource.get(event.meta.utmSource || event.meta.referrerHost || "direct")
        if (sourceBucket) sourceBucket.clicks += 1

        const deviceBucket = segmentByDevice.get(event.meta.device || "unknown")
        if (deviceBucket) deviceBucket.clicks += 1

        const countryBucket = segmentByCountry.get(event.meta.country || "unknown")
        if (countryBucket) countryBucket.clicks += 1
      }

      if (event.eventName === "outbound_click") {
        const outboundKey = `${event.href}::${event.sourceContext || "unknown"}`
        const outboundCurrent = outboundMap.get(outboundKey)
        if (outboundCurrent) {
          outboundCurrent.clicks += 1
          if (isContactHref(event.href)) outboundCurrent.contactClicks += 1
        } else {
          outboundMap.set(outboundKey, {
            href: event.href,
            sourceContext: event.sourceContext || "unknown",
            clicks: 1,
            contactClicks: isContactHref(event.href) ? 1 : 0,
          })
        }

        if (isContactHref(event.href)) {
          hasContactClick = true
          const hourLabel = new Date(event.occurredAt).getHours().toString().padStart(2, "0")
          byHour.set(hourLabel, (byHour.get(hourLabel) ?? 0) + 1)

          const sourceBucket = segmentBySource.get(event.meta.utmSource || event.meta.referrerHost || "direct")
          if (sourceBucket) sourceBucket.contactClicks += 1
          const deviceBucket = segmentByDevice.get(event.meta.device || "unknown")
          if (deviceBucket) deviceBucket.contactClicks += 1
          const countryBucket = segmentByCountry.get(event.meta.country || "unknown")
          if (countryBucket) countryBucket.contactClicks += 1
        }
      }

      if (event.eventName === "gallery_item_open" && event.itemId) {
        const key = `${event.itemType || "gallery"}::${event.itemId}`
        const current = contentStats.get(key)
        if (current) {
          current.opens += 1
          current.sessions.add(sessionId)
        } else {
          contentStats.set(key, {
            itemId: event.itemId,
            label: event.label || event.itemId,
            itemType: event.itemType || "gallery",
            opens: 1,
            totalViewMs: 0,
            sessions: new Set([sessionId]),
            followThroughSessions: new Set(),
          })
        }
      }

      if (event.eventName === "gallery_item_view_time" && event.itemId) {
        const key = `${event.itemType || "gallery"}::${event.itemId}`
        const current = contentStats.get(key) ?? {
          itemId: event.itemId,
          label: event.label || event.itemId,
          itemType: event.itemType || "gallery",
          opens: 0,
          totalViewMs: 0,
          sessions: new Set<string>(),
          followThroughSessions: new Set<string>(),
        }
        current.totalViewMs += Math.max(0, event.durationMs)
        current.sessions.add(sessionId)
        contentStats.set(key, current)
      }

      if (event.eventName === "scroll_depth" && event.path) {
        const compositeKey = `${sessionId}::${event.path}`
        const currentMax = pageSessionMaxDepth.get(compositeKey) ?? 0
        pageSessionMaxDepth.set(compositeKey, Math.max(currentMax, event.value))
      }

      if (event.eventName === "section_view" && event.section) {
        const sectionKey = event.section.toLowerCase()
        const current = sectionMap.get(sectionKey) ?? { views: 0, sessions: new Set<string>(), dropOffSessions: new Set<string>() }
        current.views += 1
        current.sessions.add(sessionId)
        sectionMap.set(sectionKey, current)
      }
    }

    if (hasContactClick) {
      for (const stat of contentStats.values()) {
        if (stat.sessions.has(sessionId)) {
          stat.followThroughSessions.add(sessionId)
        }
      }
    }
  }

  for (const [compositeKey, maxDepth] of pageSessionMaxDepth.entries()) {
    const [, pathValue] = compositeKey.split("::")
    if (!pathValue) continue
    const current = pageSessionDepthMap.get(pathValue) ?? []
    current.push(maxDepth)
    pageSessionDepthMap.set(pathValue, current)
  }

  const scrollDepthByPage = Array.from(pageSessionDepthMap.entries())
    .map(([pathValue, values]) => ({
      path: pathValue,
      avgDepth: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)),
      p75Depth: Number(percentile(values, 75).toFixed(1)),
      sessions: values.length,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20)

  const sectionVisibility = Array.from(sectionMap.entries())
    .map(([section, data]) => {
      let dropOffSessions = 0
      for (const sessionId of data.sessions) {
        if (!contactClicksBySession.has(sessionId)) {
          dropOffSessions += 1
        }
      }

      return {
        section,
        views: data.views,
        uniqueSessions: data.sessions.size,
        dropOffRate: toRate(dropOffSessions, data.sessions.size),
      }
    })
    .sort((a, b) => b.uniqueSessions - a.uniqueSessions)

  const topContent = Array.from(contentStats.values())
    .map((stat) => ({
      itemId: stat.itemId,
      label: stat.label,
      itemType: stat.itemType,
      opens: stat.opens,
      avgViewSeconds: Number(safeDivision(stat.totalViewMs, Math.max(1, stat.opens)) / 1000).toFixed(2),
      contactFollowThroughRate: toRate(stat.followThroughSessions.size, Math.max(1, stat.sessions.size)),
    }))
    .map((entry) => ({ ...entry, avgViewSeconds: Number(entry.avgViewSeconds) }))
    .sort((a, b) => b.opens - a.opens)
    .slice(0, 20)

  const outboundQuality = Array.from(outboundMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20)

  const toSegmentRows = (map: Map<string, { sessions: Set<string>; clicks: number; contactClicks: number }>) =>
    Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        sessions: value.sessions.size,
        clicks: value.clicks,
        contactClicks: value.contactClicks,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 12)

  const byHourRows = Array.from({ length: 24 }).map((_, hour) => {
    const key = hour.toString().padStart(2, "0")
    return { hour: `${key}:00`, clicks: byHour.get(key) ?? 0 }
  })

  const cmsPublishEvents = events
    .filter((event) => event.eventName === "cms_publish")
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())

  const latestPublishAt = cmsPublishEvents[0]?.occurredAt ?? null

  const computeCtr = (startMs: number, endMs: number) => {
    let landingViews = 0
    let actionClicks = 0

    for (const event of publicEvents) {
      const eventMs = new Date(event.occurredAt).getTime()
      if (eventMs < startMs || eventMs >= endMs) continue

      if (event.eventName === "page_view" && event.path === "/") {
        landingViews += 1
      }

      if (event.eventName === "folder_tile_click" || (event.eventName === "outbound_click" && isContactHref(event.href))) {
        actionClicks += 1
      }
    }

    return safeDivision(actionClicks, Math.max(1, landingViews))
  }

  let beforeCtr = 0
  let afterCtr = 0
  let deltaPct = 0

  if (latestPublishAt) {
    const publishMs = new Date(latestPublishAt).getTime()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    beforeCtr = computeCtr(publishMs - sevenDaysMs, publishMs)
    afterCtr = computeCtr(publishMs, Math.min(Date.now(), publishMs + sevenDaysMs))
    deltaPct = beforeCtr > 0 ? Number((((afterCtr - beforeCtr) / beforeCtr) * 100).toFixed(2)) : 0
  }

  const vitalsEvents = publicEvents.filter((event) => event.eventName === "web_vital")
  const vitalsByPageMap = new Map<string, { lcp: number[]; inp: number[]; cls: number[]; sessions: Set<string> }>()

  const sessionVitalMap = new Map<string, { lcp: number; inp: number; cls: number }>()

  for (const event of vitalsEvents) {
    const metricName = event.meta.metricName
    const pathValue = event.path || "/"
    const current = vitalsByPageMap.get(pathValue) ?? { lcp: [], inp: [], cls: [], sessions: new Set<string>() }
    current.sessions.add(event.sessionId)

    if (metricName === "LCP") current.lcp.push(event.value)
    if (metricName === "INP") current.inp.push(event.value)
    if (metricName === "CLS") current.cls.push(event.value)
    vitalsByPageMap.set(pathValue, current)

    const sessionCurrent = sessionVitalMap.get(event.sessionId) ?? { lcp: 0, inp: 0, cls: 0 }
    if (metricName === "LCP") sessionCurrent.lcp = Math.max(sessionCurrent.lcp, event.value)
    if (metricName === "INP") sessionCurrent.inp = Math.max(sessionCurrent.inp, event.value)
    if (metricName === "CLS") sessionCurrent.cls = Math.max(sessionCurrent.cls, event.value)
    sessionVitalMap.set(event.sessionId, sessionCurrent)
  }

  const performanceByPage = Array.from(vitalsByPageMap.entries())
    .map(([pathValue, data]) => {
      const bounceSessions = Array.from(data.sessions).filter((sessionId) => {
        const views = pageViewsBySession.get(sessionId) ?? 0
        return views <= 1 && !contactClicksBySession.has(sessionId)
      }).length

      return {
        path: pathValue,
        lcp: Number((data.lcp.reduce((sum, value) => sum + value, 0) / Math.max(1, data.lcp.length)).toFixed(2)),
        inp: Number((data.inp.reduce((sum, value) => sum + value, 0) / Math.max(1, data.inp.length)).toFixed(2)),
        cls: Number((data.cls.reduce((sum, value) => sum + value, 0) / Math.max(1, data.cls.length)).toFixed(3)),
        samples: data.sessions.size,
        bounceRate: toRate(bounceSessions, Math.max(1, data.sessions.size)),
      }
    })
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 20)

  const poorSessions: string[] = []
  const goodSessions: string[] = []
  for (const [sessionId, vitals] of sessionVitalMap.entries()) {
    const poor = vitals.lcp > 2500 || vitals.inp > 200 || vitals.cls > 0.1
    if (poor) poorSessions.push(sessionId)
    else goodSessions.push(sessionId)
  }

  const poorBounces = poorSessions.filter((sessionId) => (pageViewsBySession.get(sessionId) ?? 0) <= 1 && !contactClicksBySession.has(sessionId)).length
  const goodBounces = goodSessions.filter((sessionId) => (pageViewsBySession.get(sessionId) ?? 0) <= 1 && !contactClicksBySession.has(sessionId)).length

  const performanceVitals = {
    byPage: performanceByPage,
    correlation: {
      poorVitalsBounceRate: toRate(poorBounces, Math.max(1, poorSessions.length)),
      goodVitalsBounceRate: toRate(goodBounces, Math.max(1, goodSessions.length)),
    },
  }

  const anomalyAlerts: string[] = []
  const hourlyValues = hourlyClicks.map((point) => point.clicks)
  if (hourlyValues.length >= 6) {
    const latest = hourlyValues[hourlyValues.length - 1] ?? 0
    const baseline = hourlyValues.slice(0, -1)
    const mean = baseline.reduce((sum, value) => sum + value, 0) / Math.max(1, baseline.length)
    const variance = baseline.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / Math.max(1, baseline.length)
    const stdDev = Math.sqrt(variance)

    if (latest > mean + stdDev * 3 && latest > 20) {
      anomalyAlerts.push("Traffic spike detected in the latest hour compared with baseline.")
    }
  }

  const botEvents = events.filter((event) => event.isBot).length
  const botSharePct = Number(toRate(botEvents, Math.max(1, totalEvents)).toFixed(2))
  if (botSharePct > 35) {
    anomalyAlerts.push("High bot share detected. Review filters before making traffic decisions.")
  }

  const funnel = {
    landingSessions,
    caseStudySessions,
    contactSectionSessions,
    contactClickSessions,
    landingToCaseRate: toRate(caseStudySessions, Math.max(1, landingSessions)),
    caseToContactRate: toRate(contactSectionSessions, Math.max(1, caseStudySessions)),
    contactToClickRate: toRate(contactClickSessions, Math.max(1, contactSectionSessions)),
  }

  if (funnel.contactToClickRate < 10 && funnel.contactSectionSessions > 20) {
    anomalyAlerts.push("Contact conversion from section view to click is below 10%.")
  }

  const recentEvents: AnalyticsRecentEvent[] = publicEvents
    .slice(0, 40)
    .map((event) => ({
      occurredAt: event.occurredAt,
      eventName: event.eventName,
      sourceContext: event.sourceContext,
      label: event.label,
      href: event.href,
      path: event.path,
    }))

  return {
    generatedAt: new Date().toISOString(),
    realTimeViews: realTimeSessions.size,
    totalEvents,
    totalClicks: clickEvents.length,
    last24hClicks,
    uniqueTargets: targetMap.size,
    topTargets,
    sourceBreakdown,
    dailyClicks,
    hourlyClicks,
    weeklyTrends,
    conversionFunnel: funnel,
    topContent,
    outboundQuality,
    scrollDepthByPage,
    sectionVisibility,
    audienceSegments: {
      byDevice: toSegmentRows(segmentByDevice),
      bySource: toSegmentRows(segmentBySource),
      byCountry: toSegmentRows(segmentByCountry),
      byHour: byHourRows,
    },
    contentImpact: {
      latestPublishAt,
      beforeCtr: Number((beforeCtr * 100).toFixed(2)),
      afterCtr: Number((afterCtr * 100).toFixed(2)),
      deltaPct,
    },
    performanceVitals,
    anomalyAlerts,
    botStats: {
      filteredEvents: botEvents,
      botSharePct,
    },
    recentEvents,
  }
}
