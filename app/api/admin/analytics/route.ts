import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getAnalyticsSummary } from "@/lib/analytics-server"

const CMS_COOKIE = "cms_admin"

async function isAuthorized() {
  const cookieStore = await cookies()
  return cookieStore.get(CMS_COOKIE)?.value === "1"
}

export async function GET(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const daysParam = new URL(request.url).searchParams.get("days")
  const parsedDays = Number(daysParam)
  const days = Number.isFinite(parsedDays) ? parsedDays : 14

  const summary = await getAnalyticsSummary(days)
  return NextResponse.json(summary)
}
