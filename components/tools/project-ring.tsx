"use client"

import { useDialKit } from "dialkit"

import { PixelatedImage } from "@/components/ui/pixelated-image"
import { type CmsToolProject } from "@/lib/cms-types"

type ProjectRingProps = {
  projects: CmsToolProject[]
  activeIndex: number
  onSelect: (index: number) => void
}

type StripSlotConfig = {
  x: number
  y: number
  size: number
  scale: number
  opacity: number
}

const TRANSITION_EASE = "cubic-bezier(0.22,1,0.36,1)"

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
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

function CheckerPattern() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%, rgba(0,0,0,0.035)), linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%, rgba(0,0,0,0.035))",
        backgroundPosition: "0 0, 20px 20px",
        backgroundSize: "40px 40px",
      }}
    />
  )
}

function MiniFrame({ project, width, height }: { project: CmsToolProject; width: number; height: number }) {
  const previewUrl = project.demoUrl || project.highlightUrls[0] || ""
  const hasImage = previewUrl ? isImagePath(previewUrl) : false

  return (
    <div className="relative h-full w-full overflow-hidden rounded-none">
      {hasImage ? (
        <PixelatedImage src={previewUrl} alt={project.name} fill sizes={`${Math.max(width, height)}px`} className="object-cover" />
      ) : null}
      {!hasImage ? <CheckerPattern /> : null}
    </div>
  )
}

export function ProjectRing({ projects, activeIndex, onSelect }: ProjectRingProps) {
  const ringDial = useDialKit("Tools / Project Ring", {
    transitionMs: [564, 120, 1600],
    container: {
      top: [39, 0, 120],
      width: [338, 220, 620],
      height: [127, 80, 280],
    },
    tile: {
      radius: [0, 0, 20],
      borderAlpha: [0, 0, 1],
      fillGray: [200, 200, 255],
      fillAlpha: [1, 0.2, 1],
    },
    global: {
      width: [0.61, 0.25, 2.4],
      size: [0.51, 0.35, 2],
      spacing: [1.32, 0.5, 2.3],
      circle: [0.1, 0, 1],
      length: [2.2, 0.4, 2.2],
      visibleSlots: [5, 3, 11],
    },
    slots: {
      slotNeg2: { x: [-132, -220, 220], y: [-88, -120, 160], size: [42, 24, 140], scale: [0.84, 0.5, 1.4], opacity: [0.34, 0, 1] },
      slotNeg1: { x: [-77, -220, 220], y: [-34, -120, 160], size: [56, 24, 160], scale: [0.92, 0.5, 1.4], opacity: [0.64, 0, 1] },
      slot0: { x: [1, -220, 220], y: [10, -120, 160], size: [74, 24, 180], scale: [1.02, 0.5, 1.6], opacity: [1, 0, 1] },
      slot1: { x: [62, -220, 220], y: [-34, -120, 160], size: [56, 24, 160], scale: [0.92, 0.5, 1.4], opacity: [0.64, 0, 1] },
      slot2: { x: [104, -220, 220], y: [-88, -120, 160], size: [40, 24, 140], scale: [1.01, 0.5, 1.4], opacity: [0.64, 0, 1] },
    },
  })

  const buildSlotConfig = (distance: number, base: StripSlotConfig): StripSlotConfig => {
    const spacing = ringDial.global.spacing
    const widthScale = ringDial.global.width
    const circleMix = ringDial.global.circle
    const sizeScale = ringDial.global.size

    const angleStep = 36 * spacing
    const angleDeg = -90 + distance * angleStep
    const angleRad = (angleDeg * Math.PI) / 180
    const radiusX = 104 * widthScale
    const radiusY = 98 * spacing

    const circleX = Math.cos(angleRad) * radiusX
    const circleY = Math.sin(angleRad) * radiusY

    const scaledBaseX = base.x * widthScale * spacing
    const scaledBaseY = base.y * spacing

    return {
      x: scaledBaseX * (1 - circleMix) + circleX * circleMix,
      y: scaledBaseY * (1 - circleMix) + circleY * circleMix,
      size: Math.max(18, base.size * sizeScale),
      scale: base.scale,
      opacity: base.opacity,
    }
  }

  const getBaseSlot = (distance: number): StripSlotConfig => {
    const sign = Math.sign(distance) || 1
    const abs = Math.abs(distance)

    const slotNeg2: StripSlotConfig = { x: ringDial.slots.slotNeg2.x, y: ringDial.slots.slotNeg2.y, size: ringDial.slots.slotNeg2.size, scale: ringDial.slots.slotNeg2.scale, opacity: ringDial.slots.slotNeg2.opacity }
    const slotNeg1: StripSlotConfig = { x: ringDial.slots.slotNeg1.x, y: ringDial.slots.slotNeg1.y, size: ringDial.slots.slotNeg1.size, scale: ringDial.slots.slotNeg1.scale, opacity: ringDial.slots.slotNeg1.opacity }
    const slot0: StripSlotConfig = { x: ringDial.slots.slot0.x, y: ringDial.slots.slot0.y, size: ringDial.slots.slot0.size, scale: ringDial.slots.slot0.scale, opacity: ringDial.slots.slot0.opacity }
    const slot1: StripSlotConfig = { x: ringDial.slots.slot1.x, y: ringDial.slots.slot1.y, size: ringDial.slots.slot1.size, scale: ringDial.slots.slot1.scale, opacity: ringDial.slots.slot1.opacity }
    const slot2: StripSlotConfig = { x: ringDial.slots.slot2.x, y: ringDial.slots.slot2.y, size: ringDial.slots.slot2.size, scale: ringDial.slots.slot2.scale, opacity: ringDial.slots.slot2.opacity }

    if (distance === -2) return slotNeg2
    if (distance === -1) return slotNeg1
    if (distance === 0) return slot0
    if (distance === 1) return slot1
    if (distance === 2) return slot2

    const extra = Math.max(1, abs - 2)
    return {
      x: (Math.abs(slot2.x) + extra * 54) * sign,
      y: slot2.y - extra * 44,
      size: clamp(slot2.size - extra * 8, 18, 220),
      scale: clamp(slot2.scale - extra * 0.06, 0.5, 1.4),
      opacity: clamp(slot2.opacity - extra * 0.16, 0.08, 1),
    }
  }

  const visibleSlotsRaw = Math.max(3, Math.min(11, Math.round(ringDial.global.visibleSlots)))
  const visibleSlots = visibleSlotsRaw % 2 === 0 ? visibleSlotsRaw - 1 : visibleSlotsRaw
  const halfVisible = Math.floor(visibleSlots / 2)

  return (
    <section
      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
      style={{ top: `${ringDial.container.top}px`, width: `${ringDial.container.width}px`, height: `${ringDial.container.height}px` }}
    >
      {projects.map((project, index) => {
        const distance = getCircularDistance(index, activeIndex, projects.length)
        if (Math.abs(distance) > halfVisible) return null

        const roundedDistance = Math.round(distance)
        const slotConfig = buildSlotConfig(roundedDistance, getBaseSlot(roundedDistance))
        const tileWidth = Math.max(18, slotConfig.size * ringDial.global.length)
        const tileHeight = slotConfig.size

        return (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(index)}
            className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden transition-[opacity,transform,width,height,border-radius,background-color,border-color]"
            style={{
              opacity: slotConfig.opacity,
              width: `${tileWidth}px`,
              height: `${tileHeight}px`,
              transform: `translate3d(-50%, -50%, 0) translate3d(${slotConfig.x}px, ${slotConfig.y}px, 0) scale(${slotConfig.scale})`,
              transitionTimingFunction: TRANSITION_EASE,
              transitionDuration: `${ringDial.transitionMs}ms`,
              borderRadius: `${ringDial.tile.radius}px`,
              borderColor: `rgb(0 0 0 / ${ringDial.tile.borderAlpha})`,
              backgroundColor: `rgb(${ringDial.tile.fillGray} ${ringDial.tile.fillGray} ${ringDial.tile.fillGray} / ${ringDial.tile.fillAlpha})`,
              zIndex: 30 - Math.abs(roundedDistance),
            }}
            aria-label={`Open ${project.name}`}
          >
            <MiniFrame project={project} width={tileWidth} height={tileHeight} />
          </button>
        )
      })}
    </section>
  )
}
