import Link from "next/link"
import { notFound } from "next/navigation"

import { FolderIcon } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"

type Props = {
  params: Promise<{ slug: string }>
}

const labPages = new Set([
  "deformity",
  "action",
  "cyber",
  "horror",
  "high",
  "hollywood",
  "anime",
  "retro",
  "display",
  "shrimp",
])

export default async function LabDetailPage({ params }: Props) {
  const { slug } = await params
  if (!labPages.has(slug)) notFound()

  return (
    <StudioFrame navOverride="labs" backgroundClassName="bg-[#de202c]">
      <main className="flex h-full items-center justify-center px-4 pt-20 md:px-8 md:pt-28">
        <div className="flex flex-col items-center gap-3 sm:gap-5">
          <FolderIcon color="red" className="h-[72px] w-[104px] md:h-[150px] md:w-[216px]" />
          <p className="font-mono text-[12px] tracking-[0.08em] text-[#ffe5e6] md:text-[34px]">: {slug.toUpperCase()} :</p>
          <Link href="/labs" className="font-mono text-[10px] tracking-[0.08em] text-[#ffd1d4] underline md:text-[24px]">
            BACK TO LABS
          </Link>
        </div>
      </main>
    </StudioFrame>
  )
}
