"use client"

import type { AnalyticsDevice, AnalyticsSource, RecordAnalyticsEventInput } from "@/lib/analytics-types"

const SESSION_KEY = "pantom_analytics_session"
const ANALYTICS_ENDPOINT = "/api/cms/event"
const FLUSH_INTERVAL_MS = 4000
const MAX_BATCH_SIZE = 20
const MAX_QUEUE_SIZE = 200

let queuedEvents: RecordAnalyticsEventInput[] = []
let flushTimerId: number | null = null
let isFlushing = false
let lifecycleListenersRegistered = false

function parseHost(value: string) {
  if (!value) return ""
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return ""
  }
}

function classifyDevice(userAgent: string): AnalyticsDevice {
  const ua = userAgent.toLowerCase()
  if (/ipad|tablet|nexus 7|nexus 10|sm-t|kindle/.test(ua)) return "tablet"
  if (/iphone|android|mobile|ipod/.test(ua)) return "mobile"
  if (/macintosh|windows|linux/.test(ua)) return "desktop"
  return "unknown"
}

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") return ""

  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing

  const next = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  window.localStorage.setItem(SESSION_KEY, next)
  return next
}

function getBaseMeta(): NonNullable<RecordAnalyticsEventInput["meta"]> {
  if (typeof window === "undefined") {
    return {
      referrer: "",
      referrerHost: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      locale: "",
      timezone: "",
      siteHost: "",
      siteOrigin: "",
      userAgent: "",
      device: "unknown",
    }
  }

  const params = new URLSearchParams(window.location.search)
  const referrer = document.referrer || ""
  const userAgent = navigator.userAgent || ""

  return {
    referrer,
    referrerHost: parseHost(referrer),
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    locale: navigator.language || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    siteHost: window.location.hostname.toLowerCase(),
    siteOrigin: window.location.origin,
    userAgent,
    device: classifyDevice(userAgent),
  }
}

function sendBatch(events: RecordAnalyticsEventInput[], preferBeacon: boolean) {
  if (events.length === 0) return Promise.resolve(true)

  const body = JSON.stringify({ events })

  if (preferBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) {
      return Promise.resolve(true)
    }
  }

  return fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  })
    .then((response) => response.ok)
    .catch(() => false)
}

function scheduleFlush() {
  if (typeof window === "undefined") return
  if (flushTimerId !== null) return
  if (queuedEvents.length === 0) return

  flushTimerId = window.setTimeout(() => {
    flushTimerId = null
    void flushQueue(false)
  }, FLUSH_INTERVAL_MS)
}

async function flushQueue(preferBeacon: boolean) {
  if (isFlushing || queuedEvents.length === 0) return
  isFlushing = true

  try {
    while (queuedEvents.length > 0) {
      const batch = queuedEvents.slice(0, MAX_BATCH_SIZE)
      const ok = await sendBatch(batch, preferBeacon)
      if (!ok) break
      queuedEvents = queuedEvents.slice(batch.length)
      if (preferBeacon) break
    }
  } finally {
    isFlushing = false
  }

  if (queuedEvents.length > 0) {
    scheduleFlush()
  }
}

function registerLifecycleFlushListeners() {
  if (lifecycleListenersRegistered || typeof window === "undefined") return
  lifecycleListenersRegistered = true

  const flushNow = () => {
    void flushQueue(true)
  }

  window.addEventListener("pagehide", flushNow)
  window.addEventListener("beforeunload", flushNow)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushNow()
    }
  })
}

export function sendAnalyticsEvent(event: RecordAnalyticsEventInput) {
  if (typeof window === "undefined") return

  const payload: RecordAnalyticsEventInput = {
    ...event,
    sessionId: event.sessionId || getAnalyticsSessionId(),
    path: event.path || window.location.pathname,
    occurredAt: event.occurredAt || new Date().toISOString(),
    meta: {
      ...getBaseMeta(),
      ...event.meta,
    },
  }

  registerLifecycleFlushListeners()

  queuedEvents.push(payload)
  if (queuedEvents.length > MAX_QUEUE_SIZE) {
    queuedEvents = queuedEvents.slice(queuedEvents.length - MAX_QUEUE_SIZE)
  }

  if (queuedEvents.length >= MAX_BATCH_SIZE) {
    void flushQueue(false)
    return
  }

  scheduleFlush()
}

export function sendAnalyticsClick(payload: {
  source: AnalyticsSource
  sourceContext: string
  label: string
  href: string
  section?: string
  itemId?: string
  itemType?: string
}) {
  sendAnalyticsEvent({
    eventName: payload.source === "folder" ? "folder_tile_click" : payload.source === "nav" ? "nav_click" : payload.source === "command" ? "command_click" : "click",
    source: payload.source,
    sourceContext: payload.sourceContext,
    label: payload.label,
    href: payload.href,
    section: payload.section,
    itemId: payload.itemId,
    itemType: payload.itemType,
  })
}
