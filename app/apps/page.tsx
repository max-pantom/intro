import { readdir } from "node:fs/promises"
import path from "node:path"

import { FolderIcon } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"

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
  const appsImages = await getAppsImagePaths()
  const cardsToRender = Math.max(appsImages.length, MIN_VISIBLE_CARDS)

  return (
    <StudioFrame navOverride="home" headerClassName="px-5 md:px-6">
      <div className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2">
        <FolderIcon color="silver" className="h-[76px] w-[92px]" />
      </div>

      <main className="h-full overflow-y-auto px-5 pb-8 pt-[170px] md:px-6 md:pb-10 md:pt-[212px]">
        <section className="grid w-full grid-cols-2 gap-[10px] md:grid-cols-4">
          {Array.from({ length: cardsToRender }).map((_, index) => {
            const src = appsImages[index]
            return (
              <article key={src ?? `placeholder-${index}`} className="aspect-[302/384] overflow-hidden bg-[#d9d9d9]">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="block h-full w-full object-cover" draggable={false} loading="lazy" />
                ) : null}
              </article>
            )
          })}
        </section>
      </main>
    </StudioFrame>
  )
}
