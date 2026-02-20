"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent, type WheelEvent } from "react"

import { PixelatedImage } from "@/components/ui/pixelated-image"
import { type CmsToolProject } from "@/lib/cms-types"

type ToolsContentProps = {
  projects: CmsToolProject[]
}

const TRANSITION_MS = 564
const TRANSITION_EASE = "cubic-bezier(0.22,1,0.36,1)"

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
  onToggleExpand,
}: {
  project: CmsToolProject
  highlightIndex: number
  onToggleExpand: () => void
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
          sizes="(min-width: 1100px) 860px, (min-width: 768px) min(860px, 100vw - 48px), calc(100vw - 32px)"
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
        <span className="h-[10px] w-[10px] rounded-full bg-black/62 transition-colors hover:bg-black" />
        <button
          type="button"
          onClick={onToggleExpand}
          className="h-[10px] w-[10px] bg-black/44 transition-colors hover:bg-black"
          aria-label="Toggle enlarged preview"
        />
        <span className="h-[10px] w-[10px] bg-black/48 transition-colors hover:bg-black" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      </div>
    </div>
  )
}

function ProjectLines({ project }: { project: CmsToolProject }) {
  const normalizeExternalHref = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ""
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")) return trimmed
    if (trimmed.startsWith("/")) return trimmed
    return `https://${trimmed}`
  }

  const normalizedPrimaryHref = normalizeExternalHref(project.linkHref)
  const hasExternalLink = normalizedPrimaryHref.startsWith("http") || normalizedPrimaryHref.startsWith("mailto:")
  const socialLinks = [
    project.githubHref ? { label: "GITHUB [↗]", href: normalizeExternalHref(project.githubHref) } : null,
    project.instagramHref ? { label: "INSTAGRAM [↗]", href: normalizeExternalHref(project.instagramHref) } : null,
  ].filter((item): item is { label: string; href: string } => Boolean(item))

  return (
    <div className="w-full font-mono text-[12px] uppercase leading-[1.35] tracking-[0.01em] text-black">
      <div className="flex items-start justify-between gap-3">
        <p className="truncate pr-3 font-medium">{project.name}</p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {project.linkLabel ? (
            hasExternalLink ? (
              <a href={normalizedPrimaryHref} target="_blank" rel="noreferrer" className="text-black/45 hover:text-black/75">
                {project.linkLabel}
              </a>
            ) : (
              <a href={normalizedPrimaryHref || "#"} className="text-black/45 hover:text-black/75">
                {project.linkLabel}
              </a>
            )
          ) : (
            <span className="text-black/32">NO LINK</span>
          )}

          {socialLinks.length > 0 ? (
            <div className="flex flex-col items-end gap-1">
              {socialLinks.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="text-black/45 hover:text-black/75">
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-[132px] flex items-start justify-between gap-5 text-black/80">
        <p className="max-w-[560px] truncate whitespace-nowrap">{project.description || "ADD A DESCRIPTION IN CMS TO DESCRIBE THIS TOOL."}</p>
        <p className="shrink-0">{project.year || "2026"}</p>
      </div>
    </div>
  )
}

export function ToolsContent({ projects }: ToolsContentProps) {
  const safeProjects = useMemo(() => projects.filter((project) => Boolean(project.id && project.name)), [projects])
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isTransitionReady, setIsTransitionReady] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
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
        navigate(1)
      }

      if (event.key === "ArrowUp") {
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
      className="relative h-full overflow-hidden px-4 pt-[168px] md:px-6 md:pt-[228px]"
      onWheel={(event: WheelEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (Math.abs(event.deltaY) < 8) return
        navigate(event.deltaY > 0 ? 1 : -1)
      }}
      onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
        touchStartYRef.current = event.touches[0]?.clientY ?? null
      }}
      onTouchEnd={(event: TouchEvent<HTMLDivElement>) => {
        if (touchStartYRef.current === null) return
        const endY = event.changedTouches[0]?.clientY ?? touchStartYRef.current
        const deltaY = endY - touchStartYRef.current
        touchStartYRef.current = null
        if (Math.abs(deltaY) < 42) return
        navigate(deltaY < 0 ? 1 : -1)
      }}
    >
      <Link href="/" aria-label="Tools logo" className="absolute left-5 top-5 z-20 block h-[60px] w-[75px]">
        <svg width="75" height="60" viewBox="0 0 75 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="74.1667" height="40.8333" fill="black" />
          <path d="M5.56112 50.374C6.35864 50.374 6.98812 50.186 7.44954 49.8101C7.91667 49.4284 8.15023 48.8929 8.15023 48.2036C8.15023 47.5143 7.92806 46.9931 7.48372 46.6399C7.03939 46.2867 6.41561 46.1101 5.61238 46.1101H3.49324V50.374H5.56112ZM1.38265 56.834V44.3413H5.79183C7.13623 44.3413 8.21859 44.703 9.0389 45.4265C9.85921 46.15 10.2694 47.07 10.2694 48.1865C10.2694 48.9271 10.07 49.5993 9.67122 50.2031C9.27816 50.807 8.73413 51.2826 8.03914 51.6301C7.34985 51.9719 6.58366 52.1428 5.74056 52.1428H3.49324V56.834H1.38265ZM12.2262 56.834H10.0216L14.6016 44.3413H17.242L21.8136 56.834H19.5919L18.387 53.4417H13.431L12.2262 56.834ZM14.0291 51.7412H17.7889L15.9347 46.2639H15.8834L14.0291 51.7412ZM23.3602 44.3413H26.086L30.2474 51.5874C30.874 52.7609 31.3298 53.5926 31.6146 54.0825C31.5918 52.8407 31.5804 51.8608 31.5804 51.1431V44.3413H33.6654V56.834H30.9139L26.9405 50.0237C26.7069 49.5793 26.3936 48.9926 26.0006 48.2634C25.6075 47.5343 25.4081 47.164 25.4024 47.1526C25.4252 48.4172 25.4366 49.4626 25.4366 50.2886V56.834H23.3602V44.3413ZM35.1949 46.1272V44.3413H44.731V46.1272H41.0055V56.834H38.8863V46.1272H35.1949ZM48.6446 44.572C49.4763 44.2188 50.3906 44.0422 51.3875 44.0422C52.3844 44.0422 53.2987 44.2188 54.1305 44.572C54.9622 44.9252 55.6486 45.4037 56.1898 46.0076C56.7367 46.6057 57.1582 47.3007 57.4544 48.0925C57.7563 48.8787 57.9073 49.7104 57.9073 50.5876C57.9073 51.4649 57.7563 52.2995 57.4544 53.0913C57.1582 53.8774 56.7367 54.5724 56.1898 55.1763C55.6486 55.7744 54.9622 56.2501 54.1305 56.6033C53.2987 56.9565 52.3844 57.1331 51.3875 57.1331C50.3906 57.1331 49.4763 56.9565 48.6446 56.6033C47.8129 56.2501 47.1236 55.7744 46.5767 55.1763C46.0356 54.5724 45.6169 53.8774 45.3206 53.0913C45.0244 52.2995 44.8763 51.4649 44.8763 50.5876C44.8763 49.7104 45.0244 48.8787 45.3206 48.0925C45.6169 47.3007 46.0356 46.6057 46.5767 46.0076C47.1236 45.4037 47.8129 44.9252 48.6446 44.572ZM47.2945 48.7847C47.0951 49.3543 46.9954 49.9553 46.9954 50.5876C46.9954 51.22 47.0951 51.8238 47.2945 52.3992C47.4939 52.9688 47.773 53.473 48.1319 53.9116C48.4965 54.3503 48.9608 54.7006 49.5247 54.9626C50.0887 55.219 50.7096 55.3472 51.3875 55.3472C52.0654 55.3472 52.6864 55.219 53.2503 54.9626C53.8143 54.7006 54.2786 54.3503 54.6431 53.9116C55.0134 53.473 55.2983 52.9688 55.4976 52.3992C55.697 51.8238 55.7967 51.22 55.7967 50.5876C55.7967 49.9553 55.697 49.3543 55.4976 48.7847C55.2983 48.2093 55.0134 47.7023 54.6431 47.2637C54.2786 46.825 53.8143 46.4775 53.2503 46.2212C52.6864 45.9591 52.0654 45.8281 51.3875 45.8281C50.7096 45.8281 50.0887 45.9591 49.5247 46.2212C48.9608 46.4775 48.4965 46.825 48.1319 47.2637C47.773 47.7023 47.4939 48.2093 47.2945 48.7847ZM59.8299 56.834V44.3413L63.1197 44.3584L66.3326 54.3132H66.3497L69.5199 44.3413H72.7926V56.834H70.7674V46.7852H70.7076L67.4349 56.834H65.1961L61.9063 46.7852H61.8551V56.834H59.8299Z" fill="black" />
        </svg>
      </Link>

      <section className={`mx-auto w-full ${isExpanded ? "max-w-[1180px]" : "max-w-[980px]"}`}>
        <div className="relative">
          {previousProject ? (
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity ${isTransitionReady ? "opacity-0" : "opacity-100"}`}
              style={{ transitionDuration: `${TRANSITION_MS}ms`, transitionTimingFunction: TRANSITION_EASE }}
            >
              <SurfaceFrame project={previousProject} highlightIndex={0} onToggleExpand={() => setIsExpanded((value) => !value)} />
            </div>
          ) : null}

          <div
            className={`transition-opacity ${previousProject ? (isTransitionReady ? "opacity-100" : "opacity-0") : "opacity-100"}`}
            style={{ transitionDuration: `${TRANSITION_MS}ms`, transitionTimingFunction: TRANSITION_EASE }}
          >
            <SurfaceFrame project={activeProject} highlightIndex={highlightIndex} onToggleExpand={() => setIsExpanded((value) => !value)} />
          </div>
        </div>

        <div className="relative mt-[12px] min-h-[170px]">
          {previousProject ? (
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity ${isTransitionReady ? "opacity-0" : "opacity-100"}`}
              style={{ transitionDuration: `${TRANSITION_MS}ms`, transitionTimingFunction: TRANSITION_EASE }}
            >
              <ProjectLines project={previousProject} />
            </div>
          ) : null}

          <div
            className={`transition-opacity ${previousProject ? (isTransitionReady ? "opacity-100" : "opacity-0") : "opacity-100"}`}
            style={{ transitionDuration: `${TRANSITION_MS}ms`, transitionTimingFunction: TRANSITION_EASE }}
          >
            <ProjectLines project={activeProject} />
          </div>
        </div>
      </section>
    </main>
  )
}
