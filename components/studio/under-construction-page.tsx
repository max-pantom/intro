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
      className={`relative z-10 overflow-hidden rounded-[16px] border border-black/20 bg-white/55 p-3 shadow-[0_16px_38px_rgba(0,0,0,0.16)] backdrop-blur-sm ${isDesktop && !isDragging ? "transition-transform duration-200" : ""} ${className ?? ""}`}
      style={windowStyle}
    >
      <div
        className={`flex items-center justify-between border-b border-black/15 pb-2 ${isDesktop ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff6d65]" />
          <span className="size-2.5 rounded-full bg-[#ffd45f]" />
          <span className="size-2.5 rounded-full bg-[#70db7d]" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/70">{title}</p>
      </div>
      {subtitle ? <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-black/60">{subtitle}</p> : null}
      <div className="pt-2">{children}</div>
    </section>
  )
}

export function UnderConstructionPage({
  navKey,
  title,
  folderColor = "silver",
  backHref = "/",
  backLabel = "BACK HOME",
}: UnderConstructionPageProps) {
  const livePreviewGif = "/lab-images/slideshow-1769119859260.gif"

  return (
    <StudioFrame navOverride={navKey} backgroundColor="#ebeff3">
      <main className="relative h-full overflow-y-auto px-4 pb-10 pt-24 md:px-8 md:pb-14 md:pt-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-[15%] size-48 rounded-full border border-white/75 bg-[#6ec5ff]/20 blur-[1px] md:size-64" />
          <div className="absolute right-[6%] top-[20%] size-32 rounded-[28px] border border-white/65 bg-[#f8b44e]/20 md:size-48" />
          <div className="absolute left-[20%] top-[65%] size-40 rounded-full border border-white/60 bg-[#a995ff]/15" />
          <div className="absolute bottom-[10%] right-[12%] size-52 rounded-[36px] border border-white/65 bg-[#7ff0a8]/20 blur-[2px]" />
          <div className="absolute left-[52%] top-[8%] size-20 -translate-x-1/2 rotate-12 border border-black/15 bg-white/35 md:size-24" />
          <div className="absolute bottom-[20%] left-[8%] h-24 w-24 rotate-[24deg] rounded-full border border-black/10 bg-white/35 blur-[0.5px]" />
          <div className="absolute inset-x-0 top-[28%] h-px bg-black/12" />
          <div className="absolute inset-x-0 bottom-[28%] h-px bg-black/12" />
        </div>

        <div className="relative mx-auto flex w-full max-w-[1240px] flex-col gap-4 md:block md:h-[860px]">
          <section className="relative z-30 flex flex-col items-center gap-3 rounded-[20px] border border-black/20 bg-[#f4f6f8]/78 px-5 py-7 text-center shadow-[0_26px_54px_rgba(0,0,0,0.2)] backdrop-blur-md md:absolute md:left-1/2 md:top-1/2 md:w-[540px] md:-translate-x-1/2 md:-translate-y-1/2 md:px-8 md:py-10">
            <FolderIcon color={folderColor} className="h-[72px] w-[104px] md:h-[118px] md:w-[168px]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-black/70 md:text-[13px]">Section: {title}</p>
            <h1 className="font-mono text-[26px] uppercase leading-[0.95] tracking-[-0.03em] text-[#111] md:text-[52px]">Under Construction</h1>
            <p className="max-w-[42ch] font-mono text-[11px] uppercase tracking-[0.05em] text-black/70 md:text-[13px]">
              We are actively building this area. New visuals, tools, and interactions are still being assembled.
            </p>
            <div className="mt-1 flex items-center gap-2 rounded-full border border-black/20 bg-white/65 px-3 py-1">
              <span className="size-2 rounded-full bg-[#ff5e57] animate-pulse motion-reduce:animate-none" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/65">Site update in progress</span>
            </div>
            <Link href={backHref} className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-black/70 underline md:text-[12px]">
              {backLabel}
            </Link>
          </section>

          <FloatingWindow
            title="Live Build Feed"
            subtitle="Window / rendering stream"
            className="md:absolute md:left-[1%] md:top-[8%] md:w-[330px]"
            desktopRotate={-3}
          >
            <div className="relative overflow-hidden rounded-[10px] border border-black/15">
              <Image
                src={livePreviewGif}
                alt="Animated studio preview feed"
                width={800}
                height={800}
                unoptimized
                className="h-[150px] w-full object-cover"
              />
              <span className="absolute left-2 top-2 rounded-full border border-white/40 bg-black/45 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-white">
                Streaming
              </span>
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Launch Tracker"
            subtitle="Current checklist"
            className="md:absolute md:right-[1%] md:top-[5%] md:w-[290px]"
            desktopRotate={5}
          >
            <ul className="space-y-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-black/70">
              <li className="flex items-center justify-between border-b border-black/10 pb-1">
                <span>Wireframe pass</span>
                <span className="text-[#17813d]">Done</span>
              </li>
              <li className="flex items-center justify-between border-b border-black/10 pb-1">
                <span>Motion tune</span>
                <span className="text-[#17813d]">Done</span>
              </li>
              <li className="flex items-center justify-between border-b border-black/10 pb-1">
                <span>Content drop</span>
                <span className="text-[#8b5b00]">Active</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Final QA</span>
                <span className="text-[#8b5b00]">Queued</span>
              </li>
            </ul>
          </FloatingWindow>

          <FloatingWindow
            title="Team Update"
            subtitle="Owner status"
            className="md:absolute md:left-[14%] md:top-[34%] md:w-[250px]"
            desktopRotate={3}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/75">max is working on this</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-black/20 bg-white/60">
              <div className="h-full w-[64%] animate-pulse bg-[#1f74ff]" />
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Release ETA"
            subtitle="Short note"
            className="md:absolute md:right-[15%] md:top-[31%] md:w-[300px]"
            desktopRotate={-5}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/75">- almost done give me some days</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#ff5e57] animate-ping motion-reduce:animate-none" />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/60">Current phase: polish</span>
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Signal Board"
            subtitle="Objects / transparent layers"
            className="md:absolute md:right-[5%] md:top-[48%] md:w-[260px]"
            desktopRotate={-6}
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-full border border-black/15 bg-[#88b9ff]/35 animate-pulse" />
              <div className="aspect-square rounded-[6px] border border-black/15 bg-[#ffb58a]/35" />
              <div className="aspect-square rotate-[14deg] border border-black/15 bg-[#b8ffb3]/30" />
              <div className="aspect-square rounded-full border border-black/15 bg-[#d7c0ff]/28" />
              <div className="aspect-square rounded-[6px] border border-black/15 bg-white/45 animate-pulse" />
              <div className="aspect-square rounded-full border border-black/15 bg-[#8df2f0]/30" />
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Status Console"
            subtitle="Pipeline logs"
            className="md:absolute md:left-[3%] md:top-[56%] md:w-[290px]"
            desktopRotate={2}
          >
            <div className="space-y-1 rounded-[8px] border border-black/12 bg-black/78 px-2 py-2 font-mono text-[9px] uppercase tracking-[0.06em] text-[#93ff95]">
              <p>&gt; booting section: {title.toLowerCase()}</p>
              <p>&gt; bundling interface modules</p>
              <p>&gt; syncing responsive layouts</p>
              <p className="text-[#fff88d]">&gt; waiting for final release...</p>
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Animated Monitor"
            subtitle="Live throughput"
            className="md:absolute md:right-[30%] md:top-[60%] md:w-[260px]"
            desktopRotate={2}
          >
            <div className="grid grid-cols-6 gap-1">
              {["20%", "55%", "35%", "70%", "45%", "62%"].map((height, index) => (
                <div key={`${height}-${index}`} className="h-14 rounded-[4px] border border-black/15 bg-black/5 px-0.5 py-0.5">
                  <div
                    className="w-full rounded-[2px] bg-[#3b82f6] animate-pulse"
                    style={{
                      height,
                      animationDelay: `${index * 120}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Build Meter"
            subtitle="Progress estimate"
            className="md:absolute md:left-[31%] md:bottom-[6%] md:w-[260px]"
            desktopRotate={-2}
          >
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full border border-black/20 bg-white/55">
                <div className="h-full w-[78%] bg-[#1f74ff]" />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-black/65">
                <span>78% assembled</span>
                <span>ETA soon</span>
              </div>
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Visual Drop"
            subtitle="Motion snapshot"
            className="md:absolute md:left-[54%] md:bottom-[2%] md:w-[250px]"
            desktopRotate={5}
          >
            <div className="relative overflow-hidden rounded-[10px] border border-black/15">
              <Image
                src="/lab-images/slideshow-1769119859260.gif"
                alt="Animated visual snapshot"
                width={800}
                height={800}
                unoptimized
                className="h-[110px] w-full object-cover"
              />
            </div>
          </FloatingWindow>

          <FloatingWindow
            title="Notice"
            subtitle="Keep this tab"
            className="md:absolute md:right-[25%] md:bottom-[10%] md:w-[240px]"
            desktopRotate={4}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.05em] text-black/70">
              This destination is not live yet. We are polishing details and shipping a better experience.
            </p>
          </FloatingWindow>
        </div>
      </main>
    </StudioFrame>
  )
}
