import { readdir } from "node:fs/promises"
import path from "node:path"

import { StudioFrame } from "@/components/studio/studio-frame"

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
  const labImages = await getLabImagePaths()
  const desktopColumns = Array.from({ length: 5 }, () => [] as string[])

  labImages.forEach((src, index) => {
    desktopColumns[index % desktopColumns.length].push(src)
  })

  return (
    <StudioFrame
      navOverride="labs"
      backgroundColor="#D6282E"
      headerTone="light"
      headerClassName="px-4 md:px-[22px]"
      navClassName="md:-mr-5"
    >
      <main className="h-full overflow-y-auto px-4 pb-4 pt-[200px] md:px-[22px] md:pb-7 md:pt-[286px]">
        <section className="grid grid-cols-2 gap-[8px] md:hidden">
          {labImages.map((src) => (
            <article key={src} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="block h-auto w-full" draggable={false} loading="lazy" />
            </article>
          ))}
        </section>

        <section className="hidden md:grid md:grid-cols-5 md:gap-[8px]">
          {desktopColumns.map((column, columnIndex) => (
            <div key={`column-${columnIndex}`} className="flex flex-col gap-[8px]">
              {column.map((src) => (
                <article key={src} className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="block h-auto w-full" draggable={false} loading="lazy" />
                </article>
              ))}
            </div>
          ))}
        </section>

        {labImages.length === 0 ? (
          <p className="pt-4 text-center font-mono text-[12px] tracking-[0.06em] text-[#ffd5d8]">Add images to `public/lab-images`.</p>
        ) : null}
      </main>
    </StudioFrame>
  )
}
