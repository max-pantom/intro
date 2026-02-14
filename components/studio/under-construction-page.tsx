"use client"

import Link from "next/link"
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react"

import { FolderIcon, type FolderColor } from "@/components/studio/folder-icon"
import { StudioFrame } from "@/components/studio/studio-frame"
import { PixelatedImage } from "@/components/ui/pixelated-image"
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
  onCloseAttempt?: (event: MouseEvent<HTMLButtonElement>) => void
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

type ErrorDialog = {
  id: number
  x: number
  y: number
  message: string
}

type TerminalLine = {
  id: number
  role: "user" | "assistant"
  text: string
}

type GifWindowSeed = {
  id: number
  left: string
  top: string
  width: number
  height: number
  rotate: number
}

const animatedGifIds = new Set(Array.from({ length: 28 }, (_, index) => index + 1))

const trailColors = ["#00f5ff", "#ff4fd8", "#fff05f", "#7cff6b", "#8ea8ff", "#ffffff", "#ff9f40"]

const closeErrorMessages = [
  "ok where are you going to",
  "just contact me",
  "we are hiring clients",
  "this window is still needed",
  "close denied while building",
]

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function buildGifWindowSeeds(count: number) {
  const hugeWindowIds = new Set([2, 7, 12, 18, 23, 27])
  const hugeWindowEdgeConfig: Record<number, "left" | "right" | "top" | "bottom"> = {
    2: "left",
    7: "right",
    12: "top",
    18: "bottom",
    23: "left",
    27: "right",
  }

  return Array.from({ length: count }, (_, index) => {
    const id = index + 1

    if (id === 28) {
      return {
        id,
        left: "74%",
        top: "4%",
        width: 220,
        height: 170,
        rotate: -5,
      }
    }

    const isHuge = hugeWindowIds.has(id)

    if (isHuge) {
      const side = hugeWindowEdgeConfig[id]
      const hugeWidth = 350 + Math.floor(pseudoRandom(id * 3.3) * 160)
      const hugeHeight = Math.max(280, Math.min(520, hugeWidth - 20 + Math.floor(pseudoRandom(id * 5.9) * 50)))

      let left = 0
      let top = 0

      if (side === "left") {
        left = -18 + pseudoRandom(id * 2.4) * 8
        top = 6 + pseudoRandom(id * 3.5) * 72
      } else if (side === "right") {
        left = 76 + pseudoRandom(id * 2.8) * 16
        top = 4 + pseudoRandom(id * 3.7) * 76
      } else if (side === "top") {
        left = 8 + pseudoRandom(id * 2.1) * 74
        top = -20 + pseudoRandom(id * 3.2) * 10
      } else {
        left = 10 + pseudoRandom(id * 2.9) * 72
        top = 68 + pseudoRandom(id * 3.9) * 16
      }

      return {
        id,
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        width: hugeWidth,
        height: hugeHeight,
        rotate: -6 + pseudoRandom(id * 9.4) * 12,
      }
    }

    const left = -22 + pseudoRandom(id * 7.1) * 124
    const top = -18 + pseudoRandom(id * 11.7) * 124
    const width = 90 + Math.floor(pseudoRandom(id * 3.3) * 190)
    const height = 56 + Math.floor(pseudoRandom(id * 5.9) * 140)
    const rotate = -8 + pseudoRandom(id * 9.4) * 16

    return {
      id,
      left: `${left.toFixed(2)}%`,
      top: `${top.toFixed(2)}%`,
      width,
      height,
      rotate,
    }
  })
}

let windowZSeed = 40

function getNextWindowZ() {
  windowZSeed += 1
  return windowZSeed
}

function FloatingWindow({ title, subtitle, className, desktopRotate = 0, onCloseAttempt, children }: FloatingWindowProps) {
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
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCloseAttempt?.(event)
            }}
            className="inline-flex h-3 w-3 items-center justify-center border border-[#0d0d0d] bg-[#c6c6c6] font-mono text-[8px] leading-none text-black"
          >
            x
          </button>
        </div>
      </div>
      {subtitle ? <p className="border-b border-black/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] text-black/65">{subtitle}</p> : null}
      <div className="px-2 py-2">{children}</div>
    </section>
  )
}

const RetroGifWindow = memo(function RetroGifWindow({
  left,
  top,
  width,
  height,
  rotate,
  source,
  label,
  titleBarClassName = "bg-[#000080]",
  interactive = false,
  zIndex,
  onClick,
  onMouseEnter,
  onMouseLeave,
  draggable = false,
  animated = true,
}: GifWindowSeed & {
  source: string
  label: string
  titleBarClassName?: string
  interactive?: boolean
  draggable?: boolean
  animated?: boolean
  zIndex?: number
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDesktop, setIsDesktop] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [currentZIndex, setCurrentZIndex] = useState<number | undefined>(zIndex)
  const dragStateRef = useRef<DragState | null>(null)

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)")
    const updateMode = () => setIsDesktop(query.matches)

    updateMode()
    query.addEventListener("change", updateMode)

    return () => query.removeEventListener("change", updateMode)
  }, [])

  useEffect(() => {
    setCurrentZIndex(zIndex)
  }, [zIndex])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggable || !isDesktop || event.button !== 0) return

    event.preventDefault()
    setCurrentZIndex(getNextWindowZ())
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
    if (!draggable || !isDesktop || !dragState || dragState.pointerId !== event.pointerId) return

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

  return (
    <div
      className={`${interactive ? "pointer-events-auto" : "pointer-events-none"} absolute hidden border-2 border-[#0d0d0d] bg-[#c6c6c6] shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,2px_2px_0_#0d0d0d] ${draggable && isDesktop && !isDragging ? "transition-transform duration-150" : ""} md:block`}
      style={{
        left,
        top,
        width,
        zIndex: currentZIndex,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0px) rotate(${rotate}deg)`,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`flex items-center justify-between border-b border-[#0d0d0d] px-1 py-0.5 ${titleBarClassName} ${draggable && isDesktop ? "cursor-move" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-white">{label}</span>
        <span className="h-2 w-2 border border-[#0d0d0d] bg-[#c6c6c6]" />
      </div>
      {animated ? (
        <PixelatedImage
          src={source}
          alt="Animated under-construction frame"
          width={320}
          height={424}
          unoptimized
          className="w-full object-cover"
          style={{ height }}
        />
      ) : (
        <div
          className="relative w-full overflow-hidden border-t border-black/20 bg-[#0d0d0d]"
          style={{ height }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_44%,rgba(255,255,255,0.2)_100%)]" />
          <div className="absolute inset-x-0 top-[18%] h-[1px] bg-white/20" />
          <div className="absolute inset-x-0 top-[53%] h-[1px] bg-white/15" />
          <p className="absolute bottom-2 left-2 border border-white/25 bg-black/45 px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-white/80">
            preview buffered
          </p>
        </div>
      )}
    </div>
  )
})

export function UnderConstructionPage({
  navKey,
  title,
  folderColor = "silver",
  backHref = "/",
  backLabel = "BACK HOME",
}: UnderConstructionPageProps) {
  const livePreviewGif = "/lab-images/28.gif"
  const gifWindowSeeds = useMemo(() => buildGifWindowSeeds(28), [])
  const [trail, setTrail] = useState<CursorPixel[]>([])
  const [errorDialogs, setErrorDialogs] = useState<ErrorDialog[]>([])
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [isGif28Hovered, setIsGif28Hovered] = useState(false)
  const [isGif28Alert, setIsGif28Alert] = useState(false)
  const [desktopBgColor, setDesktopBgColor] = useState("#bfbfbf")
  const [terminalInput, setTerminalInput] = useState("")
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: 1, role: "assistant", text: "flippy online" },
    { id: 2, role: "assistant", text: "press enter to send" },
  ])
  const pixelIdRef = useRef(0)
  const errorIdRef = useRef(0)
  const terminalLineRef = useRef(2)

  const pickRandomResponse = () => closeErrorMessages[Math.floor(Math.random() * closeErrorMessages.length)]

  const spawnCloseError = (originX: number, originY: number) => {
    const message = closeErrorMessages[Math.floor(Math.random() * closeErrorMessages.length)]
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const dialogWidth = 290
    const dialogHeight = 116
    const nextX = Math.max(12, Math.min(viewportWidth - dialogWidth - 12, originX + (Math.random() - 0.5) * 160))
    const nextY = Math.max(12, Math.min(viewportHeight - dialogHeight - 12, originY + (Math.random() - 0.5) * 120))
    const id = errorIdRef.current + 1
    errorIdRef.current = id

    setErrorDialogs((current) => [...current.slice(-5), { id, x: nextX, y: nextY, message }])
  }

  const handleWindowCloseAttempt = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    spawnCloseError(event.clientX, event.clientY)
  }

  const handleGif28Click = () => {
    setDesktopBgColor((current) => (current === "#008081" ? "#bfbfbf" : "#008081"))
    setIsGif28Alert(true)
    spawnCloseError(window.innerWidth * 0.7, window.innerHeight * 0.35)
    window.setTimeout(() => setIsGif28Alert(false), 900)
  }

  const submitTerminalLine = () => {
    const message = terminalInput.trim()
    if (!message) return

    const userId = terminalLineRef.current + 1
    terminalLineRef.current = userId
    const assistantId = terminalLineRef.current + 1
    terminalLineRef.current = assistantId

    setTerminalLines((current) => [
      ...current.slice(-12),
      { id: userId, role: "user", text: message },
      { id: assistantId, role: "assistant", text: pickRandomResponse() },
    ])
    setTerminalInput("")
  }

  useEffect(() => {
    let rafId = 0
    let lastX = -999
    let lastY = -999

    const spawnPixel = (x: number, y: number) => {
      for (let index = 0; index < 2; index += 1) {
        const color = trailColors[Math.floor(Math.random() * trailColors.length)]
        const size = 3 + Math.floor(Math.random() * 3)
        const jitterX = (Math.random() - 0.5) * 14
        const jitterY = (Math.random() - 0.5) * 14
        const id = pixelIdRef.current + 1
        pixelIdRef.current = id

        setTrail((current) => [...current.slice(-90), { id, x: x + jitterX, y: y + jitterY, color, size }])

        window.setTimeout(() => {
          setTrail((current) => current.filter((pixel) => pixel.id !== id))
        }, 620)
      }
    }

    const onPointerMove = (event: globalThis.PointerEvent) => {
      const movement = Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY)
      if (movement < 3) return

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
    <StudioFrame navOverride={navKey} backgroundColor={desktopBgColor}>
      <main className="relative min-h-[calc(100dvh-5.5rem)] overflow-hidden px-4 pb-10 pt-24 md:px-8 md:pb-12 md:pt-28">

        <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-4 md:h-[calc(100dvh-11rem)] md:min-h-[760px]">
          {gifWindowSeeds.map((seed) => {
            const isSpecial28 = seed.id === 28
            const specialTitleClass = isGif28Alert ? "bg-[#aa0000]" : isGif28Hovered ? "bg-[#2667f2]" : "bg-[#000080]"

            return (
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
                interactive={isSpecial28}
                zIndex={isSpecial28 ? 34 : undefined}
                draggable={isSpecial28}
                animated={animatedGifIds.has(seed.id)}
                titleBarClassName={isSpecial28 ? specialTitleClass : "bg-[#000080]"}
                onClick={isSpecial28 ? handleGif28Click : undefined}
                onMouseEnter={isSpecial28 ? () => setIsGif28Hovered(true) : undefined}
                onMouseLeave={isSpecial28 ? () => setIsGif28Hovered(false) : undefined}
              />
            )
          })}

          <section className="relative z-30 flex flex-col items-center gap-3 border-2 border-[#0d0d0d] bg-[#c6c6c6] px-5 py-7 text-center shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,4px_4px_0_#0d0d0d] md:fixed md:left-1/2 md:top-1/2 md:w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:px-8 md:py-10">
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

          <FloatingWindow
            title="Live Build Feed"
            subtitle="gif 28 stream"
            className="hidden md:absolute md:left-[7%] md:top-[26%] md:w-[320px] md:block"
            desktopRotate={-2}
            onCloseAttempt={handleWindowCloseAttempt}
          >
            <div className="relative overflow-hidden border border-black/15">
              <PixelatedImage src={livePreviewGif} alt="Animated studio preview feed" width={320} height={424} unoptimized className="h-[170px] w-full object-cover" />
              <span className="absolute left-2 top-2 border border-white/40 bg-black/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-white">
                live
              </span>
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Team Update"
            subtitle="owner status"
            className="hidden md:absolute md:right-[9%] md:top-[25%] md:w-[320px] md:block"
            desktopRotate={3}
            onCloseAttempt={handleWindowCloseAttempt}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/80">max is working on this</p>
            <div className="mt-3 h-2 w-full overflow-hidden border border-black/20 bg-white/60">
              <div className="h-full w-[64%] animate-pulse bg-[#1f74ff]" />
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Release ETA"
            subtitle="short note"
            className="hidden md:absolute md:right-[14%] md:top-[54%] md:w-[300px] md:block"
            desktopRotate={-3}
            onCloseAttempt={handleWindowCloseAttempt}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/80">- almost done give me some days</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="size-2 bg-[#ff5e57] animate-ping motion-reduce:animate-none" />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/65">current phase: polish</span>
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Visual Drop"
            subtitle="gif 28 monitor"
            className="hidden md:absolute md:left-[10%] md:top-[58%] md:w-[300px] md:block"
            desktopRotate={2}
            onCloseAttempt={handleWindowCloseAttempt}
          >
            <div className="relative overflow-hidden border border-black/15">
              <PixelatedImage src={livePreviewGif} alt="Animated visual snapshot" width={320} height={424} unoptimized className="h-[130px] w-full object-cover" />
            </div>
          </FloatingWindow>

          <div className="hidden grid-cols-2 gap-2 md:hidden">
            {gifWindowSeeds.slice(0, 8).map((seed) => (
              <div key={`mobile-gif-${seed.id}`} className="border-2 border-[#0d0d0d] bg-[#c6c6c6] shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff]">
                <div className="border-b border-[#0d0d0d] bg-[#000080] px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.05em] text-white">gif 28 #{seed.id}</div>
                <PixelatedImage
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
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none fixed inset-0 z-[130]">
        {errorDialogs.map((dialog) => (
          <div
            key={dialog.id}
            className="pointer-events-auto absolute w-[290px] border-2 border-[#0d0d0d] bg-[#c6c6c6] shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,3px_3px_0_#0d0d0d]"
            style={{ left: dialog.x, top: dialog.y }}
          >
            <div className="flex items-center justify-between border-b border-[#0d0d0d] bg-[#000080] px-2 py-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-white">System Error</p>
              <button
                type="button"
                onClick={() => setErrorDialogs((current) => current.filter((item) => item.id !== dialog.id))}
                className="inline-flex h-3 w-3 items-center justify-center border border-[#0d0d0d] bg-[#c6c6c6] font-mono text-[8px] leading-none text-black"
              >
                x
              </button>
            </div>
            <div className="px-2 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.05em] text-black">{dialog.message}</p>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setErrorDialogs((current) => current.filter((item) => item.id !== dialog.id))}
                  className="border border-[#0d0d0d] bg-[#c6c6c6] px-2 py-0.5 font-mono text-[9px] uppercase text-black"
                >
                  ok
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-2 right-2 z-[140] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setIsTerminalOpen((value) => !value)}
          className="flex items-center gap-2 border-2 border-[#0d0d0d] bg-[#c6c6c6] px-2 py-1 shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,2px_2px_0_#0d0d0d]"
        >
          <span className="font-mono text-[18px] leading-none">📎</span>
          <span className="font-mono text-[10px] uppercase text-black">flippy</span>
        </button>

        {isTerminalOpen ? (
          <div className="w-[260px] border-2 border-[#0d0d0d] bg-[#c6c6c6] shadow-[inset_-1px_-1px_0_#0d0d0d,inset_1px_1px_0_#ffffff,3px_3px_0_#0d0d0d]">
            <div className="border-b border-[#0d0d0d] bg-[#000080] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-white">
              flippy terminal
            </div>
            <div className="h-[110px] overflow-hidden bg-black px-2 py-1 font-mono text-[9px] text-[#72ff7a]">
              {terminalLines.slice(-8).map((line) => (
                <p key={line.id}>
                  {line.role === "assistant" ? "flippy>" : "you>"} {line.text}
                </p>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                submitTerminalLine()
              }}
              className="border-t border-[#0d0d0d] bg-[#c6c6c6] p-1"
            >
              <input
                value={terminalInput}
                onChange={(event) => setTerminalInput(event.target.value)}
                placeholder="type then press enter"
                className="w-full border border-[#0d0d0d] bg-white px-1 py-0.5 font-mono text-[9px] text-black outline-none"
              />
            </form>
          </div>
        ) : null}
      </div>
    </StudioFrame>
  )
}
