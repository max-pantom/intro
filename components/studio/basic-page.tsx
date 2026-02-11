import Link from "next/link"

import { FolderIcon, type FolderColor } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"
import type { NavKey } from "@/lib/studio-data"

type BasicPageProps = {
  navKey: NavKey
  title: string
  folderColor?: FolderColor
  backgroundClassName?: string
  backHref?: string
  backLabel?: string
}

export function BasicPage({
  navKey,
  title,
  folderColor = "silver",
  backgroundClassName,
  backHref = "/",
  backLabel = "BACK",
}: BasicPageProps) {
  const textColor = backgroundClassName ? "text-white/90" : "text-[#3d3d3d]"
  const linkColor = backgroundClassName ? "text-white/70" : "text-[#656565]"

  return (
    <StudioFrame navOverride={navKey} backgroundClassName={backgroundClassName}>
      <main className="flex h-full items-center justify-center px-4 pt-20 md:px-8 md:pt-28">
        <div className="flex flex-col items-center gap-3 sm:gap-5">
          <FolderIcon color={folderColor} className="h-[72px] w-[104px] md:h-[150px] md:w-[216px]" />
          <p className={`font-mono text-[12px] tracking-[0.08em] md:text-[34px] ${textColor}`}>: {title} :</p>
          <Link href={backHref} className={`font-mono text-[10px] tracking-[0.08em] underline md:text-[24px] ${linkColor}`}>
            {backLabel}
          </Link>
        </div>
      </main>
    </StudioFrame>
  )
}
