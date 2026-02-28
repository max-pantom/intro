import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { insertStartEmailLog } from "@/lib/start-email-log"

const CMS_COOKIE = "cms_admin"

async function isAuthorized() {
  const cookieStore = await cookies()
  return cookieStore.get(CMS_COOKIE)?.value === "1"
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const START_FORM_URL = "https://www.pantom.design/start"

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { email?: string; firstName?: string } | null
  const email = typeof body?.email === "string" ? body.email.trim() : ""
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() || undefined : undefined

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  if (!resendApiKey) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 503 })
  }

  const name = firstName ? ` ${firstName}` : ""
  const subject = "Quick step before our call"
  const html = `
    <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
      <p>Hi${name},</p>
      <p>Thanks for booking time with Pantom.</p>
      <p>
        Before our call, please complete this short project form so I can review your context properly and prepare ahead of time:
      </p>
      <p><a href="${START_FORM_URL}">${START_FORM_URL}</a></p>
      <p>It's an important step in how we structure our engagements and helps us use our time well.</p>
      <p>Looking forward to our conversation.<br/><br/>Max<br/>Pantom</p>
    </div>
  `

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "Pantom <hello@pantom.design>",
      to: [email],
      reply_to: "max@pantom.design",
      subject,
      html,
    }),
  })

  if (!response.ok) {
    await insertStartEmailLog({
      email,
      firstName: firstName ?? null,
      sentBy: "admin",
      status: "failed",
    })
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 })
  }

  await insertStartEmailLog({
    email,
    firstName: firstName ?? null,
    sentBy: "admin",
    status: "sent",
  })

  return NextResponse.json({ success: true })
}
