import { readdir } from "node:fs/promises"
import path from "node:path"

import { AppsContent } from "@/app/apps/apps-content"
import { StudioFrame } from "@/components/studio/studio-frame"
import { getCmsPublicData } from "@/lib/cms-server"

export const dynamic = "force-dynamic"

const APPS_IMAGES_DIR = path.join(process.cwd(), "public", "apps-images")
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)$/i
const MIN_VISIBLE_CARDS = 8

async function getAppsImagePaths() {
  try {
    const entries = await readdir(APPS_IMAGES_DIR, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && IMAGE_FILE_PATTERN.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((name) => `/apps-images/${name}`)
  } catch {
    return []
  }
}

export default async function AppsPage() {
  const cmsData = await getCmsPublicData()
  const appsImages = cmsData.galleries.apps.length > 0 ? cmsData.galleries.apps : await getAppsImagePaths()
  const cardsToRender = Math.max(appsImages.length, MIN_VISIBLE_CARDS)

  return (
    <StudioFrame navOverride="home" headerClassName="px-5 md:px-6">
      <AppsContent appsImages={appsImages} cardsToRender={cardsToRender} />
    </StudioFrame>
  )
}
