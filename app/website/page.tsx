import { readdir } from "node:fs/promises"
import path from "node:path"

import { FolderIcon } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"

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
  const websiteImages = await getWebsiteImagePaths()

  return (
    <StudioFrame navOverride="home" headerClassName="px-5 md:px-6">
      <div className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2">
        <FolderIcon color="graphite" className="h-[76px] w-[92px]" />
      </div>

      <main className="h-full overflow-y-auto px-5 pb-8 pt-[170px] md:px-6 md:pb-10 md:pt-[196px]">
        <section className="flex w-full flex-col gap-5">
          {websiteImages.length > 0 ? (
            websiteImages.map((src) => (
              <article key={src} className="overflow-hidden bg-[#d9d9d9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="block h-auto w-full" draggable={false} loading="lazy" />
              </article>
            ))
          ) : (
            <>
              <div className="aspect-[16/9] w-full bg-[#d9d9d9]" />
              <div className="aspect-[16/9] w-full bg-[#d9d9d9]" />
            </>
          )}
        </section>
      </main>
    </StudioFrame>
  )
}
