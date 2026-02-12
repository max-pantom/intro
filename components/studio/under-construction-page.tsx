"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react"

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

type FloatingWindowProps = {
  title: string
  subtitle?: string
  className?: string
  desktopRotate?: number
  children: ReactNode
}

type DragState = {
  pointerId: number
  startPointerX: number
  startPointerY: number
  startOffsetX: number
  startOffsetY: number
}

type CursorPixel = {
  id: number
  x: number
  y: number
  color: string
  size: number
}

type GifWindowSeed = {
  id: number
  left: string
  top: string
  width: number
  height: number
  rotate: number
}

const trailColors = ["#00f5ff", "#ff4fd8", "#fff05f", "#7cff6b", "#8ea8ff", "#ffffff", "#ff9f40"]

const gifWindowSeeds: GifWindowSeed[] = [
  { id: 1, left: "1%", top: "2%", width: 112, height: 70, rotate: -6 },
  { id: 2, left: "14%", top: "1%", width: 146, height: 92, rotate: 4 },
  { id: 3, left: "29%", top: "3%", width: 126, height: 78, rotate: -2 },
  { id: 4, left: "45%", top: "1%", width: 168, height: 110, rotate: 5 },
  { id: 5, left: "61%", top: "2%", width: 118, height: 74, rotate: -4 },
  { id: 6, left: "77%", top: "1%", width: 154, height: 96, rotate: 3 },
  { id: 7, left: "3%", top: "23%", width: 188, height: 120, rotate: 5 },
  { id: 8, left: "83%", top: "20%", width: 124, height: 76, rotate: -5 },
  { id: 9, left: "1%", top: "39%", width: 132, height: 84, rotate: -4 },
  { id: 10, left: "85%", top: "38%", width: 170, height: 112, rotate: 4 },
  { id: 11, left: "5%", top: "56%", width: 116, height: 72, rotate: 3 },
  { id: 12, left: "84%", top: "56%", width: 142, height: 90, rotate: -3 },
  { id: 13, left: "2%", top: "73%", width: 160, height: 104, rotate: -5 },
  { id: 14, left: "18%", top: "78%", width: 122, height: 76, rotate: 4 },
  { id: 15, left: "34%", top: "82%", width: 178, height: 116, rotate: -2 },
  { id: 16, left: "50%", top: "80%", width: 128, height: 80, rotate: 3 },
  { id: 17, left: "66%", top: "82%", width: 164, height: 106, rotate: -4 },
  { id: 18, left: "80%", top: "76%", width: 120, height: 74, rotate: 4 },
  { id: 19, left: "72%", top: "17%", width: 136, height: 86, rotate: -2 },
  { id: 20, left: "20%", top: "15%", width: 210, height: 132, rotate: 2 },
]

let windowZSeed = 40

function getNextWindowZ() {
  windowZSeed += 1
  return windowZSeed
}

function FloatingWindow({ title, subtitle, className, desktopRotate = 0, children }: FloatingWindowProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zIndex, setZIndex] = useState<number>(() => getNextWindowZ())
  const [isDragging, setIsDragging] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const dragStateRef = useRef<DragState | null>(null)

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)")
    const updateMode = () => setIsDesktop(query.matches)

    updateMode()
    query.addEventListener("change", updateMode)

    return () => query.removeEventListener("change", updateMode)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDesktop || event.button !== 0) return

    event.preventDefault()
    setZIndex(getNextWindowZ())
    setIsDragging(true)
    dragStateRef.current = {
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!isDesktop || !dragState || dragState.pointerId !== event.pointerId) return

    const nextX = dragState.startOffsetX + (event.clientX - dragState.startPointerX)
    const nextY = dragState.startOffsetY + (event.clientY - dragState.startPointerY)

    setOffset({ x: nextX, y: nextY })
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    setIsDragging(false)
    dragStateRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const windowStyle: CSSProperties | undefined = isDesktop
    ? {
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0px) rotate(${desktopRotate}deg)`,
        zIndex,
      }
    : undefined

  return (
    <section
      className={`relative z-10 overflow-hidden border-2 border-[#0d0d0d] bg-[#c6c6c6] shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,3px_3px_0_#0d0d0d] ${isDesktop && !isDragging ? "transition-transform duration-200" : ""} ${className ?? ""}`}
      style={windowStyle}
    >
      <div
        className={`flex items-center justify-between border-b border-[#0d0d0d] bg-[#000080] px-1 py-1 ${isDesktop ? "cursor-move" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex items-center gap-1">
          <span className="size-2 border border-[#0d0d0d] bg-white" />
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-white">{title}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex h-3 w-3 items-center justify-center border border-[#0d0d0d] bg-[#c6c6c6] font-mono text-[8px] leading-none text-black">-</span>
          <span className="inline-flex h-3 w-3 items-center justify-center border border-[#0d0d0d] bg-[#c6c6c6] font-mono text-[8px] leading-none text-black">+</span>
          <span className="inline-flex h-3 w-3 items-center justify-center border border-[#0d0d0d] bg-[#c6c6c6] font-mono text-[8px] leading-none text-black">x</span>
        </div>
      </div>
      {subtitle ? <p className="border-b border-black/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] text-black/65">{subtitle}</p> : null}
      <div className="px-2 py-2">{children}</div>
    </section>
  )
}

function RetroGifWindow({ left, top, width, height, rotate, source, label }: GifWindowSeed & { source: string; label: string }) {
  return (
    <div
      className="pointer-events-none absolute hidden border-2 border-[#0d0d0d] bg-[#c6c6c6] shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,2px_2px_0_#0d0d0d] md:block"
      style={{ left, top, width, transform: `rotate(${rotate}deg)` }}
    >
      <div className="flex items-center justify-between border-b border-[#0d0d0d] bg-[#000080] px-1 py-0.5">
        <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-white">{label}</span>
        <span className="h-2 w-2 border border-[#0d0d0d] bg-[#c6c6c6]" />
      </div>
      <Image
        src={source}
        alt="Animated under-construction frame"
        width={320}
        height={424}
        unoptimized
        className="w-full object-cover"
        style={{ height }}
      />
    </div>
  )
}

export function UnderConstructionPage({
  navKey,
  title,
  folderColor = "silver",
  backHref = "/",
  backLabel = "BACK HOME",
}: UnderConstructionPageProps) {
  const livePreviewGif = "/lab-images/28.gif"
  const [trail, setTrail] = useState<CursorPixel[]>([])
  const pixelIdRef = useRef(0)

  useEffect(() => {
    let rafId = 0
    let lastX = -999
    let lastY = -999

    const spawnPixel = (x: number, y: number) => {
      const color = trailColors[Math.floor(Math.random() * trailColors.length)]
      const size = Math.random() > 0.45 ? 4 : 3
      const jitterX = (Math.random() - 0.5) * 8
      const jitterY = (Math.random() - 0.5) * 8
      const id = pixelIdRef.current + 1
      pixelIdRef.current = id

      setTrail((current) => [...current.slice(-50), { id, x: x + jitterX, y: y + jitterY, color, size }])

      window.setTimeout(() => {
        setTrail((current) => current.filter((pixel) => pixel.id !== id))
      }, 520)
    }

    const onPointerMove = (event: globalThis.PointerEvent) => {
      const movement = Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY)
      if (movement < 5) return

      lastX = event.clientX
      lastY = event.clientY

      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => spawnPixel(event.clientX, event.clientY))
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("pointermove", onPointerMove)
    }
  }, [])

  return (
    <StudioFrame navOverride={navKey} backgroundColor="#ffffff">
      <main className="relative h-full overflow-y-auto px-4 pb-10 pt-24 md:px-8 md:pb-14 md:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:14px_14px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(147,233,255,0.2),transparent_40%),radial-gradient(circle_at_40%_88%,rgba(255,201,239,0.18),transparent_45%)]" />

        <div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-4 md:block md:h-[980px]">
          {gifWindowSeeds.map((seed) => (
            <RetroGifWindow
              key={seed.id}
              id={seed.id}
              left={seed.left}
              top={seed.top}
              width={seed.width}
              height={seed.height}
              rotate={seed.rotate}
              source={livePreviewGif}
              label={`gif 28 #${seed.id}`}
            />
          ))}

          <section className="relative z-30 flex flex-col items-center gap-3 border-2 border-[#0d0d0d] bg-[#c6c6c6] px-5 py-7 text-center shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,4px_4px_0_#0d0d0d] md:absolute md:left-1/2 md:top-1/2 md:w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:px-8 md:py-10">
            <div className="w-full border border-[#0d0d0d] bg-[#000080] px-2 py-1 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-white">
              C:\\{title.toLowerCase()}\\status.exe
            </div>
            <FolderIcon color={folderColor} className="h-[72px] w-[104px] md:h-[118px] md:w-[168px]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-black/80 md:text-[13px]">section: {title}</p>
            <h1 className="font-mono text-[26px] uppercase leading-[0.95] tracking-[-0.03em] text-black md:text-[52px]">Under Construction</h1>
            <p className="max-w-[42ch] font-mono text-[11px] uppercase tracking-[0.05em] text-black/75 md:text-[13px]">
              this page is still being built. assets and interactions are loading soon.
            </p>
            <div className="mt-1 flex items-center gap-2 border border-black/25 bg-white/70 px-3 py-1">
              <span className="size-2 bg-[#ff5e57] animate-pulse motion-reduce:animate-none" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/75">construction in progress</span>
            </div>
            <Link href={backHref} className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-black/75 underline md:text-[12px]">
              {backLabel}
            </Link>
          </section>

          <FloatingWindow title="Live Build Feed" subtitle="gif 28 stream" className="md:absolute md:left-[7%] md:top-[26%] md:w-[320px]" desktopRotate={-2}>
            <div className="relative overflow-hidden border border-black/15">
              <Image src={livePreviewGif} alt="Animated studio preview feed" width={320} height={424} unoptimized className="h-[170px] w-full object-cover" />
              <span className="absolute left-2 top-2 border border-white/40 bg-black/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-white">
                live
              </span>
            </div>
          </FloatingWindow>

          <FloatingWindow title="Team Update" subtitle="owner status" className="md:absolute md:right-[9%] md:top-[25%] md:w-[320px]" desktopRotate={3}>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/80">max is working on this</p>
            <div className="mt-3 h-2 w-full overflow-hidden border border-black/20 bg-white/60">
              <div className="h-full w-[64%] animate-pulse bg-[#1f74ff]" />
            </div>
          </FloatingWindow>

          <FloatingWindow title="Release ETA" subtitle="short note" className="md:absolute md:right-[14%] md:top-[54%] md:w-[300px]" desktopRotate={-3}>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/80">- almost done give me some days</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="size-2 bg-[#ff5e57] animate-ping motion-reduce:animate-none" />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/65">current phase: polish</span>
            </div>
          </FloatingWindow>

          <FloatingWindow title="Visual Drop" subtitle="gif 28 monitor" className="md:absolute md:left-[10%] md:top-[58%] md:w-[300px]" desktopRotate={2}>
            <div className="relative overflow-hidden border border-black/15">
              <Image src={livePreviewGif} alt="Animated visual snapshot" width={320} height={424} unoptimized className="h-[130px] w-full object-cover" />
            </div>
          </FloatingWindow>

          <div className="grid grid-cols-2 gap-2 md:hidden">
            {gifWindowSeeds.slice(0, 8).map((seed) => (
              <div key={`mobile-gif-${seed.id}`} className="border-2 border-[#0d0d0d] bg-[#c6c6c6] shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff]">
                <div className="border-b border-[#0d0d0d] bg-[#000080] px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.05em] text-white">gif 28 #{seed.id}</div>
                <Image
                  src={livePreviewGif}
                  alt="Animated mini feed"
                  width={320}
                  height={424}
                  unoptimized
                  className="w-full object-cover"
                  style={{ height: Math.max(64, Math.min(124, seed.height - 6)) }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-0 z-[120]">
        {trail.map((pixel, index) => (
          <span
            key={pixel.id}
            className="absolute block"
            style={{
              left: pixel.x,
              top: pixel.y,
              width: pixel.size,
              height: pixel.size,
              backgroundColor: pixel.color,
              opacity: Math.max(0.18, (index + 1) / trail.length),
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 8px ${pixel.color}`,
            }}
          />
        ))}
      </div>
    </StudioFrame>
  )
}
