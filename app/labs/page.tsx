import { readdir } from "node:fs/promises"
import path from "node:path"

import { LabsContent } from "@/app/labs/labs-content"
import { StudioFrame } from "@/components/studio/studio-frame"
import { getCmsPublicData } from "@/lib/cms-server"

const LAB_IMAGES_DIR = path.join(process.cwd(), "public", "lab-images")
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)$/i

async function getLabImagePaths() {
  try {
    const entries = await readdir(LAB_IMAGES_DIR, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && IMAGE_FILE_PATTERN.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((name) => `/lab-images/${name}`)
  } catch {
    return []
  }
}

export default async function LabsPage() {
  const cmsData = await getCmsPublicData()
  const labImages = cmsData.galleries.labs.length > 0 ? cmsData.galleries.labs : await getLabImagePaths()

  return (
    <StudioFrame
      navOverride="labs"
      backgroundColor="#D6282E"
      headerTone="light"
      headerClassName="px-4 md:px-[22px]"
    >
      <main className="pantom-scrollbar h-full overflow-y-auto px-4 pb-4 pt-[200px] md:px-[22px] md:pb-7 md:pt-[286px]">
        <LabsContent labImages={labImages} />

        {labImages.length === 0 ? (
          <p className="pt-4 text-center font-mono text-[12px] tracking-[0.06em] text-[#ffd5d8]">Add images to `public/lab-images`.</p>
        ) : null}
      </main>
    </StudioFrame>
  )
}
