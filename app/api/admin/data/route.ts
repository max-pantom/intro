import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getCmsPublicData, saveCmsPublicData } from "@/lib/cms-server"

const CMS_COOKIE = "cms_admin"

async function isAuthorized() {
  const cookieStore = await cookies()
  return cookieStore.get(CMS_COOKIE)?.value === "1"
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await getCmsPublicData()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const next = await saveCmsPublicData(payload)
  return NextResponse.json(next)
}
