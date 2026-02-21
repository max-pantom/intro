"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent, type WheelEvent } from "react"

import { PixelatedImage } from "@/components/ui/pixelated-image"
import { type CmsToolProject } from "@/lib/cms-types"

type ToolsContentProps = {
  projects: CmsToolProject[]
}

type ToolsMode = "block" | "timeline"

const PROJECT_TRANSITION_MS = 420
const PROJECT_TRANSITION_EASE = "cubic-bezier(0.22,1,0.36,1)"
const SWIPE_THRESHOLD = 42

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function wrapIndex(value: number, total: number) {
  if (total <= 0) return 0
  return ((value % total) + total) % total
}

function isImagePath(value: string) {
  return /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(value)
}

function isVideoPath(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(value)
}

function normalizeUpperLabel(value: string) {
  return value.replace(/\[\s*↗\s*\]/g, "").trim().toUpperCase()
}

function resolveSurfaceUrl(project: CmsToolProject, highlightIndex = 0) {
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
  overlayClassName,
  className,
  imageClassName,
}: {
  project: CmsToolProject
  highlightIndex: number
  overlayClassName?: string
  className?: string
  imageClassName?: string
}) {
  const surfaceUrl = resolveSurfaceUrl(project, highlightIndex)
  const hasImage = surfaceUrl ? isImagePath(surfaceUrl) : false
  const hasVideo = surfaceUrl ? isVideoPath(surfaceUrl) : false
  const hasEmbed = Boolean(surfaceUrl && !hasImage && !hasVideo && /^https?:\/\//i.test(surfaceUrl))

  return (
    <div className={`relative aspect-[683/388] w-full overflow-hidden bg-[#d9d9d9] ${className ?? ""}`}>
      {hasImage ? (
        <PixelatedImage
          src={surfaceUrl}
          alt={project.name}
          fill
          sizes="(min-width: 1280px) 720px, (min-width: 768px) min(720px, 100vw - 48px), calc(100vw - 32px)"
          className={`object-cover ${imageClassName ?? ""}`}
          quality={100}
          draggable={false}
          unoptimized
        />
      ) : null}

      {hasVideo ? (
        <video src={surfaceUrl} className={`absolute inset-0 h-full w-full object-cover ${imageClassName ?? ""}`} autoPlay loop muted playsInline />
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

      {!surfaceUrl ? <CheckerPattern /> : null}
      {overlayClassName ? <div className={`absolute inset-0 ${overlayClassName}`} /> : null}
    </div>
  )
}

function ProjectLine({ project }: { project: CmsToolProject }) {
  return (
    <div className="mt-[10px] flex items-center justify-between gap-3 font-mono text-[12px] font-medium uppercase leading-none tracking-[-0.02em] text-black/40 transition-colors group-hover:text-black/58">
      <p className="truncate">{project.name || "UNTITLED TOOL"}</p>
      <p className="shrink-0">{project.year || "2026"}</p>
    </div>
  )
}

function BlockIcon() {
  return (
    <span className="inline-grid grid-cols-2 gap-[1px]">
      <span className="h-[4px] w-[4px] bg-black" />
      <span className="h-[4px] w-[4px] bg-black" />
      <span className="h-[4px] w-[4px] bg-black" />
      <span className="h-[4px] w-[4px] bg-black" />
    </span>
  )
}

function TimelineIcon() {
  return (
    <span className="inline-flex items-end gap-[1px]">
      <span className="h-[9px] w-[2px] bg-black" />
      <span className="h-[9px] w-[2px] bg-black" />
      <span className="h-[9px] w-[2px] bg-black" />
      <span className="h-[9px] w-[2px] bg-black" />
    </span>
  )
}

function TopModeToggle({
  mode,
  onChange,
}: {
  mode: ToolsMode
  onChange: (mode: ToolsMode) => void
}) {
  const buttonClassName =
    "inline-flex items-center gap-1.5 font-mono text-[12px] font-medium uppercase tracking-[-0.02em] transition-opacity hover:opacity-80"

  return (
    <div className="absolute left-1/2 top-[36px] z-30 -translate-x-1/2">
      <div className="flex items-center gap-[31px]">
        <button type="button" onClick={() => onChange("block")} className={`${buttonClassName} ${mode === "block" ? "opacity-80" : "opacity-20"}`}>
          <BlockIcon />
          <span>BLOCK</span>
        </button>
        <button type="button" onClick={() => onChange("timeline")} className={`${buttonClassName} ${mode === "timeline" ? "opacity-80" : "opacity-20"}`}>
          <TimelineIcon />
          <span>TIMELINE</span>
        </button>
      </div>
    </div>
  )
}

function ToolsLogo() {
  return (
    <Link href="/" aria-label="Go to home" className="absolute left-6 top-6 z-30 w-[74px]">
      <span className="block h-[41px] w-full bg-black" />
      <span className="mt-[1px] block text-center font-sans text-[29px] font-medium uppercase leading-none tracking-[-0.08em] text-black">PANTOM</span>
    </Link>
  )
}

function BlockView({
  projects,
  activeIndex,
  onSelect,
}: {
  projects: CmsToolProject[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const slots = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        slotIndex: index,
        projectIndex: projects.length > 0 ? index % projects.length : 0,
      })),
    [projects.length],
  )

  return (
    <section className="mx-auto flex h-full w-full max-w-[1270px] flex-col justify-start px-[8px] pt-[112px] md:px-[14px] md:pt-[132px] lg:px-[20px]">
      <div className="grid grid-cols-1 gap-x-[34px] gap-y-[26px] sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-[44px] lg:gap-y-[30px]">
        {slots.map((slot) => {
          const project = projects[slot.projectIndex]
          if (!project) return null

          const isSecondaryRow = slot.slotIndex >= 3
          const isActive = !isSecondaryRow && slot.projectIndex === activeIndex

          return (
            <button
              key={`${project.id}-${slot.slotIndex}`}
              type="button"
              onClick={() => onSelect(slot.projectIndex)}
              className={`group text-left transition-transform duration-300 ${isActive ? "scale-100" : "scale-100 hover:scale-[1.02]"}`}
            >
              <SurfaceFrame
                project={project}
                highlightIndex={0}
                className={`aspect-[391/263] transition-[filter,opacity,transform] duration-300 ${isSecondaryRow ? "opacity-[0.66] saturate-[0.82]" : "opacity-100 saturate-100"}`}
                imageClassName=""
                overlayClassName={isActive ? "" : isSecondaryRow ? "bg-black/36 group-hover:bg-black/24" : "bg-black/22 group-hover:bg-black/10"}
              />
              <ProjectLine project={project} />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function TimelineRail({
  projects,
  activeIndex,
  onSelect,
}: {
  projects: CmsToolProject[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const markerRatio = projects.length > 1 ? activeIndex / (projects.length - 1) : 0

  const openByPointer = (clientX: number) => {
    if (!railRef.current || projects.length <= 1) return
    const bounds = railRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const closest = Math.round(ratio * (projects.length - 1))
    onSelect(closest)
  }

  return (
    <div className="relative mx-auto mt-[32px] w-full max-w-[1000px] px-2 md:mt-[40px] md:px-0">
      <div
        ref={railRef}
        className="relative h-[88px] w-full cursor-pointer"
        onClick={(event) => openByPointer(event.clientX)}
        onTouchStart={(event) => {
          const point = event.touches[0]
          if (point) openByPointer(point.clientX)
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-[20px] opacity-80"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, transparent 0 7px, rgba(0,0,0,0.85) 7px 8px), linear-gradient(to right, rgba(0,0,0,0.95) 1px, transparent 1px)",
            backgroundSize: "8px 100%, 92px 100%",
          }}
        />

        {projects.map((project, index) => {
          const ratio = projects.length > 1 ? index / (projects.length - 1) : 0
          return (
            <button
              key={project.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(index)
              }}
              className="absolute bottom-0 h-[22px] w-[14px] -translate-x-1/2"
              style={{ left: `${ratio * 100}%` }}
              aria-label={`Open ${project.name}`}
            >
              <span className={`absolute bottom-0 left-1/2 w-px -translate-x-1/2 ${index === activeIndex ? "h-[20px] bg-[#ff4d20]" : "h-[11px] bg-black"}`} />
            </button>
          )
        })}

        <div className="pointer-events-none absolute bottom-[21px] h-[30px] w-[50px] -translate-x-1/2 overflow-hidden border border-black/10 bg-[#d9d9d9]" style={{ left: `${markerRatio * 100}%` }}>
          <SurfaceFrame
            project={projects[activeIndex]}
            highlightIndex={0}
            className="aspect-auto h-full w-full"
            imageClassName="object-cover"
            overlayClassName="bg-black/0"
          />
        </div>

        <p className="pointer-events-none absolute bottom-[54px] -translate-x-1/2 font-mono text-[8px] uppercase tracking-[-0.02em] text-black/40" style={{ left: `${markerRatio * 100}%` }}>
          {projects[activeIndex]?.year || "2026"}
        </p>
      </div>
    </div>
  )
}

function TimelineView({
  activeProject,
  previousProject,
  previousNeighbor,
  nextNeighbor,
  isTransitionReady,
  onNavigateByWheel,
  onTouchStart,
  onTouchEnd,
  projects,
  activeIndex,
  onSelect,
}: {
  activeProject: CmsToolProject
  previousProject: CmsToolProject | null
  previousNeighbor: CmsToolProject
  nextNeighbor: CmsToolProject
  isTransitionReady: boolean
  onNavigateByWheel: (event: WheelEvent<HTMLDivElement>) => void
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void
  projects: CmsToolProject[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const label = normalizeUpperLabel(activeProject.linkLabel || activeProject.name || "TOOL")
  const description = (activeProject.description || "ADD A DESCRIPTION IN CMS TO DESCRIBE THIS TOOL.").toUpperCase()

  return (
    <section className="relative mx-auto h-full min-h-[880px] w-full max-w-[1232px] pt-[116px] md:min-h-[920px] md:pt-[136px]" onWheel={onNavigateByWheel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="pointer-events-none absolute left-1/2 top-[26px] hidden h-[320px] w-[500px] -translate-x-1/2 -rotate-[9.9deg] opacity-20 md:block">
        <SurfaceFrame project={previousNeighbor} highlightIndex={0} className="aspect-auto h-full w-full" imageClassName="object-cover" />
      </div>

      <div className="pointer-events-none absolute bottom-[186px] left-1/2 hidden h-[320px] w-[500px] -translate-x-1/2 rotate-[8.6deg] opacity-20 md:block">
        <SurfaceFrame project={nextNeighbor} highlightIndex={0} className="aspect-auto h-full w-full" imageClassName="object-cover" />
      </div>

      <p className="absolute left-0 top-[180px] hidden w-[222px] font-mono text-[12px] font-medium uppercase tracking-[-0.02em] text-black md:block">{label}</p>

      <div className="relative mx-auto mt-[20px] w-full max-w-[720px] md:absolute md:left-1/2 md:top-1/2 md:mt-0 md:-translate-x-1/2 md:-translate-y-1/2">
        <div className="relative aspect-[720/473] overflow-hidden bg-[#d9d9d9]">
          {previousProject ? (
            <div
              className={`pointer-events-none absolute inset-0 transition-[opacity,transform] ${isTransitionReady ? "translate-y-[-6px] opacity-0" : "translate-y-0 opacity-100"}`}
              style={{ transitionDuration: `${PROJECT_TRANSITION_MS}ms`, transitionTimingFunction: PROJECT_TRANSITION_EASE }}
            >
              <SurfaceFrame project={previousProject} highlightIndex={0} className="aspect-auto h-full w-full" />
            </div>
          ) : null}

          <div
            className={`absolute inset-0 transition-[opacity,transform] ${previousProject ? (isTransitionReady ? "translate-y-0 opacity-100" : "translate-y-[6px] opacity-0") : "translate-y-0 opacity-100"}`}
            style={{ transitionDuration: `${PROJECT_TRANSITION_MS}ms`, transitionTimingFunction: PROJECT_TRANSITION_EASE }}
          >
            <SurfaceFrame project={activeProject} highlightIndex={0} className="aspect-auto h-full w-full" />
          </div>
        </div>
      </div>

      <p className="absolute right-0 top-1/2 hidden w-[222px] -translate-y-1/2 text-right font-mono text-[12px] font-medium uppercase tracking-[-0.02em] text-black/80 xl:block">
        {description}
      </p>

      <p className="mx-auto mt-5 max-w-[720px] font-mono text-[12px] font-medium uppercase tracking-[-0.02em] text-black/80 xl:hidden">{description}</p>

      <div className="mt-[24px] md:absolute md:bottom-[18px] md:left-1/2 md:mt-0 md:w-full md:max-w-[1030px] md:-translate-x-1/2">
        <TimelineRail projects={projects} activeIndex={activeIndex} onSelect={onSelect} />
      </div>
    </section>
  )
}

export function ToolsContent({ projects }: ToolsContentProps) {
  const safeProjects = useMemo(() => projects.filter((project) => Boolean(project.id && project.name)), [projects])
  const [mode, setMode] = useState<ToolsMode>("timeline")
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isTransitionReady, setIsTransitionReady] = useState(false)
  const transitionTimerRef = useRef<number | null>(null)
  const lastWheelAtRef = useRef(0)
  const touchStartXRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
    }
  }, [])

  const normalizedActiveIndex = wrapIndex(activeIndex, safeProjects.length)
  const normalizedPreviousIndex = previousIndex !== null ? wrapIndex(previousIndex, safeProjects.length) : null
  const activeProject = safeProjects[normalizedActiveIndex]
  const previousProject = normalizedPreviousIndex !== null ? safeProjects[normalizedPreviousIndex] : null
  const previousNeighbor = safeProjects[wrapIndex(normalizedActiveIndex - 1, safeProjects.length)] ?? activeProject
  const nextNeighbor = safeProjects[wrapIndex(normalizedActiveIndex + 1, safeProjects.length)] ?? activeProject

  const startTransition = useCallback(
    (nextIndex: number) => {
      if (safeProjects.length < 2) return
      const normalizedNext = wrapIndex(nextIndex, safeProjects.length)
      if (normalizedNext === normalizedActiveIndex) return

      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
      setPreviousIndex(normalizedActiveIndex)
      setActiveIndex(normalizedNext)
      setIsTransitionReady(false)
      window.requestAnimationFrame(() => setIsTransitionReady(true))

      transitionTimerRef.current = window.setTimeout(() => {
        setPreviousIndex(null)
        setIsTransitionReady(false)
        transitionTimerRef.current = null
      }, PROJECT_TRANSITION_MS)
    },
    [safeProjects.length, normalizedActiveIndex],
  )

  const navigate = useCallback(
    (direction: -1 | 1) => {
      if (safeProjects.length < 2) return
      startTransition(normalizedActiveIndex + direction)
    },
    [safeProjects.length, normalizedActiveIndex, startTransition],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTyping =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
      if (isTyping) return

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault()
        navigate(1)
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault()
        navigate(-1)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navigate])

  if (!activeProject) {
    return (
      <main className="flex h-full items-center justify-center px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-black/45">No tools projects yet. Add one in `/admin`.</p>
      </main>
    )
  }

  return (
    <main
      className="relative h-full overflow-hidden px-4 pb-6 md:px-6 md:pb-8"
      style={{ backgroundColor: "#f3f3f3" }}
    >
      <ToolsLogo />
      <TopModeToggle mode={mode} onChange={setMode} />

      <div className="relative mx-auto h-full w-full">
        <div className={`absolute inset-0 overflow-y-auto transition-[opacity,transform] duration-500 ${mode === "block" ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-2 opacity-0"}`}>
          <BlockView projects={safeProjects} activeIndex={normalizedActiveIndex} onSelect={startTransition} />
        </div>

        <div className={`absolute inset-0 overflow-y-auto transition-[opacity,transform] duration-500 ${mode === "timeline" ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-2 opacity-0"}`}>
          <TimelineView
            activeProject={activeProject}
            previousProject={previousProject}
            previousNeighbor={previousNeighbor}
            nextNeighbor={nextNeighbor}
            isTransitionReady={isTransitionReady}
            onNavigateByWheel={(event) => {
              event.preventDefault()
              if (Math.abs(event.deltaY) < 10) return

              const now = performance.now()
              if (now - lastWheelAtRef.current < PROJECT_TRANSITION_MS * 0.75) return
              lastWheelAtRef.current = now
              navigate(event.deltaY > 0 ? 1 : -1)
            }}
            onTouchStart={(event) => {
              touchStartXRef.current = event.touches[0]?.clientX ?? null
            }}
            onTouchEnd={(event) => {
              if (touchStartXRef.current === null) return
              const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current
              const deltaX = endX - touchStartXRef.current
              touchStartXRef.current = null
              if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
              navigate(deltaX < 0 ? 1 : -1)
            }}
            projects={safeProjects}
            activeIndex={normalizedActiveIndex}
            onSelect={startTransition}
          />
        </div>
      </div>
    </main>
  )
}
