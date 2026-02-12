import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const CMS_COOKIE = "cms_admin"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(CMS_COOKIE)
  return NextResponse.json({ ok: true })
}
