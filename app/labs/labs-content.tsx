"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

type LabsContentProps = {
  labImages: string[]
}

function LabsTile({ src, sizes, priority }: { src: string; sizes: string; priority?: boolean }) {
  return (
    <article className="overflow-hidden" data-analytics-item-id={src} data-analytics-item-type="labs" data-analytics-item-label={src}>
      <Image
        src={src}
        alt=""
        width={0}
        height={0}
        sizes={sizes}
        className="block h-auto w-full"
        draggable={false}
        quality={100}
        priority={priority}
      />
    </article>
  )
}

export function LabsContent({ labImages }: LabsContentProps) {
  const MIN_MOBILE_COLUMNS = 2
  const MAX_MOBILE_COLUMNS = 4
  const MIN_COLUMNS = 3
  const MAX_COLUMNS = 8
  const [mobileColumnCount, setMobileColumnCount] = useState(2)
  const [desktopColumnCount, setDesktopColumnCount] = useState(5)

  const applyColumnDelta = (delta: number) => {
    setDesktopColumnCount((value) => Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, value + delta)))
    setMobileColumnCount((value) => Math.min(MAX_MOBILE_COLUMNS, Math.max(MIN_MOBILE_COLUMNS, value + delta)))
  }

  useEffect(() => {
    const onColumnsChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ delta?: number }>
      const delta = customEvent.detail?.delta
      if (delta === 1 || delta === -1) {
        applyColumnDelta(delta)
      }
    }

    window.addEventListener("labs-columns-change", onColumnsChange)
    return () => window.removeEventListener("labs-columns-change", onColumnsChange)
  }, [])

  const desktopColumns = useMemo(() => {
    const columns = Array.from({ length: desktopColumnCount }, () => [] as number[])
    labImages.forEach((_, index) => {
      columns[index % columns.length].push(index)
    })
    return columns
  }, [labImages, desktopColumnCount])

  const desktopSizes = `(min-width: 768px) ${Math.round(100 / desktopColumnCount)}vw, 0px`

  return (
    <>
      <section className="grid gap-[8px] md:hidden" style={{ gridTemplateColumns: `repeat(${mobileColumnCount}, minmax(0, 1fr))` }} data-analytics-section="labs-grid-mobile">
        {labImages.map((src, index) => (
          <LabsTile
            key={src}
            src={src}
            sizes={`(max-width: 767px) ${Math.round(100 / mobileColumnCount)}vw, 0px`}
            priority={index < 2}
          />
        ))}
      </section>

      <section className="hidden md:grid md:gap-[8px]" style={{ gridTemplateColumns: `repeat(${desktopColumnCount}, minmax(0, 1fr))` }} data-analytics-section="labs-grid-desktop">
        {desktopColumns.map((column, columnIndex) => (
          <div key={`column-${columnIndex}`} className="flex flex-col gap-[8px]">
            {column.map((imageIndex) => {
              const src = labImages[imageIndex]
              if (!src) return null

              return (
                <LabsTile
                  key={src}
                  src={src}
                  sizes={desktopSizes}
                />
              )
            })}
          </div>
        ))}
      </section>

      <div className="fixed bottom-4 right-4 z-30 hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={() => applyColumnDelta(-1)}
          disabled={desktopColumnCount <= MIN_COLUMNS}
          className="h-7 w-7 border border-white/50 bg-black/30 font-mono text-[14px] leading-none text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          aria-label="Decrease columns"
        >
          -
        </button>
        <span className="min-w-[28px] text-center font-mono text-[11px] tracking-[0.06em] text-white/90">{desktopColumnCount}</span>
        <button
          type="button"
          onClick={() => applyColumnDelta(1)}
          disabled={desktopColumnCount >= MAX_COLUMNS}
          className="h-7 w-7 border border-white/50 bg-black/30 font-mono text-[14px] leading-none text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          aria-label="Increase columns"
        >
          +
        </button>
      </div>
    </>
  )
}
