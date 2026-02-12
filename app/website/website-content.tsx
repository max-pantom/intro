"use client"

import Image from "next/image"
import { useRef, useState } from "react"

import { FolderIcon } from "@/components/studio/folder-icon"

type WebsiteContentProps = {
  websiteImages: string[]
}

export function WebsiteContent({ websiteImages }: WebsiteContentProps) {
  const [showFolder, setShowFolder] = useState(true)
  const lastScrollTopRef = useRef(0)

  return (
    <>
      <div
        className={`pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 transition-all ${showFolder ? "translate-y-0 opacity-100 duration-[220ms]" : "-translate-y-6 opacity-0 duration-150"}`}
      >
        <FolderIcon color="graphite" className="h-[62px] w-[76px] md:h-[76px] md:w-[92px]" />
      </div>

      <main
        className="pantom-scrollbar h-full overflow-y-auto px-5 pb-8 pt-[170px] md:px-6 md:pb-10 md:pt-[196px]"
        onScroll={(event) => {
          const scrollTop = event.currentTarget.scrollTop
          const isAtTop = scrollTop <= 4
          const isScrollingUp = scrollTop < lastScrollTopRef.current

          setShowFolder(isAtTop || isScrollingUp)
          lastScrollTopRef.current = scrollTop
        }}
      >
        <section className="flex w-full flex-col gap-5">
          {websiteImages.length > 0 ? (
            websiteImages.map((src, index) => (
              <article key={src} className="overflow-hidden bg-[#d9d9d9]">
                <Image
                  src={src}
                  alt=""
                  width={0}
                  height={0}
                  sizes="(min-width: 768px) calc(100vw - 48px), calc(100vw - 40px)"
                  className="block h-auto w-full"
                  draggable={false}
                  quality={100}
                  priority={index === 0}
                />
              </article>
            ))
          ) : (
            <>
              <div className="aspect-[16/9] w-full bg-[#d9d9d9]" />
              <div className="aspect-[16/9] w-full bg-[#d9d9d9]" />
            </>
          )}
        </section>
      </main>
    </>
  )
}
