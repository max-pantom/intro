import { NextResponse } from "next/server"

import { recordAnalyticsEvent } from "@/lib/analytics-server"

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        source?: string
        sourceContext?: string
        label?: string
        href?: string
        path?: string
        sessionId?: string
        section?: string
        itemId?: string
        itemType?: string
        meta?: {
          referrer?: string
          referrerHost?: string
          utmSource?: string
          utmMedium?: string
          utmCampaign?: string
          locale?: string
          timezone?: string
          userAgent?: string
        }
      }
    | null

  if (!payload?.label && !payload?.href) {
    return NextResponse.json({ error: "Missing click payload." }, { status: 400 })
  }

  await recordAnalyticsEvent(
    {
      eventName: "click",
      source: payload.source === "nav" || payload.source === "folder" || payload.source === "command" ? payload.source : "other",
      sourceContext: payload.sourceContext ?? payload.source ?? "click",
      label: payload.label ?? "",
      href: payload.href ?? "",
      path: payload.path,
      sessionId: payload.sessionId,
      section: payload.section,
      itemId: payload.itemId,
      itemType: payload.itemType,
      meta: payload.meta,
    },
    request.headers,
  )

  return NextResponse.json({ ok: true })
}
