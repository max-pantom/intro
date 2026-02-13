import type { AnalyticsSource } from "@/lib/analytics-types"

type TrackClickPayload = {
  source: AnalyticsSource
  label: string
  href: string
}

function sanitizeValue(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength)
}

export function trackCmsClick(payload: TrackClickPayload) {
  const source = payload.source
  const label = sanitizeValue(payload.label, 120)
  const href = sanitizeValue(payload.href, 500)

  if (!label || !href) return

  const body = JSON.stringify({ source, label, href })

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" })
    const sent = navigator.sendBeacon("/api/cms/click", blob)
    if (sent) return
  }

  void fetch("/api/cms/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined)
}
