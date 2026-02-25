import { NextResponse } from "next/server"

type BriefPayload = {
  name?: string
  email?: string
  productName?: string
  website?: string
  whatDoesItDo?: string
  whoIsItFor?: string
  whatProblem?: string
  understandIn5Sec?: string
  whatMakesDifferent?: string
  oneAction?: string
  otherAction?: string
  brandThreeWords?: string
  websitesLike?: string
  assets?: string[]
  uploadNote?: string
  anythingImportant?: string
  agreement?: boolean
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function cleanArr(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as BriefPayload | null

  const name = clean(payload?.name)
  const email = clean(payload?.email)
  const productName = clean(payload?.productName)
  const website = clean(payload?.website)
  const whatDoesItDo = clean(payload?.whatDoesItDo)
  const whoIsItFor = clean(payload?.whoIsItFor)
  const whatProblem = clean(payload?.whatProblem)
  const understandIn5Sec = clean(payload?.understandIn5Sec)
  const whatMakesDifferent = clean(payload?.whatMakesDifferent)
  const oneAction = clean(payload?.oneAction)
  const otherAction = clean(payload?.otherAction)
  const brandThreeWords = clean(payload?.brandThreeWords)
  const websitesLike = clean(payload?.websitesLike)
  const assets = cleanArr(payload?.assets)
  const uploadNote = clean(payload?.uploadNote)
  const anythingImportant = clean(payload?.anythingImportant)
  const agreement = payload?.agreement === true

  const hasValidEmail = /\S+@\S+\.\S+/.test(email)

  if (
    !name ||
    !email ||
    !hasValidEmail ||
    !productName ||
    !whatDoesItDo ||
    !whoIsItFor ||
    !whatProblem ||
    !understandIn5Sec ||
    !whatMakesDifferent ||
    !oneAction ||
    !brandThreeWords ||
    !agreement
  ) {
    return NextResponse.json({ error: "Invalid brief payload." }, { status: 400 })
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  const toEmail = process.env.INTAKE_TO_EMAIL?.trim() || "metagravity0@gmail.com"
  const fromEmail = process.env.INTAKE_FROM_EMAIL?.trim() || "onboarding@resend.dev"

  if (!resendApiKey) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 503 })
  }

  const submittedAt = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })
  const oneActionLine = oneAction === "Other" && otherAction ? `Other: ${otherAction}` : oneAction

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Launch brief from ${escapeHtml(name)}</title>
</head>
<body style="margin:0; padding:24px; font-family: system-ui, -apple-system, sans-serif; font-size:15px; line-height:1.5; color:#1a1a1a; max-width:560px;">
  <h1 style="margin:0 0 8px; font-size:22px; font-weight:600;">New Founders Launch Brief</h1>
  <p style="margin:0 0 24px; font-size:13px; color:#666;">Submitted ${escapeHtml(submittedAt)}</p>

  <section style="margin-bottom:24px;">
    <h2 style="margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#444;">Basics</h2>
    <table style="width:100%; border-collapse:collapse;">
      <tr><td style="padding:6px 0; border-bottom:1px solid #eee; font-weight:500; width:120px;">Name</td><td style="padding:6px 0; border-bottom:1px solid #eee;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #eee; font-weight:500;">Email</td><td style="padding:6px 0; border-bottom:1px solid #eee;"><a href="mailto:${escapeHtml(email)}" style="color:#2067FF;">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #eee; font-weight:500;">Product</td><td style="padding:6px 0; border-bottom:1px solid #eee;">${escapeHtml(productName)}</td></tr>
      ${website ? `<tr><td style="padding:6px 0; border-bottom:1px solid #eee; font-weight:500;">Website</td><td style="padding:6px 0; border-bottom:1px solid #eee;"><a href="${escapeHtml(website)}" style="color:#2067FF;">${escapeHtml(website)}</a></td></tr>` : ""}
    </table>
  </section>

  <section style="margin-bottom:24px;">
    <h2 style="margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#444;">The Product</h2>
    <ul style="margin:0; padding-left:20px;">
      <li style="margin-bottom:8px;"><strong>What does it do?</strong><br/>${escapeHtml(whatDoesItDo)}</li>
      <li style="margin-bottom:8px;"><strong>Who is it for?</strong><br/>${escapeHtml(whoIsItFor)}</li>
      <li style="margin-bottom:8px;"><strong>What problem does it solve?</strong><br/>${escapeHtml(whatProblem)}</li>
    </ul>
  </section>

  <section style="margin-bottom:24px;">
    <h2 style="margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#444;">The Message</h2>
    <ul style="margin:0; padding-left:20px;">
      <li style="margin-bottom:8px;"><strong>5-second takeaway</strong><br/>${escapeHtml(understandIn5Sec)}</li>
      <li style="margin-bottom:8px;"><strong>What makes you different</strong><br/>${escapeHtml(whatMakesDifferent)}</li>
      <li style="margin-bottom:8px;"><strong>One action</strong><br/>${escapeHtml(oneActionLine)}</li>
    </ul>
  </section>

  <section style="margin-bottom:24px;">
    <h2 style="margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#444;">Direction</h2>
    <p style="margin:0 0 8px;"><strong>Brand in 3 words:</strong> ${escapeHtml(brandThreeWords)}</p>
    ${websitesLike ? `<p style="margin:0;"><strong>Websites they like:</strong><br/>${escapeHtml(websitesLike)}</p>` : ""}
  </section>

  <section style="margin-bottom:24px;">
    <h2 style="margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#444;">Assets</h2>
    <p style="margin:0 0 8px;">${assets.length ? escapeHtml(assets.join(", ")) : "None selected"}</p>
    ${uploadNote ? `<p style="margin:0;"><strong>Note:</strong> ${escapeHtml(uploadNote)}</p>` : ""}
  </section>

  ${anythingImportant ? `
  <section style="margin-bottom:24px;">
    <h2 style="margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#444;">Anything else</h2>
    <p style="margin:0;">${escapeHtml(anythingImportant)}</p>
  </section>
  ` : ""}

  <p style="margin:24px 0 0; font-size:13px; color:#888;">— Founders brief form</p>
</body>
</html>
  `.trim()

  const text = [
    "New Founders Launch Brief",
    "",
    `Submitted at: ${submittedAt}`,
    "",
    "--- Basics ---",
    `Name: ${name}`,
    `Email: ${email}`,
    `Product / Company: ${productName}`,
    website ? `Website: ${website}` : null,
    "",
    "--- The Product ---",
    `What does it do?: ${whatDoesItDo}`,
    `Who is it for?: ${whoIsItFor}`,
    `What problem does it solve?: ${whatProblem}`,
    "",
    "--- The Message ---",
    `Understand in 5 sec: ${understandIn5Sec}`,
    `What makes different: ${whatMakesDifferent}`,
    `ONE action: ${oneActionLine}`,
    "",
    "--- Direction ---",
    `Brand in 3 words: ${brandThreeWords}`,
    websitesLike ? `Websites they like: ${websitesLike}` : null,
    "",
    "--- Assets ---",
    assets.length ? `Have: ${assets.join(", ")}` : "Have: (none selected)",
    uploadNote ? `Upload note: ${uploadNote}` : null,
    "",
    "--- Final ---",
    anythingImportant ? `Extra: ${anythingImportant}` : null,
  ]
    .filter(Boolean)
    .join("\n")

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
      subject: `Launch brief from ${name} (${productName})`,
      html,
      text,
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 })
  }

  const { decrementFoundersSlots } = await import("@/lib/founders-slots")
  await decrementFoundersSlots()

  return NextResponse.json({ ok: true })
}
