"use client"

import Image from "next/image"
import { useRef, useState } from "react"

import { FolderIcon } from "@/components/studio/folder-icon"

type AppsContentProps = {
  appsImages: string[]
  cardsToRender: number
}

export function AppsContent({ appsImages, cardsToRender }: AppsContentProps) {
  const [showFolder, setShowFolder] = useState(true)
  const lastScrollTopRef = useRef(0)

  return (
    <>
      <div
        className={`pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 transition-all ${showFolder ? "translate-y-0 opacity-100 duration-[220ms]" : "-translate-y-6 opacity-0 duration-150"}`}
      >
        <FolderIcon color="silver" className="h-[62px] w-[76px] md:h-[76px] md:w-[92px]" />
      </div>

      <main
        className="pantom-scrollbar h-full overflow-y-auto px-5 pb-8 pt-[170px] md:px-6 md:pb-10 md:pt-[212px]"
        data-analytics-section="apps-gallery"
        onScroll={(event) => {
          const scrollTop = event.currentTarget.scrollTop
          const isAtTop = scrollTop <= 4
          const isScrollingUp = scrollTop < lastScrollTopRef.current

          setShowFolder(isAtTop || isScrollingUp)
          lastScrollTopRef.current = scrollTop
        }}
      >
        <section className="grid w-full grid-cols-2 gap-[10px] md:grid-cols-4" data-analytics-section="apps-grid">
          {Array.from({ length: cardsToRender }).map((_, index) => {
            const src = appsImages[index]
            return (
              <article
                key={src ?? `placeholder-${index}`}
                className="flex min-h-[220px] items-center justify-center overflow-hidden md:min-h-[250px]"
                data-analytics-item-id={src ?? ""}
                data-analytics-item-type="apps"
                data-analytics-item-label={src ?? ""}
              >
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    width={0}
                    height={0}
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="block h-full w-full object-contain"
                    draggable={false}
                    quality={100}
                  />
                ) : null}
              </article>
            )
          })}
        </section>
      </main>
    </>
  )
}
