"use client"

import type { AnalyticsSource } from "@/lib/analytics-types"
import { sendAnalyticsClick } from "@/lib/analytics-client"

type TrackClickPayload = {
  source: AnalyticsSource
  label: string
  href: string
  sourceContext?: string
  section?: string
  itemId?: string
  itemType?: string
}

function sanitizeValue(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength)
}

export function trackCmsClick(payload: TrackClickPayload) {
  const source = payload.source
  const label = sanitizeValue(payload.label, 120)
  const href = sanitizeValue(payload.href, 500)

  if (!label || !href) return

  sendAnalyticsClick({
    source,
    sourceContext: payload.sourceContext ?? source,
    label,
    href,
    section: payload.section,
    itemId: payload.itemId,
    itemType: payload.itemType,
  })
}
