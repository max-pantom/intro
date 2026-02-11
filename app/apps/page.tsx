import Link from "next/link"

import { FolderIcon } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"

const cards = [
  { href: "/apps/poster-1", image: "/cards/1.png" },
  { href: "/apps/poster-2", image: "/cards/2.png" },
  { href: "/apps/poster-3", image: "/cards/3.png" },
  { href: "/apps/poster-4", image: "/cards/4.png" },
  { href: "/apps/poster-5", image: "/cards/5.png" },
  { href: "/apps/poster-6", image: "/cards/6.png" },
  { href: "/apps/poster-7", image: "/cards/7.png" },
  { href: "/apps/poster-8", image: "/cards/8.png" },
]

export default function AppsPage() {
  return (
    <StudioFrame navOverride="home">
      <main className="grid h-full grid-rows-[150px_1fr_42px] px-4 pt-20 md:grid-rows-[230px_1fr_70px] md:px-7 md:pt-28">
        <div className="flex items-center justify-center">
          <FolderIcon color="silver" className="h-[58px] w-[82px] md:h-[120px] md:w-[170px]" />
        </div>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="block overflow-hidden bg-[#cfcfcf]">
              <div className="h-full w-full bg-[#c6c6c6] bg-cover bg-center" style={{ backgroundImage: `url(${card.image})` }} />
            </Link>
          ))}
        </section>

        <div className="flex items-center justify-center font-mono text-[12px] tracking-[0.08em] text-[#3b3b3b] md:text-[42px] md:tracking-[0.09em]">
          : APPS :
        </div>
      </main>
    </StudioFrame>
  )
}
