import Link from "next/link"

import { FolderIcon } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"
import { homeFolderTiles } from "@/lib/studio-data"

export default function HomePage() {
  return (
    <StudioFrame navOverride="home">
      <main className="flex h-full items-center justify-center px-4 pb-10 pt-28 md:px-10 md:pb-20 md:pt-36">
        <section className="grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-3 md:gap-x-14 md:gap-y-14">
          {homeFolderTiles.map((folder) => (
            <Link key={folder.href} href={folder.href} className="group flex flex-col items-center text-center">
              <FolderIcon color={folder.color} className="h-[66px] w-[94px] md:h-[140px] md:w-[200px]" />
              <span className="mt-2 font-mono text-[10px] tracking-[0.06em] text-[#5b5b5b] md:mt-4 md:text-[34px] md:tracking-[0.08em]">
                {folder.label}
              </span>
            </Link>
          ))}
        </section>
      </main>
    </StudioFrame>
  )
}
