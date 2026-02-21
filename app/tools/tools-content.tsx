"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type TouchEvent, type WheelEvent } from "react"

import { RandomizedLabel } from "@/components/studio/randomized-label"
import { PixelatedImage } from "@/components/ui/pixelated-image"
import { type CmsToolProject } from "@/lib/cms-types"

type ToolsContentProps = {
  projects: CmsToolProject[]
}

type ToolsMode = "archive" | "journey"

const PROJECT_TRANSITION_MS = 420
const PROJECT_TRANSITION_EASE = "cubic-bezier(0.22,1,0.36,1)"

const DEFAULT_ARCHIVE_DIAL = {
  layout: {
    maxWidth: 2109,
    cardWidth: 760,
    gridGapX: 127,
    gridGapY: 127,
    thumbPadding: 0,
  },
  interaction: {
    inactiveOpacity: 0.56,
    inactiveSaturation: 0.5,
    hoverScale: 1,
    hoverContrast: 1.03,
    activeInnerBlur: 0,
    activeFrostOpacity: 0,
    activeFrostSaturation: 1,
  },
  link: {
    top: 5,
    left: 0,
    fontSize: 12,
  },
  transition: {
    durationMs: 632,
    yShift: 15,
    damping: 38,
    mass: 1.72,
    stiffness: 128,
  },
}

const DEFAULT_TIMELINE_DIAL = {
  rail: {
    height: 21,
    markerWidth: 34,
    markerHeight: 54,
    previewWidth: 49,
    previewHeight: 32,
    scrubSensitivity: 200,
  },
  location: {
    railOffsetX: 0,
    railOffsetY: 0,
    thumbnailOffsetX: 24,
    thumbnailOffsetY: -6,
    yearOffsetX: 9,
    yearOffsetY: 0,
  },
  transition: {
    markerShiftY: 11,
  },
}

const DEFAULT_STAGE_DIAL = {
  hero: {
    width: 1125,
    height: 572,
  },
  neighbors: {
    width: 422,
    height: 278,
    opacity: 0.76,
  },
  previous: {
    offsetX: 210,
    top: -233,
    rotate: 0,
  },
  next: {
    offsetX: 210,
    bottom: -199,
    rotate: 0,
  },
  layout: {
    sideWidth: 120,
    timelineMaxWidth: 768,
  },
  link: {
    top: 0,
    right: 14,
    fontSize: 11,
  },
}

const DEFAULT_MODE_DIAL = {
  transition: {
    modeSwitchMs: 1028,
    wheelThreshold: 91,
    wheelCooldown: 127,
    swipeThreshold: 138,
  },
}

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

function normalizeHref(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")) return trimmed
  if (trimmed.startsWith("/")) return trimmed
  return `https://${trimmed}`
}

function linkRows(project: CmsToolProject) {
  const rows: Array<{ label: string; href: string }> = []
  if (project.linkLabel && project.linkHref) {
    rows.push({ label: normalizeUpperLabel(project.linkLabel), href: normalizeHref(project.linkHref) })
  }
  if (project.githubHref) {
    rows.push({ label: "GITHUB [↗]", href: normalizeHref(project.githubHref) })
  }
  if (project.instagramHref) {
    rows.push({ label: "INSTAGRAM [↗]", href: normalizeHref(project.instagramHref) })
  }
  return rows
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
  overlayStyle,
  className,
  style,
  imageClassName,
}: {
  project: CmsToolProject
  highlightIndex: number
  overlayClassName?: string
  overlayStyle?: CSSProperties
  className?: string
  style?: CSSProperties
  imageClassName?: string
}) {
  const surfaceUrl = resolveSurfaceUrl(project, highlightIndex)
  const hasImage = surfaceUrl ? isImagePath(surfaceUrl) : false
  const hasVideo = surfaceUrl ? isVideoPath(surfaceUrl) : false
  const hasEmbed = Boolean(surfaceUrl && !hasImage && !hasVideo && /^https?:\/\//i.test(surfaceUrl))

  return (
    <div className={`relative aspect-[683/388] w-full overflow-hidden bg-[#d9d9d9] ${className ?? ""}`} style={style}>
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
      {overlayClassName ? <div className={`absolute inset-0 ${overlayClassName}`} style={overlayStyle} /> : null}
    </div>
  )
}

function ImageCornerLink({
  project,
  align,
  top,
  side,
  fontSize,
  overlay = true,
}: {
  project: CmsToolProject
  align: "left" | "right"
  top: number
  side: number
  fontSize: number
  overlay?: boolean
}) {
  const label = normalizeUpperLabel(project.linkLabel || project.name || "OPEN")
  const href = normalizeHref(project.linkHref)
  const isExternal = href.startsWith("http") || href.startsWith("mailto:")

  const className = `${overlay ? "absolute z-20" : "relative"} font-mono font-medium uppercase tracking-[-0.02em] text-black/74 mix-blend-multiply transition-colors hover:text-black`

  if (href) {
    return isExternal ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        style={{ top: `${top}px`, [align]: `${side}px`, fontSize: `${fontSize}px` } as CSSProperties}
      >
        {label}
      </a>
    ) : (
      <a href={href} className={className} style={{ top: `${top}px`, [align]: `${side}px`, fontSize: `${fontSize}px` } as CSSProperties}>
        {label}
      </a>
    )
  }

  return (
    <span className={className} style={{ top: `${top}px`, [align]: `${side}px`, fontSize: `${fontSize}px` } as CSSProperties}>
      {label}
    </span>
  )
}

function ProjectLine({ project, triggerKey }: { project: CmsToolProject; triggerKey: number }) {
  return (
    <div className="mt-[10px] flex items-center justify-between gap-3 font-mono text-[12px] font-medium uppercase leading-none tracking-[-0.02em] text-black/44 transition-colors duration-300 group-hover:text-black/78">
      <RandomizedLabel text={project.name || "UNTITLED TOOL"} triggerKey={triggerKey} intervalMs={14} className="truncate" />
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
        <button type="button" onClick={() => onChange("archive")} className={`${buttonClassName} ${mode === "archive" ? "opacity-80" : "opacity-20"}`}>
          <BlockIcon />
          <span>ARCHIVE</span>
        </button>
        <button type="button" onClick={() => onChange("journey")} className={`${buttonClassName} ${mode === "journey" ? "opacity-80" : "opacity-20"}`}>
          <TimelineIcon />
          <span>JOURNEY</span>
        </button>
      </div>
    </div>
  )
}

function ToolsLogo() {
  return (
    <Link href="/" aria-label="Tools logo" className="absolute left-5 top-5 z-30 block h-[60px] w-[75px]">
      <svg width="75" height="60" viewBox="0 0 75 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="74.1667" height="40.8333" fill="black" />
        <path d="M5.56112 50.374C6.35864 50.374 6.98812 50.186 7.44954 49.8101C7.91667 49.4284 8.15023 48.8929 8.15023 48.2036C8.15023 47.5143 7.92806 46.9931 7.48372 46.6399C7.03939 46.2867 6.41561 46.1101 5.61238 46.1101H3.49324V50.374H5.56112ZM1.38265 56.834V44.3413H5.79183C7.13623 44.3413 8.21859 44.703 9.0389 45.4265C9.85921 46.15 10.2694 47.07 10.2694 48.1865C10.2694 48.9271 10.07 49.5993 9.67122 50.2031C9.27816 50.807 8.73413 51.2826 8.03914 51.6301C7.34985 51.9719 6.58366 52.1428 5.74056 52.1428H3.49324V56.834H1.38265ZM12.2262 56.834H10.0216L14.6016 44.3413H17.242L21.8136 56.834H19.5919L18.387 53.4417H13.431L12.2262 56.834ZM14.0291 51.7412H17.7889L15.9347 46.2639H15.8834L14.0291 51.7412ZM23.3602 44.3413H26.086L30.2474 51.5874C30.874 52.7609 31.3298 53.5926 31.6146 54.0825C31.5918 52.8407 31.5804 51.8608 31.5804 51.1431V44.3413H33.6654V56.834H30.9139L26.9405 50.0237C26.7069 49.5793 26.3936 48.9926 26.0006 48.2634C25.6075 47.5343 25.4081 47.164 25.4024 47.1526C25.4252 48.4172 25.4366 49.4626 25.4366 50.2886V56.834H23.3602V44.3413ZM35.1949 46.1272V44.3413H44.731V46.1272H41.0055V56.834H38.8863V46.1272H35.1949ZM48.6446 44.572C49.4763 44.2188 50.3906 44.0422 51.3875 44.0422C52.3844 44.0422 53.2987 44.2188 54.1305 44.572C54.9622 44.9252 55.6486 45.4037 56.1898 46.0076C56.7367 46.6057 57.1582 47.3007 57.4544 48.0925C57.7563 48.8787 57.9073 49.7104 57.9073 50.5876C57.9073 51.4649 57.7563 52.2995 57.4544 53.0913C57.1582 53.8774 56.7367 54.5724 56.1898 55.1763C55.6486 55.7744 54.9622 56.2501 54.1305 56.6033C53.2987 56.9565 52.3844 57.1331 51.3875 57.1331C50.3906 57.1331 49.4763 56.9565 48.6446 56.6033C47.8129 56.2501 47.1236 55.7744 46.5767 55.1763C46.0356 54.5724 45.6169 53.8774 45.3206 53.0913C45.0244 52.2995 44.8763 51.4649 44.8763 50.5876C44.8763 49.7104 45.0244 48.8787 45.3206 48.0925C45.6169 47.3007 46.0356 46.6057 46.5767 46.0076C47.1236 45.4037 47.8129 44.9252 48.6446 44.572ZM47.2945 48.7847C47.0951 49.3543 46.9954 49.9553 46.9954 50.5876C46.9954 51.22 47.0951 51.8238 47.2945 52.3992C47.4939 52.9688 47.773 53.473 48.1319 53.9116C48.4965 54.3503 48.9608 54.7006 49.5247 54.9626C50.0887 55.219 50.7096 55.3472 51.3875 55.3472C52.0654 55.3472 52.6864 55.219 53.2503 54.9626C53.8143 54.7006 54.2786 54.3503 54.6431 53.9116C55.0134 53.473 55.2983 52.9688 55.4976 52.3992C55.697 51.8238 55.7967 51.22 55.7967 50.5876C55.7967 49.9553 55.697 49.3543 55.4976 48.7847C55.2983 48.2093 55.0134 47.7023 54.6431 47.2637C54.2786 46.825 53.8143 46.4775 53.2503 46.2212C52.6864 45.9591 52.0654 45.8281 51.3875 45.8281C50.7096 45.8281 50.0887 45.9591 49.5247 46.2212C48.9608 46.4775 48.4965 46.825 48.1319 47.2637C47.773 47.7023 47.4939 48.2093 47.2945 48.7847ZM59.8299 56.834V44.3413L63.1197 44.3584L66.3326 54.3132H66.3497L69.5199 44.3413H72.7926V56.834H70.7674V46.7852H70.7076L67.4349 56.834H65.1961L61.9063 46.7852H61.8551V56.834H59.8299Z" fill="black" />
      </svg>
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
  const archiveDial = DEFAULT_ARCHIVE_DIAL
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
  const [titleRevealTicks, setTitleRevealTicks] = useState<Record<number, number>>({})
  const transitionMs = Math.max(120, archiveDial.transition.durationMs + archiveDial.transition.mass * 36 - archiveDial.transition.stiffness * 0.12)
  const easeIn = clamp(0.16 + archiveDial.transition.mass * 0.03, 0.1, 0.42)
  const easeOut = clamp(1 - archiveDial.transition.damping * 0.018, 0.28, 0.95)
  const transitionEase = `cubic-bezier(${easeIn},${easeOut},0.28,1)`

  const slots = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        slotIndex: index,
        projectIndex: projects.length > 0 ? index % projects.length : 0,
      })),
    [projects.length],
  )

  return (
    <section className="mx-auto flex h-full w-full flex-col justify-start pt-[112px] md:pt-[132px]" style={{ maxWidth: `${archiveDial.layout.maxWidth}px` }}>
      <div
        className="grid grid-cols-1 justify-items-center sm:grid-cols-2 lg:grid-cols-3"
        style={{ columnGap: `${archiveDial.layout.gridGapX}px`, rowGap: `${archiveDial.layout.gridGapY}px` }}
      >
        {slots.map((slot) => {
          const project = projects[slot.projectIndex]
          if (!project) return null

          const isSecondaryRow = slot.slotIndex >= 3
          const isActive = !isSecondaryRow && slot.projectIndex === activeIndex
          const isHovered = hoveredSlot === slot.slotIndex
          const inactiveStyle = isSecondaryRow ? { opacity: archiveDial.interaction.inactiveOpacity, filter: `saturate(${archiveDial.interaction.inactiveSaturation})` } : { opacity: 1, filter: "saturate(1)" }

          return (
            <button
              key={`${project.id}-${slot.slotIndex}`}
              type="button"
              onClick={() => onSelect(slot.projectIndex)}
              onMouseEnter={() => {
                setHoveredSlot(slot.slotIndex)
                setTitleRevealTicks((prev) => ({ ...prev, [slot.slotIndex]: (prev[slot.slotIndex] ?? 0) + 1 }))
              }}
              onMouseLeave={() => setHoveredSlot(null)}
              onFocus={() => {
                setHoveredSlot(slot.slotIndex)
                setTitleRevealTicks((prev) => ({ ...prev, [slot.slotIndex]: (prev[slot.slotIndex] ?? 0) + 1 }))
              }}
              onBlur={() => setHoveredSlot(null)}
              className="group text-left transition-transform duration-300"
              style={{
                width: "100%",
                maxWidth: `${archiveDial.layout.cardWidth}px`,
                transform: `translateY(${isHovered ? archiveDial.transition.yShift : 0}px) scale(${isHovered ? archiveDial.interaction.hoverScale : 1})`,
                transitionDuration: `${transitionMs}ms`,
                transitionTimingFunction: transitionEase,
              }}
            >
              <div
                className="flex w-full"
                style={{
                  marginLeft: `${archiveDial.link.left}px`,
                  marginBottom: `${archiveDial.link.top}px`,
                }}
              >
                <ImageCornerLink
                  project={project}
                  align="left"
                  top={0}
                  side={0}
                  fontSize={archiveDial.link.fontSize}
                  overlay={false}
                />
              </div>

              <div className="relative" style={{ padding: `${archiveDial.layout.thumbPadding}px` }}>
                <SurfaceFrame
                  project={project}
                  highlightIndex={0}
                  className="aspect-[391/263] transition-[filter,opacity,transform]"
                  imageClassName="object-cover object-center transition-[transform,filter] duration-300 group-hover:scale-[1.02]"
                  style={{ filter: `contrast(${isHovered ? archiveDial.interaction.hoverContrast : 1})` }}
                  overlayClassName={isActive ? "transition-colors duration-300" : "bg-black/10 transition-colors duration-300 group-hover:bg-black/0"}
                  overlayStyle={
                    !isActive
                      ? {
                          backdropFilter: `blur(${archiveDial.interaction.activeInnerBlur}px) saturate(${archiveDial.interaction.activeFrostSaturation})`,
                          background: `linear-gradient(180deg, rgba(255,255,255,${archiveDial.interaction.activeFrostOpacity * 0.45}) 0%, rgba(255,255,255,${archiveDial.interaction.activeFrostOpacity}) 100%)`,
                        }
                      : undefined
                  }
                />
              </div>
              <div
                style={{
                  ...inactiveStyle,
                  transitionDuration: `${transitionMs}ms`,
                  transitionTimingFunction: transitionEase,
                }}
                className="transition-[opacity,filter] group-hover:opacity-100 group-hover:[filter:saturate(1)]"
              >
              <ProjectLine project={project} triggerKey={titleRevealTicks[slot.slotIndex] ?? 0} />
              </div>
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
  const timelineDial = DEFAULT_TIMELINE_DIAL

  const railRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const wheelAccumulatorRef = useRef(0)
  const markerRatio = projects.length > 1 ? activeIndex / (projects.length - 1) : 0
  const tickCount = 221
  const activeTick = Math.round(markerRatio * (tickCount - 1))

  const openByPointer = (clientX: number) => {
    if (!railRef.current || projects.length <= 1) return
    const bounds = railRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const closest = Math.round(ratio * (projects.length - 1))
    onSelect(closest)
  }

  const navigateByWheel = (delta: number) => {
    if (projects.length < 2 || delta === 0) return
    wheelAccumulatorRef.current += delta
    const threshold = Math.max(36, timelineDial.rail.scrubSensitivity)
    if (Math.abs(wheelAccumulatorRef.current) < threshold) return
    const steps = Math.floor(Math.abs(wheelAccumulatorRef.current) / threshold)
    const direction = wheelAccumulatorRef.current > 0 ? 1 : -1
    wheelAccumulatorRef.current -= direction * threshold * steps
    onSelect(wrapIndex(activeIndex + direction * steps, projects.length))
  }

  return (
    <div className="relative mx-auto mt-[32px] w-full max-w-[1000px] px-2 md:mt-[40px] md:px-0">
      <div
        ref={railRef}
        className="relative h-[88px] w-full cursor-pointer"
        onClick={(event) => openByPointer(event.clientX)}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          if (event.button !== 0) return
          isDraggingRef.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          openByPointer(event.clientX)
        }}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
          if (!isDraggingRef.current) return
          openByPointer(event.clientX)
        }}
        onPointerUp={(event: PointerEvent<HTMLDivElement>) => {
          isDraggingRef.current = false
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={() => {
          isDraggingRef.current = false
        }}
        onWheel={(event) => {
          event.preventDefault()
          const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
          navigateByWheel(delta)
        }}
        onTouchStart={(event) => {
          const point = event.touches[0]
          if (point) openByPointer(point.clientX)
        }}
      >
        <div
          className="absolute inset-x-0"
          style={{
            height: `${timelineDial.rail.height}px`,
            bottom: `${timelineDial.location.railOffsetY}px`,
            transform: `translateX(${timelineDial.location.railOffsetX}px)`,
          }}
        >
          {Array.from({ length: tickCount }, (_, index) => {
            const distance = Math.abs(index - activeTick)
            const majorHeight = timelineDial.rail.height
            const minorHeight = Math.max(10, Math.round(majorHeight * 0.5))
            let height = index % 20 === 0 ? majorHeight : minorHeight
            if (distance <= 6) {
              const mix = 1 - distance / 6
              height = Math.round(minorHeight + (majorHeight - minorHeight) * mix)
            }

            return (
              <span
                key={`tick-${index}`}
                className="absolute bottom-0 w-px"
                style={{
                  left: `${(index / (tickCount - 1)) * 100}%`,
                  height: `${height}px`,
                  backgroundColor: "black",
                  transform: "translateX(-50%)",
                }}
              />
            )
          })}

          <span
            className="absolute bottom-0 w-px"
            style={{
              left: `${markerRatio * 100}%`,
              height: `${timelineDial.rail.height}px`,
              backgroundColor: "#ff4d20",
              transform: "translateX(-50%)",
            }}
          />
        </div>

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
              className="absolute bottom-0 -translate-x-1/2"
              style={{
                left: `${ratio * 100}%`,
                height: `${timelineDial.rail.markerHeight}px`,
                width: `${timelineDial.rail.markerWidth}px`,
                transform: `translate(-50%, ${timelineDial.location.railOffsetY}px)`,
              }}
              aria-label={`Open ${project.name}`}
            >
              <span className="sr-only">{project.name}</span>
            </button>
          )
        })}

        <div
          className="pointer-events-none absolute -translate-x-1/2 overflow-hidden border border-black/10 bg-[#d9d9d9] transition-[left,transform] duration-300"
          style={{
            left: `${markerRatio * 100}%`,
            bottom: `${timelineDial.rail.height + 1 + timelineDial.location.railOffsetY + timelineDial.location.thumbnailOffsetY}px`,
            height: `${timelineDial.rail.previewHeight}px`,
            width: `${timelineDial.rail.previewWidth}px`,
            transform: `translateX(calc(-50% + ${timelineDial.location.thumbnailOffsetX}px)) translateY(-${timelineDial.transition.markerShiftY}px)`,
          }}
        >
          <SurfaceFrame
            project={projects[activeIndex]}
            highlightIndex={0}
            className="aspect-auto h-full w-full"
            imageClassName="object-cover"
            overlayClassName="bg-black/0"
          />
        </div>

        <p
          className="pointer-events-none absolute -translate-x-1/2 font-mono text-[8px] uppercase tracking-[-0.02em] text-black/40 transition-[left] duration-300"
          style={{
            left: `${markerRatio * 100}%`,
            bottom: `${timelineDial.rail.height + timelineDial.rail.previewHeight + 9 + timelineDial.location.railOffsetY + timelineDial.location.yearOffsetY}px`,
            transform: `translateX(calc(-50% + ${timelineDial.location.yearOffsetX}px))`,
          }}
        >
          {projects[activeIndex]?.year || "2026"}
        </p>

        <input
          type="range"
          min={0}
          max={Math.max(projects.length - 1, 0)}
          value={activeIndex}
          step={1}
          onChange={(event) => onSelect(Number(event.target.value))}
          className="absolute inset-x-0 bottom-0 h-[26px] w-full cursor-ew-resize opacity-0"
          aria-label="Journey timeline"
        />
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
  const stageDial = DEFAULT_STAGE_DIAL

  const label = normalizeUpperLabel(activeProject.linkLabel || activeProject.name || "TOOL")
  const description = (activeProject.description || "ADD A DESCRIPTION IN CMS TO DESCRIBE THIS TOOL.").toUpperCase()
  const activeLinks = linkRows(activeProject)
  const sideColumnWidth = Math.max(120, stageDial.layout.sideWidth)

  return (
    <section className="relative mx-auto h-full w-full pt-[116px] md:pt-[136px]" onWheel={onNavigateByWheel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div
        className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:block"
        style={{
          top: `${stageDial.previous.top}px`,
          width: `${stageDial.neighbors.width}px`,
          height: `${stageDial.neighbors.height}px`,
          marginLeft: `${stageDial.previous.offsetX}px`,
          transform: `translateX(-50%) rotate(${stageDial.previous.rotate}deg)`,
          opacity: stageDial.neighbors.opacity,
        }}
      >
        <SurfaceFrame project={previousNeighbor} highlightIndex={0} className="aspect-auto h-full w-full" imageClassName="object-cover" />
      </div>

      <div
        className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:block"
        style={{
          bottom: `${stageDial.next.bottom}px`,
          width: `${stageDial.neighbors.width}px`,
          height: `${stageDial.neighbors.height}px`,
          marginLeft: `${stageDial.next.offsetX}px`,
          transform: `translateX(-50%) rotate(${stageDial.next.rotate}deg)`,
          opacity: stageDial.neighbors.opacity,
        }}
      >
        <SurfaceFrame project={nextNeighbor} highlightIndex={0} className="aspect-auto h-full w-full" imageClassName="object-cover" />
      </div>

      <div className="mx-auto mt-[20px] grid w-full grid-cols-1 gap-5 md:mt-[54px] md:gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div
          className="hidden items-start md:grid"
          style={{
            gridTemplateColumns: `minmax(${sideColumnWidth}px,1fr) ${stageDial.hero.width}px minmax(${sideColumnWidth}px,1fr)`,
            columnGap: "24px",
          }}
        >
          <p className="self-start pt-[2px] font-mono text-[12px] font-medium uppercase tracking-[-0.02em] text-black">{label}</p>

          <div className="relative w-full justify-self-center" style={{ maxWidth: `${stageDial.hero.width}px` }}>
            <div className="relative w-full overflow-hidden bg-[#d9d9d9]" style={{ height: `${stageDial.hero.height}px` }}>
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

          <div className="relative flex h-full w-full flex-col justify-between overflow-hidden">
            <div className="self-start" style={{ marginLeft: `${stageDial.link.right}px`, marginTop: `${stageDial.link.top}px` }}>
              <div className="space-y-1 text-left">
                {activeLinks.map((row) => {
                  const external = row.href.startsWith("http") || row.href.startsWith("mailto:")
                  return (
                    <a
                      key={row.label}
                      href={row.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      className="block font-mono font-medium uppercase tracking-[-0.02em] text-black/74 transition-colors hover:text-black"
                      style={{ fontSize: `${stageDial.link.fontSize}px` }}
                    >
                      {row.label}
                    </a>
                  )
                })}
              </div>
            </div>
            <p
              className="self-start text-left font-mono text-[12px] font-medium uppercase leading-[1.35] tracking-[-0.01em] text-black/80"
              style={{ marginLeft: `${stageDial.link.right}px`, width: "min(320px, 100%)" }}
            >
              {description}
            </p>
          </div>
        </div>

        <div className="relative w-full md:hidden">
          <div className="relative w-full overflow-hidden bg-[#d9d9d9]" style={{ height: `${Math.max(240, stageDial.hero.height * 0.75)}px` }}>
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
      </div>

      <div className="mx-auto mt-3 w-full max-w-[720px] md:hidden" style={{ paddingLeft: `${Math.max(6, stageDial.link.right * 0.8)}px` }}>
        <div className="space-y-1 text-left">
          {activeLinks.map((row) => {
            const external = row.href.startsWith("http") || row.href.startsWith("mailto:")
            return (
              <a
                key={`mobile-${row.label}`}
                href={row.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="block font-mono font-medium uppercase tracking-[-0.02em] text-black/74 transition-colors hover:text-black"
                style={{ fontSize: `${Math.max(10, stageDial.link.fontSize)}px` }}
              >
                {row.label}
              </a>
            )
          })}
        </div>
      </div>

      <p className="mx-auto mt-5 max-w-[720px] font-mono text-[12px] font-medium uppercase tracking-[-0.02em] text-black/80 md:hidden">{description}</p>

      <div className="relative z-20 mt-[24px] md:absolute md:bottom-[-28px] md:left-1/2 md:mt-0 md:w-full md:-translate-x-1/2" style={{ maxWidth: `${stageDial.layout.timelineMaxWidth}px` }}>
        <TimelineRail projects={projects} activeIndex={activeIndex} onSelect={onSelect} />
      </div>
    </section>
  )
}

export function ToolsContent({ projects }: ToolsContentProps) {
  const modeDial = DEFAULT_MODE_DIAL

  const safeProjects = useMemo(() => projects.filter((project) => Boolean(project.id && project.name)), [projects])
  const [mode, setMode] = useState<ToolsMode>("journey")
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
      className="relative h-full overflow-hidden px-5 pb-6 md:px-6 md:pb-8"
      style={{ backgroundColor: "#f3f3f3" }}
    >
      <ToolsLogo />
      <TopModeToggle mode={mode} onChange={setMode} />

      <div className="relative mx-auto h-full w-full">
        <div
          className={`absolute inset-0 overflow-hidden transition-[opacity,transform] ${mode === "archive" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
          style={{ transitionDuration: `${modeDial.transition.modeSwitchMs}ms`, transitionTimingFunction: PROJECT_TRANSITION_EASE }}
        >
          <BlockView projects={safeProjects} activeIndex={normalizedActiveIndex} onSelect={startTransition} />
        </div>

        <div
          className={`absolute inset-0 overflow-visible transition-[opacity,transform] ${mode === "journey" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
          style={{ transitionDuration: `${modeDial.transition.modeSwitchMs}ms`, transitionTimingFunction: PROJECT_TRANSITION_EASE }}
        >
          <TimelineView
            activeProject={activeProject}
            previousProject={previousProject}
            previousNeighbor={previousNeighbor}
            nextNeighbor={nextNeighbor}
            isTransitionReady={isTransitionReady}
            onNavigateByWheel={(event) => {
              event.preventDefault()
              if (Math.abs(event.deltaY) < modeDial.transition.wheelThreshold) return

              const now = performance.now()
              if (now - lastWheelAtRef.current < modeDial.transition.wheelCooldown) return
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
              if (Math.abs(deltaX) < modeDial.transition.swipeThreshold) return
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
