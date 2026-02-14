import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const CMS_COOKIE = "cms_admin"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string }
  const expectedPassword = process.env.CMS_ADMIN_PASSWORD

  if (!expectedPassword) {
    return NextResponse.json({ error: "CMS_ADMIN_PASSWORD is not configured." }, { status: 500 })
  }

  if (!body.password || body.password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(CMS_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return NextResponse.json({ ok: true })
}
