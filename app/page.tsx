"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const faceOrder = ["front", "right", "left", "top", "back", "bottom"] as const
type FaceKey = (typeof faceOrder)[number]

type FaceConfig = {
  width: number
  length: number
  depth: number
  radius: number
  opacity: number
  tint: number
}

const baseConfig: FaceConfig = {
  width: 192,
  length: 192,
  depth: 192,
  radius: 12,
  opacity: 0.85,
  tint: 1,
}

const palette: Record<FaceKey, { rgb: string; alpha: number }> = {
  front: { rgb: "226 236 248", alpha: 0.9 },
  right: { rgb: "204 225 243", alpha: 0.85 },
  left: { rgb: "198 221 240", alpha: 0.82 },
  top: { rgb: "226 236 248", alpha: 0.9 },
  back: { rgb: "170 194 215", alpha: 0.6 },
  bottom: { rgb: "24 34 48", alpha: 0.35 },
}

// Card image sources: current files in /public/cards (numeric + uploaded names).
const cardImagePaths: string[] = [
  "/cards/1.png",
  "/cards/2.png",
  "/cards/3.png",
  "/cards/4.png",
  "/cards/5.png",
  "/cards/6.png",
  "/cards/7.png",
  "/cards/8.png",
  "/cards/9.png",
  "/cards/10.png",
  "/cards/11.png",
  "/cards/12.png",
  "/cards/13.avif",
  "/cards/FnbiWpn0U7CDPorhTKEX9zmJz8.avif",
  "/cards/Iu66Hu8TqtgWdedJIHLKT1UW0.avif",
  "/cards/O1YgQ1UEX6KcLg34IhvEbkSkjaE.avif",
  "/cards/cWzA1jESstJiBGkTXK5mTFCiZQ4.avif",
  "/cards/ikK6W2dDkTzHARb7AmyoumJZugc.avif",
  "/cards/iPt4Uch08YrxpHbs6CkVav5UAcM.avif",
  "/cards/jqag62VEzIxYDaZl0t9XLUglyrY.avif",
  "/cards/uacWL8dvYlcWRXVLfL2AAOUvMI0.avif",
]

function getFaceDimensions(face: FaceKey, cfg: FaceConfig): { w: number; h: number } {
  const d = cfg.depth * 2
  switch (face) {
    case "front":
    case "back":
      return { w: cfg.width, h: cfg.length }
    case "right":
    case "left":
      return { w: d, h: cfg.length }
    case "top":
    case "bottom":
      return { w: cfg.width, h: d }
    default:
      return { w: cfg.width, h: cfg.length }
  }
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

function shuffleArray<T>(items: T[], seed: number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function scrollShuffleOffset(
  cardIndex: number,
  phase: number,
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number; zMin: number; zMax: number }
): { x: number; y: number; z: number } {
  const s1 = seededRandom(cardIndex * 7919 + phase * 7907)
  const s2 = seededRandom(cardIndex * 7907 + phase * 7919)
  const s3 = seededRandom(cardIndex * 7883 + phase * 7877)
  return {
    x: bounds.xMin + s1 * (bounds.xMax - bounds.xMin),
    y: bounds.yMin + s2 * (bounds.yMax - bounds.yMin),
    z: bounds.zMin + s3 * (bounds.zMax - bounds.zMin),
  }
}

function getFaceTransform(face: FaceKey, cfg: FaceConfig): string {
  const { depth, width, length } = cfg
  const halfW = width / 2
  const halfL = length / 2
  switch (face) {
    case "front":
      return `translateZ(${depth}px)`
    case "right":
      return `translateX(${halfW}px) rotateY(90deg)`
    case "left":
      return `translateX(-${halfW}px) rotateY(-90deg)`
    case "top":
      return `translateY(-${halfL}px) rotateX(90deg)`
    case "back":
      return `translateZ(-${depth}px) rotateY(180deg)`
    case "bottom":
      return `translateY(${halfL}px) rotateX(-90deg)`
    default:
      return ""
  }
}

export default function Page() {
  const [controlsOpen, setControlsOpen] = useState(true)
  const [linkAll, setLinkAll] = useState(true)
  const [globalConfig, setGlobalConfig] = useState<FaceConfig>(baseConfig)
  const [faces, setFaces] = useState<Record<FaceKey, FaceConfig>>(() =>
    faceOrder.reduce(
      (acc, face) => ({ ...acc, [face]: { ...baseConfig } }),
      {} as Record<FaceKey, FaceConfig>
    )
  )
  const [tilt, setTilt] = useState({ x: -34, y: 120 })
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
  const [cardCount, setCardCount] = useState(3)
  const [cardGap, setCardGap] = useState(24)
  const [facesVisible, setFacesVisible] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [cardHoverAxis, setCardHoverAxis] = useState<"x" | "y" | "z">("y")
  const [cardHoverAmount, setCardHoverAmount] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const [scrollSensitivity, setScrollSensitivity] = useState(0.5)
  const [randomCardColors, setRandomCardColors] = useState(false)
  const [imageDeckSeed] = useState(() => Math.floor(Math.random() * 100000))
  const [cardImagesDeck, setCardImagesDeck] = useState<string[]>(cardImagePaths)
  const [pinnedCardsMode, setPinnedCardsMode] = useState(false)
  const [pinnedCardsData, setPinnedCardsData] = useState<{
    positions: { x: number; y: number; z: number }[]
    sizes: number[]
  } | null>(null)
  const [scrollShuffleMode, setScrollShuffleMode] = useState(false)
  const [totalScrollDistance, setTotalScrollDistance] = useState(0)
  const [darkMode, setDarkMode] = useState(true)
  const [matrixMode, setMatrixMode] = useState(false)
  const [matrixDepth, setMatrixDepth] = useState(0)

  useEffect(() => {
    // Shuffle client-side only to avoid SSR/client mismatches.
    setCardImagesDeck(shuffleArray(cardImagePaths, imageDeckSeed))
  }, [imageDeckSeed])

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [darkMode])

  const activeConfig = (face: FaceKey) => (linkAll ? globalConfig : faces[face])

  const generatePinnedCards = useCallback(() => {
    const depth = globalConfig.depth
    const width = globalConfig.width
    const length = globalConfig.length
    const inset = 12
    const zMin = -depth + inset
    const zMax = depth - inset
    const xMin = -width / 2 + inset
    const xMax = width / 2 - inset
    const yMin = -length / 2 + inset
    const yMax = length / 2 - inset
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    setPinnedCardsData({
      positions: [
        { x: rand(xMin, xMax), y: rand(yMin, yMax), z: rand(zMin, zMax) },
        { x: rand(xMin, xMax), y: rand(yMin, yMax), z: rand(zMin, zMax) },
        { x: rand(xMin, xMax), y: rand(yMin, yMax), z: rand(zMin, zMax) },
      ],
      sizes: [56, 88, 120],
    })
  }, [globalConfig.depth, globalConfig.width, globalConfig.length])

  const frameSize = useMemo(() => {
    const w = linkAll ? globalConfig.width : Math.max(...faceOrder.map((f) => faces[f].width))
    const l = linkAll ? globalConfig.length : Math.max(...faceOrder.map((f) => faces[f].length))
    const d = linkAll ? globalConfig.depth : Math.max(...faceOrder.map((f) => faces[f].depth))
    return Math.max(w, l, d * 2) + 80
  }, [linkAll, globalConfig, faces])

  const handleGlobal = (key: keyof FaceConfig, value: number) => {
    setGlobalConfig((prev) => ({ ...prev, [key]: value }))
    if (linkAll) {
      setFaces((prev) =>
        faceOrder.reduce(
          (acc, face) => ({ ...acc, [face]: { ...prev[face], [key]: value } }),
          {} as Record<FaceKey, FaceConfig>
        )
      )
    }
  }

  const handleFace = (face: FaceKey, key: keyof FaceConfig, value: number) => {
    if (linkAll) {
      handleGlobal(key, value)
      return
    }
    setFaces((prev) => ({
      ...prev,
      [face]: { ...prev[face], [key]: value },
    }))
  }

  const syncAllFromFace = (face: FaceKey) => {
    const next = faces[face]
    setGlobalConfig(next)
    setFaces(() =>
      faceOrder.reduce(
        (acc, name) => ({ ...acc, [name]: { ...next } }),
        {} as Record<FaceKey, FaceConfig>
      )
    )
    setLinkAll(true)
  }

  const resetAll = () => {
    setGlobalConfig(baseConfig)
    setFaces(() =>
      faceOrder.reduce(
        (acc, name) => ({ ...acc, [name]: { ...baseConfig } }),
        {} as Record<FaceKey, FaceConfig>
      )
    )
    setTilt({ x: -34, y: 120 })
    setPosition({ x: 0, y: 0, z: 0 })
    setCardCount(3)
    setCardGap(24)
    setFacesVisible(true)
    setScrollOffset(0)
    setTotalScrollDistance(0)
    setScrollShuffleMode(false)
    setMatrixMode(false)
    setMatrixDepth(0)
    setLinkAll(true)
  }

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (pinnedCardsMode) return
      if (!scrollEnabled || cardCount === 0) return
      e.preventDefault()
      const depth = globalConfig.depth
      const inset = 8
      const zMin = -depth + inset
      const zMax = depth - inset
      const span = zMax - zMin
      const delta = -e.deltaY * scrollSensitivity
      if (scrollShuffleMode) {
        setTotalScrollDistance((d) => d + Math.abs(delta))
      }
      if (matrixMode) {
        setMatrixDepth((prev) => {
          const next = prev + delta
          return Math.max(Math.min(next, span * 2), -span * 2)
        })
      }
      setScrollOffset((prev) => {
        const next = prev + delta
        return ((next % span) + span) % span
      })
    },
    [pinnedCardsMode, scrollEnabled, scrollShuffleMode, matrixMode, scrollSensitivity, cardCount, globalConfig.depth]
  )

  const shufflePhase = useMemo(
    () => Math.floor(((scrollShuffleMode ? totalScrollDistance : Math.abs(matrixDepth)) + 1) / 400),
    [scrollShuffleMode, totalScrollDistance, matrixDepth]
  )

  const cardLayouts = useMemo(() => {
    const cfg = globalConfig
    const w = Math.max(1, cfg.width - 8)
    const h = Math.max(1, cfg.length - 8)
    const depth = cfg.depth
    const inset = 8
    const zMin = -depth + inset
    const zMax = depth - inset
    const span = Math.max(1, zMax - zMin)
    const period = span
    const wrap = (v: number) => zMin + (((v - zMin) % period) + period) % period
    const halfFrame = frameSize / 2
    const shuffleBounds = {
      xMin: -halfFrame + inset,
      xMax: halfFrame - inset,
      yMin: -halfFrame + inset,
      yMax: halfFrame - inset,
      zMin,
      zMax,
    }
    const scrollPerCard = 80
    const isCardActivated = (i: number) => (scrollShuffleMode ? totalScrollDistance > i * scrollPerCard : true)

    const layouts: Array<{
      x: number
      y: number
      z: number
      w: number
      h: number
      index: number
      fill: string
      imageSrc: string | null
    }> = []

    if (pinnedCardsMode && pinnedCardsData) {
      pinnedCardsData.positions.forEach((pos, i) => {
        const colors = palette.front
        const size = pinnedCardsData.sizes[i] ?? 80
        const cardFill = randomCardColors
          ? `hsla(${(i * 137.5) % 360}, 55%, 75%, ${0.85 * cfg.opacity})`
          : `rgb(${colors.rgb} / ${(colors.alpha * cfg.opacity * cfg.tint * 0.85).toFixed(2)})`
        const imageSrc = cardImagesDeck.length ? cardImagesDeck[(i + shufflePhase) % cardImagesDeck.length] : null

        layouts.push({
          x: pos.x,
          y: pos.y,
          z: pos.z,
          w: size,
          h: size,
          index: i,
          fill: cardFill,
          imageSrc,
        })
      })
    } else if (cardCount > 0) {
      let positions: number[] = []
      if (cardCount === 1) positions = [0]
      else {
        const maxGap = span / (cardCount - 1)
        const effectiveGap = Math.min(cardGap, maxGap)
        const totalSpan = (cardCount - 1) * effectiveGap
        const start = -totalSpan / 2
        for (let i = 0; i < cardCount; i++) positions.push(start + i * effectiveGap)
      }

      const colors = palette.front
      positions.forEach((z, i) => {
        const baseZ = wrap(z + scrollOffset)
        const hasImages = cardImagesDeck.length > 0
        const imageSrc = hasImages ? cardImagesDeck[(i + shufflePhase) % cardImagesDeck.length] : null

        const shuffleActive = scrollShuffleMode || matrixMode
        const activated = shuffleActive && (scrollShuffleMode ? isCardActivated(i) : true)
        const rand = activated ? scrollShuffleOffset(i, shufflePhase, shuffleBounds) : null
        const ax = rand ? rand.x : 0
        const ay = rand ? rand.y : 0
        const az = rand ? rand.z : baseZ

        const cardFill = randomCardColors
          ? `hsla(${(i * 137.5) % 360}, 55%, 75%, ${0.85 * cfg.opacity})`
          : `rgb(${colors.rgb} / ${(colors.alpha * cfg.opacity * cfg.tint * 0.85).toFixed(2)})`

        layouts.push({
          x: ax,
          y: ay,
          z: az,
          w,
          h,
          index: i,
          fill: cardFill,
          imageSrc,
        })
      })
    }

    layouts.sort((a, b) => a.z - b.z)
    return layouts
  }, [
    cardCount,
    cardGap,
    cardImagesDeck,
    frameSize,
    globalConfig,
    matrixDepth,
    matrixMode,
    pinnedCardsData,
    pinnedCardsMode,
    randomCardColors,
    scrollOffset,
    scrollShuffleMode,
    shufflePhase,
    totalScrollDistance,
  ])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden" onWheel={onWheel}>
        <div
          className="relative shrink-0"
          style={{ perspective: 900, width: `${frameSize}px`, height: `${frameSize}px` }}
        >
          <div
            className="absolute left-1/2 top-1/2 transition-transform duration-500 ease-out [transform-style:preserve-3d]"
            style={{
              transform: `translate3d(-50%, -50%, 0) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translate3d(${position.x}px, ${position.y}px, ${
                position.z + 12 + (matrixMode ? matrixDepth : 0)
              }px)`,
            }}
          >
            {facesVisible &&
              faceOrder.map((face) => {
                const cfg = activeConfig(face)
                const colors = palette[face]
                const fill = `rgb(${colors.rgb} / ${(colors.alpha * cfg.opacity * cfg.tint).toFixed(2)})`
                const border = `rgb(0 0 0 / ${(0.08 + 0.12 * cfg.opacity).toFixed(2)})`
                const { w, h } = getFaceDimensions(face, cfg)

                return (
                  <div
                    key={face}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: `${w}px`,
                      height: `${h}px`,
                      marginLeft: `${-w / 2}px`,
                      marginTop: `${-h / 2}px`,
                      borderRadius: `${cfg.radius}px`,
                      background: `linear-gradient(150deg, ${fill}, rgb(${colors.rgb} / ${(colors.alpha * cfg.tint * 0.85).toFixed(2)}))`,
                      border: `1px solid ${border}`,
                      transform: getFaceTransform(face, cfg),
                      transformStyle: "preserve-3d",
                    }}
                  />
                )
              })}

            {cardLayouts.map((card) => {
              const isHovered = hoveredCard === card.index
              const axis = cardHoverAxis
              const amount = isHovered ? cardHoverAmount : 0
              const hoverX = axis === "x" ? amount : 0
              const hoverY = axis === "y" ? -amount : 0
              const hoverZ = axis === "z" ? amount : 0
                const shadow = "none"

              return (
                <div
                  key={`card-${card.index}`}
                    className="absolute left-1/2 top-1/2 cursor-pointer [transform-style:preserve-3d]"
                    style={{
                      width: `${card.w}px`,
                      height: `${card.h}px`,
                      marginLeft: `${-card.w / 2}px`,
                      marginTop: `${-card.h / 2}px`,
                      transform: `translate3d(${card.x + hoverX}px, ${card.y + hoverY}px, ${
                        card.z + hoverZ + (matrixMode ? matrixDepth : 0)
                      }px)`,
                      transformStyle: "preserve-3d",
                    willChange: "transform",
                    transition: "transform 120ms ease",
                    }}
                    onMouseEnter={() => setHoveredCard(card.index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                  <div
                    className="h-full w-full overflow-hidden rounded-lg border border-black/25 bg-cover bg-center"
                    style={{
                      background: card.imageSrc ? undefined : card.fill,
                      boxShadow: shadow,
                    }}
                  >
                    {card.imageSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.imageSrc}
                        alt=""
                        className="h-full w-full object-cover select-none pointer-events-none"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Button
        size="sm"
        className="absolute right-4 top-4 z-10 border-[#0530a0] bg-[#0742c7] text-white opacity-90 hover:bg-[#0d4ed9] hover:opacity-100"
        onClick={() => setControlsOpen((v) => !v)}
      >
        {controlsOpen ? "Hide controls" : "Show controls"}
      </Button>

      <div className="absolute left-4 bottom-4 z-10 flex gap-2">
        <Button
          size="sm"
          className={`h-7 px-3 text-[10px] ${
            scrollShuffleMode
              ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]"
              : "border-[#0530a0] bg-[#0530a0]/40 text-white hover:bg-[#0530a0]/70"
          }`}
          onClick={() => {
            setScrollShuffleMode((prev) => {
              const next = !prev
              if (!next) setTotalScrollDistance(0)
              return next
            })
          }}
        >
          Shuffle
        </Button>
        <Button
          size="sm"
          className={`h-7 px-3 text-[10px] ${
            matrixMode
              ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]"
              : "border-[#0530a0] bg-[#0530a0]/40 text-white hover:bg-[#0530a0]/70"
          }`}
          onClick={() => {
            setMatrixMode((prev) => {
              const next = !prev
              if (!next) setMatrixDepth(0)
              return next
            })
          }}
        >
          Matrix
        </Button>
      </div>

      {controlsOpen && (
        <div className="absolute right-4 top-14 z-10 max-h-[calc(100dvh-6rem)] w-[300px]">
          <Card className="border-2 border-[#0530a0] ring-2 ring-[#0530a0]/80 bg-[#062d94]/95 shadow-lg backdrop-blur-sm">
            <CardHeader className="space-y-1 border-b border-[#0530a0] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs font-medium text-white">Cube</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className={`h-5 text-[9px] ${linkAll ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]" : "border-[#0530a0] text-white hover:bg-[#0530a0]/50"}`}
                    onClick={() => {
                      if (linkAll) {
                        setFaces(() =>
                          faceOrder.reduce(
                            (acc, name) => ({ ...acc, [name]: { ...globalConfig } }),
                            {} as Record<FaceKey, FaceConfig>
                          )
                        )
                      }
                      setLinkAll((v) => !v)
                    }}
                  >
                    {linkAll ? "Linked" : "Per face"}
                  </Button>
                  <Button size="sm" className="h-5 text-[9px] border-[#0530a0] bg-transparent text-white hover:bg-[#0530a0]/50" onClick={resetAll}>
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    className="h-5 w-5 p-0 text-white hover:bg-[#0530a0]/50"
                    onClick={() => setControlsOpen(false)}
                    aria-label="Close controls"
                  >
                    ×
                  </Button>
                </div>
              </div>
              <CardDescription className="text-[9px] text-white/70">
                Width, length, depth, cards inside (count & gap), position, rotation 360°.
              </CardDescription>
            </CardHeader>
            <CardContent className="control-panel-scroll max-h-[calc(100dvh-14rem)] overflow-y-auto px-3 py-2">
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
                      Dark mode
                    </Label>
                    <span className="font-mono text-[11px] font-medium tabular-nums text-white">
                      {darkMode ? "On" : "Off"}
                    </span>
                  </div>
                  <Input
                    type="range"
                    min={0}
                    max={1}
                    step={1}
                    value={darkMode ? 1 : 0}
                    onChange={(event) => setDarkMode(event.target.value === "1")}
                    className="h-1.5 w-full cursor-pointer appearance-none border-0 bg-[#0530a0]/50 p-0 accent-[#0742c7] [&::-webkit-slider-thumb]:bg-[#0742c7]"
                  />
                </div>
                <RangeControl
                  label="Width"
                  value={globalConfig.width}
                  min={64}
                  max={1600}
                  step={1}
                  onChange={(v) => handleGlobal("width", v)}
                  suffix="px"
                />
                <RangeControl
                  label="Length"
                  value={globalConfig.length}
                  min={64}
                  max={1600}
                  step={1}
                  onChange={(v) => handleGlobal("length", v)}
                  suffix="px"
                />
                <RangeControl
                  label="Breadth (depth)"
                  value={globalConfig.depth}
                  min={32}
                  max={2000}
                  step={1}
                  onChange={(v) => handleGlobal("depth", v)}
                  suffix="px"
                />
                <RangeControl
                  label="Round"
                  value={globalConfig.radius}
                  min={0}
                  max={48}
                  step={1}
                  onChange={(v) => handleGlobal("radius", v)}
                  suffix="px"
                />
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
                    Cube faces
                  </Label>
                  <Button
                    size="sm"
                    className={`h-5 text-[9px] ${facesVisible ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]" : "border-[#0530a0] text-white hover:bg-[#0530a0]/50"}`}
                    onClick={() => setFacesVisible((v) => !v)}
                  >
                    {facesVisible ? "Visible" : "Hidden"}
                  </Button>
                </div>
                <RangeControl
                  label="Opacity"
                  value={globalConfig.opacity}
                  min={0.25}
                  max={1}
                  step={0.01}
                  onChange={(v) => handleGlobal("opacity", v)}
                />
                <RangeControl
                  label="Tint"
                  value={globalConfig.tint}
                  min={0.4}
                  max={1.3}
                  step={0.01}
                  onChange={(v) => handleGlobal("tint", v)}
                />
                <RangeControl
                  label="Cards (count)"
                  value={cardCount}
                  min={0}
                  max={100}
                  step={1}
                  onChange={setCardCount}
                />
                <RangeControl
                  label="Card gap"
                  value={cardGap}
                  min={4}
                  max={64}
                  step={1}
                  onChange={setCardGap}
                  suffix="px"
                />
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
                    Card hover
                  </Label>
                  <div className="flex gap-0.5">
                    {["x", "y", "z"].map((ax) => (
                      <Button
                        key={ax}
                        size="sm"
                        className={`h-5 w-6 text-[9px] ${cardHoverAxis === ax ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]" : "border-[#0530a0] bg-transparent text-white hover:bg-[#0530a0]/50"}`}
                        onClick={() => setCardHoverAxis(ax as "x" | "y" | "z")}
                      >
                        {ax.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                <RangeControl
                  label="Card hover (px)"
                  value={cardHoverAmount}
                  min={0}
                  max={48}
                  step={1}
                  onChange={setCardHoverAmount}
                  suffix="px"
                />
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
                    Random card colors
                  </Label>
                  <Button
                    size="sm"
                    className={`h-5 text-[9px] ${randomCardColors ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]" : "border-[#0530a0] bg-transparent text-white hover:bg-[#0530a0]/50"}`}
                    onClick={() => setRandomCardColors((v) => !v)}
                  >
                    {randomCardColors ? "On" : "Off"}
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
                    Pinned 3 cards
                  </Label>
                  <Button
                    size="sm"
                    className={`h-5 text-[9px] ${pinnedCardsMode ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]" : "border-[#0530a0] bg-transparent text-white hover:bg-[#0530a0]/50"}`}
                    onClick={() => {
                      if (!pinnedCardsMode) {
                        generatePinnedCards()
                        setPinnedCardsMode(true)
                      } else {
                        setPinnedCardsMode(false)
                      }
                    }}
                  >
                    {pinnedCardsMode ? "On" : "Off"}
                  </Button>
                </div>
                {pinnedCardsMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-full text-[9px] border-[#0530a0] text-white hover:bg-[#0530a0]/50"
                    onClick={generatePinnedCards}
                  >
                    Shuffle positions
                  </Button>
                )}
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
                    Scroll → cards
                  </Label>
                  <Button
                    size="sm"
                    className={`h-5 text-[9px] ${scrollEnabled ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]" : "border-[#0530a0] bg-transparent text-white hover:bg-[#0530a0]/50"}`}
                    onClick={() => setScrollEnabled((v) => !v)}
                  >
                    {scrollEnabled ? "On" : "Off"}
                  </Button>
                </div>
                <RangeControl
                  label="Scroll sensitivity"
                  value={scrollSensitivity}
                  min={0.1}
                  max={2}
                  step={0.1}
                  onChange={setScrollSensitivity}
                />
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
                    Scroll shuffle
                  </Label>
                  <Button
                    size="sm"
                    className={`h-5 text-[9px] ${scrollShuffleMode ? "bg-[#0742c7] text-white hover:bg-[#0d4ed9]" : "border-[#0530a0] bg-transparent text-white hover:bg-[#0530a0]/50"}`}
                    onClick={() => {
                      setScrollShuffleMode((prev) => {
                        const next = !prev
                        if (!next) setTotalScrollDistance(0)
                        return next
                      })
                    }}
                  >
                    {scrollShuffleMode ? "On" : "Off"}
                  </Button>
                </div>
                <RangeControl
                  label="Position X"
                  value={position.x}
                  min={-200}
                  max={200}
                  step={1}
                  onChange={(v) => setPosition((p) => ({ ...p, x: v }))}
                  suffix="px"
                />
                <RangeControl
                  label="Position Y"
                  value={position.y}
                  min={-200}
                  max={200}
                  step={1}
                  onChange={(v) => setPosition((p) => ({ ...p, y: v }))}
                  suffix="px"
                />
                <RangeControl
                  label="Position Z"
                  value={position.z}
                  min={-200}
                  max={200}
                  step={1}
                  onChange={(v) => setPosition((p) => ({ ...p, z: v }))}
                  suffix="px"
                />
                <RangeControl
                  label="Rotate X"
                  value={tilt.x}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(v) => setTilt((prev) => ({ ...prev, x: v }))}
                  suffix="°"
                />
                <RangeControl
                  label="Rotate Y"
                  value={tilt.y}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(v) => setTilt((prev) => ({ ...prev, y: v }))}
                  suffix="°"
                />
              </div>

              {!linkAll && (
                <div className="mt-3 space-y-2 border-t border-[#0530a0] pt-2">
                  {faceOrder.map((face) => {
                    const cfg = activeConfig(face)
                    return (
                      <div key={face} className="rounded border border-[#0530a0]/60 bg-[#0530a0]/20 p-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-medium uppercase tracking-wider text-white/80">{face}</span>
                          <Button size="sm" className="h-5 text-[9px] border-[#0530a0] bg-transparent text-white hover:bg-[#0530a0]/50" onClick={() => syncAllFromFace(face)}>
                            Apply all
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <RangeControl
                            label="W (px)"
                            value={cfg.width}
                            min={64}
                            max={1600}
                            step={1}
                            onChange={(v) => handleFace(face, "width", v)}
                            compact
                          />
                          <RangeControl
                            label="L (px)"
                            value={cfg.length}
                            min={64}
                            max={1600}
                            step={1}
                            onChange={(v) => handleFace(face, "length", v)}
                            compact
                          />
                          <RangeControl
                            label="D (px)"
                            value={cfg.depth}
                            min={32}
                            max={2000}
                            step={1}
                            onChange={(v) => handleFace(face, "depth", v)}
                            compact
                          />
                          <RangeControl
                            label="Opacity"
                            value={cfg.opacity}
                            min={0.25}
                            max={1}
                            step={0.01}
                            onChange={(v) => handleFace(face, "opacity", v)}
                            compact
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

type RangeProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  compact?: boolean
  suffix?: string
}

function RangeControl({ label, value, min, max, step, onChange, compact, suffix }: RangeProps) {
  const decimals = step < 1 ? 2 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[9px] font-medium uppercase tracking-wider text-white/90">
          {label}
        </Label>
        <span className="font-mono text-[11px] font-medium tabular-nums text-white">
          {value.toFixed(decimals)}{suffix ?? ""}
        </span>
      </div>
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`h-1.5 w-full cursor-pointer appearance-none border-0 bg-[#0530a0]/50 p-0 accent-[#0742c7] [&::-webkit-slider-thumb]:bg-[#0742c7] ${compact ? "h-1" : ""}`}
      />
    </div>
  )
}
