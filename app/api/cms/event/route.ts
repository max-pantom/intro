import { NextResponse } from "next/server"

import { recordAnalyticsEvent } from "@/lib/analytics-server"

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
          userAgent?: string
          metricName?: string
        }
      }
    | null

  if (!payload?.eventName) {
    return NextResponse.json({ error: "Missing event name." }, { status: 400 })
  }

  await recordAnalyticsEvent(
    {
      eventName: payload.eventName,
      sessionId: payload.sessionId,
      path: payload.path,
      source: payload.source as
        | "nav"
        | "folder"
        | "command"
        | "gallery"
        | "outbound"
        | "section"
        | "scroll"
        | "performance"
        | "system"
        | "other"
        | undefined,
      sourceContext: payload.sourceContext,
      label: payload.label,
      href: payload.href,
      section: payload.section,
      itemId: payload.itemId,
      itemType: payload.itemType,
      value: payload.value,
      durationMs: payload.durationMs,
      occurredAt: payload.occurredAt,
      meta: payload.meta,
    },
    request.headers,
  )

  return NextResponse.json({ ok: true })
}
