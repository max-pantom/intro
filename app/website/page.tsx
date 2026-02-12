import { readdir } from "node:fs/promises"
import path from "node:path"

import { WebsiteContent } from "@/app/website/website-content"
import { StudioFrame } from "@/components/studio/studio-frame"
import { getCmsPublicData } from "@/lib/cms-server"

const WEBSITE_IMAGES_DIR = path.join(process.cwd(), "public", "website-images")
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)$/i

async function getWebsiteImagePaths() {
  try {
    const entries = await readdir(WEBSITE_IMAGES_DIR, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && IMAGE_FILE_PATTERN.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((name) => `/website-images/${name}`)
  } catch {
    return []
  }
}

export default async function WebsitePage() {
  const cmsData = await getCmsPublicData()
  const websiteImages = cmsData.galleries.website.length > 0 ? cmsData.galleries.website : await getWebsiteImagePaths()

  return (
    <StudioFrame navOverride="home" headerClassName="px-5 md:px-6">
      <WebsiteContent websiteImages={websiteImages} />
    </StudioFrame>
  )
}
