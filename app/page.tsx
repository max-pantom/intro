import { FolderTileLink } from "@/components/studio/folder-tile-link"
import { StudioFrame } from "@/components/studio/studio-frame"
import { homeFolderTiles } from "@/lib/studio-data"

export default function HomePage() {
  return (
    <StudioFrame navOverride="home">
      <main className="flex h-full items-center justify-center px-4">
        <section className="grid grid-cols-2 gap-x-7 gap-y-8 sm:grid-cols-3 sm:gap-x-[50px] sm:gap-y-[50px]">
          {homeFolderTiles.map((folder) => (
            <FolderTileLink key={folder.href} folder={folder} />
          ))}
        </section>
      </main>
    </StudioFrame>
  )
}
