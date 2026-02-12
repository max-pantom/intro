import Image from "next/image"
import Link from "next/link"

import { FolderIcon, type FolderColor } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"
import type { NavKey } from "@/lib/studio-data"

type UnderConstructionPageProps = {
  navKey: NavKey
  title: string
  folderColor?: FolderColor
  backHref?: string
  backLabel?: string
}

export function UnderConstructionPage({
  navKey,
  title,
  folderColor = "silver",
  backHref = "/",
  backLabel = "BACK HOME",
}: UnderConstructionPageProps) {
  return (
    <StudioFrame navOverride={navKey}>
      <main className="relative flex h-full items-center justify-center px-4 pt-24 md:px-8 md:pt-28">
        <div className="pointer-events-none absolute top-16 z-10 w-[220px] opacity-90 md:top-12 md:w-[320px]">
          <Image src="/assets/cellotape.svg" alt="" width={1155} height={553} className="h-auto w-full" priority />
        </div>

        <div className="flex max-w-[700px] flex-col items-center gap-3 border border-[#1c1c1c]/20 bg-[#ededed] px-4 py-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.08)] md:gap-5 md:px-8 md:py-12">
          <FolderIcon color={folderColor} className="h-[72px] w-[104px] md:h-[130px] md:w-[188px]" />

          <p className="font-mono text-[12px] tracking-[0.08em] text-[#3d3d3d] md:text-[28px]">: {title} :</p>

          <div className="mt-1 flex flex-col gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[#202020] md:text-[18px]">
            <p>Work in progress</p>
            <p>Men at work</p>
            <p>Under construction</p>
          </div>

          <Link href={backHref} className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[#656565] underline md:text-[20px]">
            {backLabel}
          </Link>
        </div>
      </main>
    </StudioFrame>
  )
}
