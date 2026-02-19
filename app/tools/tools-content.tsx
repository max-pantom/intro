"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent, type WheelEvent } from "react"

import { PixelatedImage } from "@/components/ui/pixelated-image"
import { type CmsToolProject } from "@/lib/cms-types"

type ToolsContentProps = {
  projects: CmsToolProject[]
}

type StripSlot = -2 | -1 | 0 | 1 | 2

type StripSlotConfig = {
  x: number
  y: number
  width: number
  opacity: number
}

const TRANSITION_MS = 520
const TRANSITION_EASE = "cubic-bezier(0.22,1,0.36,1)"

const stripSlotMap: Record<StripSlot, StripSlotConfig> = {
  "-2": { x: -111, y: -29, width: 48, opacity: 0.4 },
  "-1": { x: -58, y: 0, width: 48, opacity: 0.62 },
  "0": { x: 0, y: 0, width: 58, opacity: 1 },
  "1": { x: 58, y: 0, width: 48, opacity: 0.62 },
  "2": { x: 111, y: -29, width: 48, opacity: 0.4 },
}

function wrapIndex(value: number, total: number) {
  if (total <= 0) return 0
  return ((value % total) + total) % total
}

function getCircularDistance(index: number, current: number, total: number) {
  if (total <= 1) return 0
  let distance = index - current
  if (distance > total / 2) distance -= total
  if (distance < -total / 2) distance += total
  return distance
}

function isImagePath(value: string) {
  return /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(value)
}

function isVideoPath(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(value)
}

function resolveSurfaceUrl(project: CmsToolProject, highlightIndex: number) {
  if (project.demoUrl) return project.demoUrl
  if (!project.highlightUrls.length) return ""
  return project.highlightUrls[highlightIndex % project.highlightUrls.length] ?? ""
}

function CheckerPattern({ rounded }: { rounded?: boolean }) {
  return (
    <div
      className={`absolute inset-0 ${rounded ? "rounded-[22px]" : ""}`}
      style={{
        backgroundImage:
          "linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%, rgba(0,0,0,0.035)), linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%, rgba(0,0,0,0.035))",
        backgroundPosition: "0 0, 20px 20px",
        backgroundSize: "40px 40px",
      }}
    />
  )
}

function SurfaceFrame({
  project,
  highlightIndex,
}: {
  project: CmsToolProject
  highlightIndex: number
}) {
  const surfaceUrl = resolveSurfaceUrl(project, highlightIndex)
  const hasImage = surfaceUrl ? isImagePath(surfaceUrl) : false
  const hasVideo = surfaceUrl ? isVideoPath(surfaceUrl) : false
  const hasEmbed = Boolean(surfaceUrl && !hasImage && !hasVideo && /^https?:\/\//i.test(surfaceUrl))

  return (
    <div className="relative aspect-[683/388] w-full overflow-hidden rounded-[22px]">
      {hasImage ? (
        <PixelatedImage
          src={surfaceUrl}
          alt={project.name}
          fill
          sizes="(min-width: 1100px) 683px, (min-width: 768px) min(683px, 100vw - 48px), calc(100vw - 32px)"
          className="object-cover"
          quality={100}
          draggable={false}
        />
      ) : null}

      {hasVideo ? (
        <video src={surfaceUrl} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />
      ) : null}

      {hasEmbed ? (
        <iframe
          src={surfaceUrl}
          title={project.name}
          className="absolute inset-0 h-full w-full bg-[#f3f3f3]"
          loading="lazy"
          allow="autoplay; clipboard-read; clipboard-write; fullscreen"
        />
      ) : null}

      {!surfaceUrl ? <CheckerPattern rounded /> : null}

      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span className="h-[10px] w-[10px] rounded-full bg-black/44" />
        <span className="h-[10px] w-[10px] rounded-full bg-black/62" />
        <span className="h-[10px] w-[10px] bg-black/48" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      </div>

      <span className="absolute right-3 top-3 border border-black/12 bg-[#f3f3f3]/90 px-1.5 py-[2px] font-mono text-[10px] uppercase tracking-[0.06em] text-black/55">
        {project.status || "ACTIVE"}
      </span>
    </div>
  )
}

function MiniFrame({ project, width }: { project: CmsToolProject; width: number }) {
  const previewUrl = project.demoUrl || project.highlightUrls[0] || ""
  const hasImage = previewUrl ? isImagePath(previewUrl) : false

  return (
    <div className="relative h-[34px] overflow-hidden" style={{ width: `${width}px` }}>
      {hasImage ? (
        <PixelatedImage src={previewUrl} alt={project.name} fill sizes={`${width}px`} className="object-cover" />
      ) : null}
      {!hasImage ? <CheckerPattern /> : null}
    </div>
  )
}

function ProjectLines({ project }: { project: CmsToolProject }) {
  const hasExternalLink = project.linkHref.startsWith("http") || project.linkHref.startsWith("mailto:")

  return (
    <div className="w-full font-mono text-[12px] uppercase leading-[1.35] tracking-[0.01em] text-black">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate pr-3">{project.name}</p>
        {project.linkLabel ? (
          hasExternalLink ? (
            <a href={project.linkHref} target="_blank" rel="noreferrer" className="shrink-0 text-black/45 hover:text-black/75">
              {project.linkLabel}
            </a>
          ) : (
            <a href={project.linkHref || "#"} className="shrink-0 text-black/45 hover:text-black/75">
              {project.linkLabel}
            </a>
          )
        ) : (
          <span className="shrink-0 text-black/32">NO LINK</span>
        )}
      </div>

      <div className="mt-[74px] flex items-start justify-between gap-5 text-black/80">
        <p className="w-[254px] whitespace-pre-wrap">{project.description || "ADD A DESCRIPTION IN CMS TO DESCRIBE THIS TOOL."}</p>
        <p className="shrink-0">{project.year || "2026"}</p>
      </div>
    </div>
  )
}

function CascadeCard({
  project,
  isActive,
  onClick,
}: {
  project: CmsToolProject
  isActive: boolean
  onClick: () => void
}) {
  const previewUrl = project.demoUrl || project.highlightUrls[0] || ""
  const hasImage = previewUrl ? isImagePath(previewUrl) : false
  const hasVideo = previewUrl ? isVideoPath(previewUrl) : false

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border p-1 text-left ${isActive ? "border-black/55 bg-[#efefef]" : "border-black/18 bg-[#ececec] hover:border-black/34"}`}
    >
      <div className="flex items-center justify-between border border-black/12 bg-[#e7e7e7] px-2 py-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/56">{project.status || "ACTIVE"}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/40">FILE</p>
      </div>
      <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-black/12">
        {hasImage ? (
          <PixelatedImage
            src={previewUrl}
            alt={project.name}
            fill
            sizes="(min-width: 1280px) 18vw, (min-width: 768px) 30vw, 44vw"
            className="object-cover"
            quality={100}
          />
        ) : null}
        {hasVideo ? (
          <video src={previewUrl} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />
        ) : null}
        {!previewUrl ? <CheckerPattern /> : null}
      </div>
      <p className="mt-1 truncate border border-black/12 bg-[#ececec] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-black/75">
        {project.name}
      </p>
    </button>
  )
}

export function ToolsContent({ projects }: ToolsContentProps) {
  const safeProjects = useMemo(() => projects.filter((project) => Boolean(project.id && project.name)), [projects])
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isTransitionReady, setIsTransitionReady] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [isCascadeOpen, setIsCascadeOpen] = useState(false)
  const transitionTimerRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
    }
  }, [])

  const normalizedActiveIndex = wrapIndex(activeIndex, safeProjects.length)
  const normalizedPreviousIndex = previousIndex !== null ? wrapIndex(previousIndex, safeProjects.length) : null
  const activeProject = safeProjects[normalizedActiveIndex]
  const previousProject = normalizedPreviousIndex !== null ? safeProjects[normalizedPreviousIndex] : null

  useEffect(() => {
    if (!activeProject || activeProject.demoUrl || activeProject.highlightUrls.length < 2) return
    const intervalId = window.setInterval(() => {
      setHighlightIndex((value) => (value + 1) % activeProject.highlightUrls.length)
    }, 2600)

    return () => window.clearInterval(intervalId)
  }, [activeProject])

  const startTransition = useCallback(
    (nextIndex: number) => {
      if (safeProjects.length < 2 || isTransitioning || nextIndex === normalizedActiveIndex) return

      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)

      setPreviousIndex(normalizedActiveIndex)
      setActiveIndex(nextIndex)
      setHighlightIndex(0)
      setIsTransitioning(true)
      setIsTransitionReady(false)
      window.requestAnimationFrame(() => setIsTransitionReady(true))

      transitionTimerRef.current = window.setTimeout(() => {
        setPreviousIndex(null)
        setIsTransitioning(false)
        setIsTransitionReady(false)
        transitionTimerRef.current = null
      }, TRANSITION_MS)
    },
    [safeProjects.length, isTransitioning, normalizedActiveIndex],
  )

  const navigate = useCallback(
    (direction: -1 | 1) => {
      if (safeProjects.length < 2) return
      const nextIndex = wrapIndex(normalizedActiveIndex + direction, safeProjects.length)
      startTransition(nextIndex)
    },
    [safeProjects.length, normalizedActiveIndex, startTransition],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTyping =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
      if (isTyping) return

      if (event.key === "ArrowDown") {
        event.preventDefault()
        if (!isCascadeOpen) navigate(1)
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        if (!isCascadeOpen) navigate(-1)
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault()
        setIsCascadeOpen((value) => !value)
      }

      if (event.key === "Escape") setIsCascadeOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isCascadeOpen, navigate])

  if (!activeProject) {
    return (
      <main className="flex h-full items-center justify-center px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-black/45">No tools projects yet. Add one in `/admin`.</p>
      </main>
    )
  }

  return (
    <main
      className="relative h-full overflow-hidden px-4 pt-[92px] md:px-6 md:pt-[96px]"
      onWheel={(event: WheelEvent<HTMLDivElement>) => {
        if (isCascadeOpen) return
        event.preventDefault()
        if (Math.abs(event.deltaY) < 8) return
        navigate(event.deltaY > 0 ? 1 : -1)
      }}
      onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
        touchStartYRef.current = event.touches[0]?.clientY ?? null
      }}
      onTouchEnd={(event: TouchEvent<HTMLDivElement>) => {
        if (isCascadeOpen || touchStartYRef.current === null) return
        const endY = event.changedTouches[0]?.clientY ?? touchStartYRef.current
        const deltaY = endY - touchStartYRef.current
        touchStartYRef.current = null
        if (Math.abs(deltaY) < 42) return
        navigate(deltaY < 0 ? 1 : -1)
      }}
    >
      <section className="pointer-events-none absolute left-1/2 top-[24px] z-10 h-[63px] w-[286px] -translate-x-1/2">
        {safeProjects.map((project, index) => {
          const distance = getCircularDistance(index, normalizedActiveIndex, safeProjects.length)
          if (Math.abs(distance) > 2) return null

          const slot = Math.round(distance) as StripSlot
          const slotConfig = stripSlotMap[slot]

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => startTransition(index)}
              className="pointer-events-auto absolute left-1/2 top-[29px] -translate-x-1/2 overflow-hidden border border-black/10 transition-[opacity,transform,width] duration-[520ms]"
              style={{
                opacity: slotConfig.opacity,
                width: `${slotConfig.width}px`,
                height: "34px",
                transform: `translate3d(calc(-50% + ${slotConfig.x}px), ${slotConfig.y}px, 0)`,
                transitionTimingFunction: TRANSITION_EASE,
                zIndex: 8 - Math.abs(slot),
              }}
              aria-label={`Open ${project.name}`}
            >
              <MiniFrame project={project} width={slotConfig.width} />
            </button>
          )
        })}
      </section>

      <section className="mx-auto w-full max-w-[683px] pt-[84px] md:pt-[86px]">
        <div className="relative">
          {previousProject ? (
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-[520ms] ${isTransitionReady ? "opacity-0" : "opacity-100"}`}
              style={{ transitionTimingFunction: TRANSITION_EASE }}
            >
              <SurfaceFrame project={previousProject} highlightIndex={0} />
            </div>
          ) : null}

          <div
            className={`transition-opacity duration-[520ms] ${previousProject ? (isTransitionReady ? "opacity-100" : "opacity-0") : "opacity-100"}`}
            style={{ transitionTimingFunction: TRANSITION_EASE }}
          >
            <SurfaceFrame project={activeProject} highlightIndex={highlightIndex} />
          </div>
        </div>

        <div className="relative mt-[12px] min-h-[170px]">
          {previousProject ? (
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-[520ms] ${isTransitionReady ? "opacity-0" : "opacity-100"}`}
              style={{ transitionTimingFunction: TRANSITION_EASE }}
            >
              <ProjectLines project={previousProject} />
            </div>
          ) : null}

          <div
            className={`transition-opacity duration-[520ms] ${previousProject ? (isTransitionReady ? "opacity-100" : "opacity-0") : "opacity-100"}`}
            style={{ transitionTimingFunction: TRANSITION_EASE }}
          >
            <ProjectLines project={activeProject} />
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setIsCascadeOpen(true)}
        className="absolute bottom-5 right-4 border border-black/18 bg-[#ececec]/82 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-black/48 hover:border-black/36 hover:text-black/72 md:bottom-6 md:right-6"
      >
        Cascade
      </button>

      {isCascadeOpen ? (
        <div className="absolute inset-0 z-30 bg-black/12 px-4 pb-6 pt-[110px] md:px-6 md:pt-[118px]">
          <section className="pantom-scrollbar mx-auto flex h-full w-full max-w-[960px] flex-col overflow-y-auto border border-black/20 bg-[#ececec] p-3">
            <div className="flex items-center justify-between border-b border-black/14 pb-2">
              <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-black/62">All Projects</p>
              <button
                type="button"
                onClick={() => setIsCascadeOpen(false)}
                className="border border-black/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-black/60"
              >
                Close
              </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {safeProjects.map((project, index) => (
                <CascadeCard
                  key={`${project.id}-cascade`}
                  project={project}
                  isActive={index === normalizedActiveIndex}
                  onClick={() => {
                    setIsCascadeOpen(false)
                    startTransition(index)
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
