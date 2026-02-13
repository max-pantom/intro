import { NextResponse } from "next/server"

import { recordAnalyticsEvent } from "@/lib/analytics-server"
import type { AnalyticsDevice, AnalyticsSource } from "@/lib/analytics-types"

const ANALYTICS_SOURCES: AnalyticsSource[] = ["nav", "folder", "command", "gallery", "outbound", "section", "scroll", "performance", "system", "other"]
const ANALYTICS_METRICS = ["LCP", "INP", "CLS", "OTHER", ""] as const
const ANALYTICS_DEVICES: AnalyticsDevice[] = ["mobile", "tablet", "desktop", "bot", "unknown"]

function normalizeSource(value?: string): AnalyticsSource | undefined {
  if (!value) return undefined
  return ANALYTICS_SOURCES.includes(value as AnalyticsSource) ? (value as AnalyticsSource) : undefined
}

function normalizeMetricName(value?: string): "LCP" | "INP" | "CLS" | "OTHER" | "" | undefined {
  if (typeof value !== "string") return undefined
  return ANALYTICS_METRICS.includes(value as (typeof ANALYTICS_METRICS)[number])
    ? (value as "LCP" | "INP" | "CLS" | "OTHER" | "")
    : undefined
}

function normalizeDevice(value?: string): AnalyticsDevice | undefined {
  if (!value) return undefined
  return ANALYTICS_DEVICES.includes(value as AnalyticsDevice) ? (value as AnalyticsDevice) : undefined
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        eventName?: string
        sessionId?: string
        path?: string
        source?: string
        sourceContext?: string
        label?: string
        href?: string
        section?: string
        itemId?: string
        itemType?: string
        value?: number
        durationMs?: number
        occurredAt?: string
        meta?: {
          referrer?: string
          referrerHost?: string
          utmSource?: string
          utmMedium?: string
          utmCampaign?: string
          locale?: string
          timezone?: string
          country?: string
          city?: string
          siteHost?: string
          siteOrigin?: string
          userAgent?: string
          device?: string
          metricName?: string
        }
      }
    | null

  if (!payload?.eventName) {
    return NextResponse.json({ error: "Missing event name." }, { status: 400 })
  }

  const normalizedMeta = payload.meta
    ? {
        referrer: payload.meta.referrer,
        referrerHost: payload.meta.referrerHost,
        utmSource: payload.meta.utmSource,
        utmMedium: payload.meta.utmMedium,
        utmCampaign: payload.meta.utmCampaign,
        locale: payload.meta.locale,
        timezone: payload.meta.timezone,
        country: payload.meta.country,
        city: payload.meta.city,
        siteHost: payload.meta.siteHost,
        siteOrigin: payload.meta.siteOrigin,
        userAgent: payload.meta.userAgent,
        device: normalizeDevice(payload.meta.device),
        metricName: normalizeMetricName(payload.meta.metricName),
      }
    : undefined

  await recordAnalyticsEvent(
    {
      eventName: payload.eventName,
      sessionId: payload.sessionId,
      path: payload.path,
      source: normalizeSource(payload.source),
      sourceContext: payload.sourceContext,
      label: payload.label,
      href: payload.href,
      section: payload.section,
      itemId: payload.itemId,
      itemType: payload.itemType,
      value: payload.value,
      durationMs: payload.durationMs,
      occurredAt: payload.occurredAt,
      meta: normalizedMeta,
    },
    request.headers,
  )

  return NextResponse.json({ ok: true })
}
