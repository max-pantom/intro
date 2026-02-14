"use client"

import type { CmsPublicData } from "@/lib/cms-types"

const CMS_CACHE_TTL_MS = 60_000

let cachedData: CmsPublicData | null = null
let cachedAt = 0
let inFlightRequest: Promise<CmsPublicData | null> | null = null

export function getCachedCmsPublicData() {
  if (!cachedData) return null
  if (Date.now() - cachedAt > CMS_CACHE_TTL_MS) return null
  return cachedData
}

export async function fetchCmsPublicData() {
  const cached = getCachedCmsPublicData()
  if (cached) return cached
  if (inFlightRequest) return inFlightRequest

  inFlightRequest = fetch("/api/cms/public", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) return null
      return response.json() as Promise<CmsPublicData>
    })
    .then((payload) => {
      if (payload) {
        cachedData = payload
        cachedAt = Date.now()
      }
      return payload
    })
    .catch(() => null)
    .finally(() => {
      inFlightRequest = null
    })

  return inFlightRequest
}
