import { NextResponse } from "next/server"

type IntakePayload = {
  building?: string
  stage?: string
  timeline?: string
  budget?: string
  name?: string
  email?: string
  brief?: string
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as IntakePayload | null

  const building = clean(payload?.building)
  const stage = clean(payload?.stage)
  const timeline = clean(payload?.timeline)
  const budget = clean(payload?.budget)
  const name = clean(payload?.name)
  const email = clean(payload?.email)
  const brief = clean(payload?.brief)

  const hasValidEmail = /\S+@\S+\.\S+/.test(email)

  if (!building || !stage || !timeline || !budget || !name || !email || !brief || !hasValidEmail) {
    return NextResponse.json({ error: "Invalid intake payload." }, { status: 400 })
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  const toEmail = process.env.INTAKE_TO_EMAIL?.trim() || "metagravity0@gmail.com"
  const fromEmail = process.env.INTAKE_FROM_EMAIL?.trim() || "onboarding@resend.dev"

  if (!resendApiKey) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 503 })
  }

  const submittedAt = new Date().toISOString()

  const text = [
    "New /start application",
    "",
    `Submitted at: ${submittedAt}`,
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    `What are we building?: ${building}`,
    `Current stage: ${stage}`,
    `Timeline: ${timeline}`,
    `Budget: ${budget}`,
    "",
    "Brief:",
    brief,
  ].join("\n")

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `New start application from ${name}`,
      text,
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
