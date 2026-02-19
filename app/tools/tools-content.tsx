"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent, type WheelEvent } from "react"

import { PixelatedImage } from "@/components/ui/pixelated-image"
import { type CmsToolProject } from "@/lib/cms-types"

type ToolsContentProps = {
  projects: CmsToolProject[]
}

type StripSlot = -2 | -1 | 0 | 1 | 2

const TRANSITION_MS = 520
const stripPositionMap: Record<StripSlot, { x: number; y: number; scale: number; opacity: number }> = {
  "-2": { x: -110, y: -28, scale: 0.7, opacity: 0.35 },
  "-1": { x: -55, y: 0, scale: 0.86, opacity: 0.6 },
  "0": { x: 0, y: 0, scale: 1, opacity: 1 },
  "1": { x: 55, y: 0, scale: 0.86, opacity: 0.6 },
  "2": { x: 110, y: -28, scale: 0.7, opacity: 0.35 },
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

function CheckerSurface() {
  return (
    <div
      className="absolute inset-0 rounded-[22px] border border-black/8"
      style={{
        backgroundImage:
          "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05)), linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05))",
        backgroundPosition: "0 0, 20px 20px",
        backgroundSize: "40px 40px",
      }}
    />
  )
}

function ViewerSurface({
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
    <section className="relative mx-auto w-full max-w-[683px]">
      <div className="relative aspect-[683/388] overflow-hidden rounded-[22px]">
        {hasImage ? (
          <PixelatedImage
            src={surfaceUrl}
            alt={project.name}
            fill
            sizes="(min-width: 900px) 683px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)"
            className="object-cover"
            quality={100}
            draggable={false}
          />
        ) : null}

        {hasVideo ? (
          <video
            src={surfaceUrl}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
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

        {!surfaceUrl ? <CheckerSurface /> : null}

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-full bg-black/45" />
          <span className="h-[10px] w-[10px] rounded-full bg-black/70" />
          <span
            className="h-[10px] w-[10px] bg-black/55"
            style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
          />
        </div>

        <span className="absolute right-3 top-3 border border-black/20 bg-[#ececec]/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-black/70">
          {project.status || "ACTIVE"}
        </span>
      </div>
    </section>
  )
}

function ProjectMeta({ project }: { project: CmsToolProject }) {
  const hasExternalLink = project.linkHref.startsWith("http") || project.linkHref.startsWith("mailto:")

  return (
    <section className="mx-auto mt-6 w-full max-w-[683px]">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/55">{project.tagline || "PROJECT"}</p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[24px] uppercase leading-none tracking-[-0.02em] text-black">{project.name}</h2>
        {project.linkLabel ? (
          hasExternalLink ? (
            <a
              href={project.linkHref}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] uppercase tracking-[0.04em] text-black/45 hover:text-black/75"
            >
              {project.linkLabel}
            </a>
          ) : (
            <a href={project.linkHref || "#"} className="font-mono text-[12px] uppercase tracking-[0.04em] text-black/45 hover:text-black/75">
              {project.linkLabel}
            </a>
          )
        ) : null}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <p className="max-w-[270px] font-mono text-[12px] uppercase leading-[1.35] tracking-[0.02em] text-black/75">
          {project.description || "ADD PROJECT CONTEXT FROM CMS TO DESCRIBE WHAT THIS TOOL DOES."}
        </p>
        <p className="pt-1 font-mono text-[12px] uppercase tracking-[0.04em] text-black/68">{project.year}</p>
      </div>
    </section>
  )
}

function CascadeProjectCard({
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
      className={`border p-1 text-left ${isActive ? "border-black/60 bg-[#f3f3f3]" : "border-black/15 bg-[#efefef] hover:border-black/35"}`}
    >
      <div className="flex items-center justify-between border border-black/10 bg-[#ebebeb] px-2 py-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/60">{project.status || "ACTIVE"}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/45">FILE</p>
      </div>
      <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-black/10 bg-[#e6e6e6]">
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
        {!previewUrl ? <CheckerSurface /> : null}
      </div>
      <p className="mt-1 truncate border border-black/10 bg-[#ededed] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-black/72">
        {project.name}
      </p>
    </button>
  )
}

export function ToolsContent({ projects }: ToolsContentProps) {
  const safeProjects = useMemo(() => (projects.length > 0 ? projects : []), [projects])
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isTransitionReady, setIsTransitionReady] = useState(false)
  const [isCascadeOpen, setIsCascadeOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const touchStartYRef = useRef<number | null>(null)
  const transitionTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  const normalizedActiveIndex = wrapIndex(activeIndex, safeProjects.length)
  const normalizedPreviousIndex = previousIndex !== null ? wrapIndex(previousIndex, safeProjects.length) : null
  const activeProject = safeProjects[normalizedActiveIndex]
  const previousProject = normalizedPreviousIndex !== null ? safeProjects[normalizedPreviousIndex] : null

  useEffect(() => {
    if (!activeProject || activeProject.highlightUrls.length < 2 || activeProject.demoUrl) return

    const intervalId = window.setInterval(() => {
      setHighlightIndex((value) => (value + 1) % activeProject.highlightUrls.length)
    }, 2400)

    return () => window.clearInterval(intervalId)
  }, [activeProject])

  const startTransition = useCallback((nextIndex: number) => {
    if (safeProjects.length < 2 || isTransitioning || nextIndex === normalizedActiveIndex) return

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
    }

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
  }, [safeProjects.length, isTransitioning, normalizedActiveIndex])

  const navigate = useCallback((direction: -1 | 1) => {
    const nextIndex = wrapIndex(normalizedActiveIndex + direction, safeProjects.length)
    startTransition(nextIndex)
  }, [normalizedActiveIndex, safeProjects.length, startTransition])

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

      if (event.key === "Escape") {
        setIsCascadeOpen(false)
      }
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
      className="relative flex h-full flex-col overflow-hidden px-4 pb-5 pt-[102px] md:px-6 md:pb-7 md:pt-[106px]"
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
      <section className="relative mx-auto h-[54px] w-full max-w-[683px]">
        {safeProjects.map((project, index) => {
          const distance = getCircularDistance(index, normalizedActiveIndex, safeProjects.length)
          if (Math.abs(distance) > 2) return null

          const slot = Math.round(distance) as StripSlot
          const slotConfig = stripPositionMap[slot]
          const previewUrl = project.demoUrl || project.highlightUrls[0] || ""
          const isCenter = slot === 0
          const transform = `translate3d(calc(-50% + ${slotConfig.x}px), ${slotConfig.y}px, 0) scale(${slotConfig.scale})`

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => startTransition(index)}
              className={`absolute left-1/2 top-0 h-[34px] w-[48px] overflow-hidden border transition-[opacity,transform,border-color] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isCenter ? "border-black/35" : "border-black/10"}`}
              style={{
                transform,
                opacity: slotConfig.opacity,
                zIndex: 10 - Math.abs(slot),
              }}
              aria-label={`Open ${project.name}`}
            >
              {previewUrl && isImagePath(previewUrl) ? (
                <PixelatedImage src={previewUrl} alt={project.name} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="h-full w-full bg-[#d9d9d9]" />
              )}
            </button>
          )
        })}
      </section>

      <div className="mx-auto mt-2 flex w-full max-w-[683px] items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border border-black/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-black/60 hover:border-black/35"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => setIsCascadeOpen(true)}
          className="border border-black/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-black/60 hover:border-black/35"
        >
          Cascade
        </button>
        <button
          type="button"
          onClick={() => navigate(1)}
          className="border border-black/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-black/60 hover:border-black/35"
        >
          Next
        </button>
      </div>

      <div className="relative mx-auto mt-6 w-full max-w-[683px]">
        {previousProject ? (
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isTransitionReady ? "opacity-0" : "opacity-100"}`}
          >
            <ViewerSurface project={previousProject} highlightIndex={0} />
          </div>
        ) : null}

        <div
          className={`transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${previousProject ? (isTransitionReady ? "opacity-100" : "opacity-0") : "opacity-100"}`}
        >
          <ViewerSurface project={activeProject} highlightIndex={highlightIndex} />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[683px] flex-1">
        {previousProject ? (
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isTransitionReady ? "opacity-0" : "opacity-100"}`}
          >
            <ProjectMeta project={previousProject} />
          </div>
        ) : null}

        <div
          className={`transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${previousProject ? (isTransitionReady ? "opacity-100" : "opacity-0") : "opacity-100"}`}
        >
          <ProjectMeta project={activeProject} />
        </div>
      </div>

      {isCascadeOpen ? (
        <div className="absolute inset-0 z-30 bg-black/12 px-4 pb-6 pt-[120px] md:px-6 md:pt-[128px]">
          <section className="pantom-scrollbar mx-auto flex h-full w-full max-w-[980px] flex-col overflow-y-auto border border-black/20 bg-[#ececec] p-3 shadow-[0_18px_38px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-black/14 pb-2">
              <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-black/62">Project Cascade</p>
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
                <CascadeProjectCard
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
