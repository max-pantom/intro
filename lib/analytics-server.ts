import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { sql } from "@vercel/postgres"

import type { AnalyticsClickEvent, AnalyticsSource, AnalyticsSummary } from "@/lib/analytics-types"

const ANALYTICS_DIR = path.join(process.cwd(), "data")
const ANALYTICS_PATH = path.join(ANALYTICS_DIR, "analytics-clicks.json")
const MAX_STORED_EVENTS = 8000

type RecordClickInput = {
  source: string
  label: string
  href: string
}

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
    CREATE TABLE IF NOT EXISTS cms_click_events (
      id BIGSERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

function sanitizeSource(value: string): AnalyticsSource {
  if (value === "nav" || value === "folder" || value === "command") return value
  return "other"
}

function sanitizeText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength)
}

function normalizeEvent(event: Partial<AnalyticsClickEvent>): AnalyticsClickEvent | null {
  const occurredAt = typeof event.occurredAt === "string" ? event.occurredAt : ""
  const label = typeof event.label === "string" ? sanitizeText(event.label, 120) : ""
  const href = typeof event.href === "string" ? sanitizeText(event.href, 500) : ""
  const source = typeof event.source === "string" ? sanitizeSource(event.source) : "other"

  if (!occurredAt || !label || !href) return null
  if (Number.isNaN(new Date(occurredAt).getTime())) return null

  return { occurredAt, label, href, source }
}

async function readLocalEvents(): Promise<AnalyticsClickEvent[]> {
  try {
    const raw = await readFile(ANALYTICS_PATH, "utf8")
    const payload = JSON.parse(raw)
    if (!Array.isArray(payload)) return []

    return payload
      .map((entry) => normalizeEvent(entry as Partial<AnalyticsClickEvent>))
      .filter((entry): entry is AnalyticsClickEvent => Boolean(entry))
  } catch {
    return []
  }
}

async function writeLocalEvents(events: AnalyticsClickEvent[]) {
  await mkdir(ANALYTICS_DIR, { recursive: true })
  await writeFile(ANALYTICS_PATH, `${JSON.stringify(events, null, 2)}\n`, "utf8")
}

export async function recordAnalyticsClick(input: RecordClickInput) {
  const source = sanitizeSource(input.source)
  const label = sanitizeText(input.label, 120)
  const href = sanitizeText(input.href, 500)

  if (!label || !href) return

  if (hasPostgresConfig()) {
    try {
      ensurePostgresEnvAlias()
      await ensureAnalyticsTable()
      await sql`
        INSERT INTO cms_click_events (source, label, href)
        VALUES (${source}, ${label}, ${href})
      `
      return
    } catch {
      // Fall through to local file storage.
    }
  }

  const events = await readLocalEvents()
  events.push({
    occurredAt: new Date().toISOString(),
    source,
    label,
    href,
  })

  const trimmed = events.slice(-MAX_STORED_EVENTS)
  await writeLocalEvents(trimmed)
}

async function readAnalyticsEvents(limit = MAX_STORED_EVENTS): Promise<AnalyticsClickEvent[]> {
  if (hasPostgresConfig()) {
    try {
      ensurePostgresEnvAlias()
      await ensureAnalyticsTable()
      const result = await sql<{ source: string; label: string; href: string; occurred_at: Date }>`
        SELECT source, label, href, occurred_at
        FROM cms_click_events
        ORDER BY occurred_at DESC
        LIMIT ${limit}
      `

      return result.rows
        .map((row) => ({
          occurredAt: new Date(row.occurred_at).toISOString(),
          source: sanitizeSource(row.source),
          label: sanitizeText(row.label, 120),
          href: sanitizeText(row.href, 500),
        }))
        .filter((event) => event.label && event.href)
    } catch {
      // Fall through to local file storage.
    }
  }

  const events = await readLocalEvents()
  return events.slice(-limit).reverse()
}

function buildDailySeries(events: AnalyticsClickEvent[], days: number) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  const labels: Array<{ key: string; label: string }> = []
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const key = date.toISOString().slice(0, 10)
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    labels.push({ key, label })
  }

  const counts = new Map(labels.map((entry) => [entry.key, 0]))
  for (const event of events) {
    const key = event.occurredAt.slice(0, 10)
    if (!counts.has(key)) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return labels.map((entry) => ({
    label: entry.label,
    clicks: counts.get(entry.key) ?? 0,
  }))
}

function buildHourlySeries(events: AnalyticsClickEvent[]) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 23 * 60 * 60 * 1000)

  const buckets: Array<{ label: string; clicks: number; bucketTime: Date }> = []
  for (let offset = 0; offset < 24; offset += 1) {
    const bucketTime = new Date(windowStart.getTime() + offset * 60 * 60 * 1000)
    bucketTime.setMinutes(0, 0, 0)
    buckets.push({
      label: bucketTime.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      clicks: 0,
      bucketTime,
    })
  }

  for (const event of events) {
    const timestamp = new Date(event.occurredAt).getTime()
    for (const bucket of buckets) {
      const start = bucket.bucketTime.getTime()
      const end = start + 60 * 60 * 1000
      if (timestamp >= start && timestamp < end) {
        bucket.clicks += 1
        break
      }
    }
  }

  return buckets.map(({ label, clicks }) => ({ label, clicks }))
}

export async function getAnalyticsSummary(days = 14): Promise<AnalyticsSummary> {
  const boundedDays = Math.min(60, Math.max(7, Math.floor(days)))
  const events = await readAnalyticsEvents()

  const totalClicks = events.length
  const nowMs = Date.now()
  const dayAgoMs = nowMs - 24 * 60 * 60 * 1000

  let last24hClicks = 0
  const targetCounts = new Map<string, { href: string; label: string; clicks: number; dayKeys: Set<string> }>()
  const sourceCounts = new Map<AnalyticsSource, number>([
    ["nav", 0],
    ["folder", 0],
    ["command", 0],
    ["other", 0],
  ])

  for (const event of events) {
    const eventMs = new Date(event.occurredAt).getTime()
    if (!Number.isNaN(eventMs) && eventMs >= dayAgoMs) {
      last24hClicks += 1
    }

    sourceCounts.set(event.source, (sourceCounts.get(event.source) ?? 0) + 1)

    const key = event.href
    const current = targetCounts.get(key)
    if (current) {
      current.clicks += 1
      current.dayKeys.add(event.occurredAt.slice(0, 10))
      continue
    }

    targetCounts.set(key, {
      href: event.href,
      label: event.label,
      clicks: 1,
      dayKeys: new Set([event.occurredAt.slice(0, 10)]),
    })
  }

  const topTargets = Array.from(targetCounts.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
    .map((target) => ({
      href: target.href,
      label: target.label,
      clicks: target.clicks,
      uniqueDays: target.dayKeys.size,
    }))

  const sourceBreakdown = Array.from(sourceCounts.entries()).map(([source, clicks]) => ({ source, clicks }))

  return {
    totalClicks,
    last24hClicks,
    uniqueTargets: targetCounts.size,
    topTargets,
    sourceBreakdown,
    dailyClicks: buildDailySeries(events, boundedDays),
    hourlyClicks: buildHourlySeries(events),
    recentEvents: events.slice(0, 20),
  }
}
