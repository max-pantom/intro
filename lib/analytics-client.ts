"use client"

import type { AnalyticsDevice, AnalyticsSource, RecordAnalyticsEventInput } from "@/lib/analytics-types"

const SESSION_KEY = "pantom_analytics_session"

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
    userAgent,
    device: classifyDevice(userAgent),
  }
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

  const body = JSON.stringify(payload)

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon("/api/cms/event", blob)) {
      return
    }
  }

  void fetch("/api/cms/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined)
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
