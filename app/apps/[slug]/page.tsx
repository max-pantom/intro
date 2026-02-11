import Link from "next/link"
import { notFound } from "next/navigation"

import { FolderIcon } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"

type Props = {
  params: Promise<{ slug: string }>
}

const appPages = new Set([
  "poster-1",
  "poster-2",
  "poster-3",
  "poster-4",
  "poster-5",
  "poster-6",
  "poster-7",
  "poster-8",
])

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params
  if (!appPages.has(slug)) notFound()

  return (
    <StudioFrame navOverride="home">
      <main className="flex h-full items-center justify-center px-4 pt-20 md:px-8 md:pt-28">
        <div className="flex flex-col items-center gap-3 sm:gap-5">
          <FolderIcon color="silver" className="h-[72px] w-[104px] md:h-[150px] md:w-[216px]" />
          <p className="font-mono text-[12px] tracking-[0.08em] text-[#3d3d3d] md:text-[34px]">: {slug.toUpperCase()} :</p>
          <Link href="/apps" className="font-mono text-[10px] tracking-[0.08em] text-[#656565] underline md:text-[24px]">
            BACK TO APPS
          </Link>
        </div>
      </main>
    </StudioFrame>
  )
}
