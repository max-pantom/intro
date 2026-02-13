import { NextResponse } from "next/server"

import { recordAnalyticsClick } from "@/lib/analytics-server"

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        source?: string
        label?: string
        href?: string
      }
    | null

  if (!payload?.label || !payload?.href) {
    return NextResponse.json({ error: "Missing click payload." }, { status: 400 })
  }

  await recordAnalyticsClick({
    source: payload.source ?? "other",
    label: payload.label,
    href: payload.href,
  })

  return NextResponse.json({ ok: true })
}
