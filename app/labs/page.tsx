import Link from "next/link"
import Image from "next/image"

import { StudioFrame } from "@/components/studio/studio-frame"

const posters = [
  { href: "/labs/deformity", image: "/cards/9.png", className: "h-[27vh] md:h-[42vh]" },
  { href: "/labs/action", image: "/cards/10.png", className: "h-[20vh] md:h-[26vh]" },
  { href: "/labs/cyber", image: "/cards/11.png", className: "h-[24vh] md:h-[35vh]" },
  { href: "/labs/horror", image: "/cards/12.png", className: "h-[29vh] md:h-[45vh]" },
  { href: "/labs/high", image: "/cards/13.png", className: "h-[29vh] md:h-[45vh]" },
  { href: "/labs/hollywood", image: "/cards/14.png", className: "h-[19vh] md:h-[29vh]" },
  { href: "/labs/anime", image: "/cards/15.png", className: "h-[19vh] md:h-[29vh]" },
  { href: "/labs/retro", image: "/cards/16.png", className: "h-[19vh] md:h-[29vh]" },
  { href: "/labs/display", image: "/cards/17.png", className: "h-[19vh] md:h-[29vh]" },
  { href: "/labs/shrimp", image: "/cards/18.png", className: "h-[19vh] md:h-[29vh]" },
]

export default function LabsPage() {
  return (
    <StudioFrame navOverride="labs" backgroundClassName="bg-[#de202c]">
      <main className="grid h-full grid-rows-[170px_1fr] px-4 pb-4 pt-20 md:grid-rows-[250px_1fr] md:px-7 md:pb-6 md:pt-28">
        <div />
        <section className="grid min-h-0 grid-cols-2 gap-2 overflow-hidden md:grid-cols-5 md:gap-3">
          {posters.map((poster) => (
            <Link key={poster.href} href={poster.href} className={`relative block overflow-hidden bg-[#b11b23] ${poster.className}`}>
              <Image src={poster.image} alt="" fill sizes="20vw" className="object-cover" draggable={false} />
            </Link>
          ))}
        </section>
      </main>
    </StudioFrame>
  )
}
