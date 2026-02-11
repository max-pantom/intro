"use client"

import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_SIZE,
  type BlockType,
  type ZoneKey,
  canvasBlocks,
  zoneAnchors,
} from "@/lib/pantom-canvas-content"

type Theme = "light" | "dark"

type Point = {
  x: number
  y: number
}

type DragState = {
  startX: number
  startY: number
  originX: number
  originY: number
}

type BlockDragState = DragState & {
  id: string
}

const MIN_SCALE = 0.45
const MAX_SCALE = 1.9
const DEFAULT_SCALE = 0.82
const THEME_STORAGE_KEY = "pantom-canvas-theme"

const LIGHT_DOT_PATTERN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='1.2' cy='1.2' r='0.8' fill='%231f1a16' fill-opacity='0.25'/%3E%3C/svg%3E"
const DARK_DOT_PATTERN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='1.2' cy='1.2' r='0.8' fill='%23f0e7db' fill-opacity='0.22'/%3E%3C/svg%3E"

const typeOrder: BlockType[] = ["manifesto", "case", "service", "system", "note", "cta"]

const typeLabels: Record<BlockType, string> = {
  manifesto: "Manifesto",
  case: "Case",
  service: "Service",
  system: "System",
  note: "Note",
  cta: "CTA",
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  if (stored) return stored

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function blockTone(type: BlockType): string {
  switch (type) {
    case "manifesto":
      return "bg-[#f8f2e8] dark:bg-[#191511]"
    case "case":
      return "bg-[#efe8dd] dark:bg-[#201b15]"
    case "service":
      return "bg-[#e7ddcf] dark:bg-[#262017]"
    case "system":
      return "bg-[#f3ece0] dark:bg-[#1d1913]"
    case "note":
      return "bg-[#f1e8da] dark:bg-[#18140f]"
    case "cta":
      return "bg-[#1f1a16] text-[#f4efe9] dark:bg-[#f4efe9] dark:text-[#1a1714]"
    default:
      return "bg-[#f3ece0] dark:bg-[#1d1913]"
  }
}

type ToggleRowProps = {
  label: string
  value: boolean
  onChange: (next: boolean) => void
}

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.12em]">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`h-6 min-w-14 rounded-full border px-2 text-[10px] transition ${
          value
            ? "border-[#1f1a16] bg-[#1f1a16] text-[#f4efe9] dark:border-[#f4efe9] dark:bg-[#f4efe9] dark:text-[#1a1714]"
            : "border-[#1f1a16]/25 text-[#1f1a16]/70 dark:border-[#f4efe9]/30 dark:text-[#f4efe9]/80"
        }`}
      >
        {value ? "On" : "Off"}
      </button>
    </label>
  )
}

type RangeRowProps = {
  label: string
  min: number
  max: number
  step: number
  value: number
  suffix?: string
  onChange: (next: number) => void
}

function RangeRow({ label, min, max, step, value, suffix, onChange }: RangeRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em]">
        <span>{label}</span>
        <span className="font-mono text-[11px] tracking-normal">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#1f1a16]/20 accent-[#1f1a16] dark:bg-[#f4efe9]/20 dark:accent-[#f4efe9]"
      />
    </div>
  )
}

export function CanvasWorkspace() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const [theme, setTheme] = useState<Theme>(() => readInitialTheme())
  const [showControls, setShowControls] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showZoneLabels, setShowZoneLabels] = useState(true)
  const [enablePan, setEnablePan] = useState(true)
  const [enableWheelZoom, setEnableWheelZoom] = useState(true)
  const [enableAnimations, setEnableAnimations] = useState(true)
  const [showShadows, setShowShadows] = useState(true)
  const [enableBlockDrag, setEnableBlockDrag] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(false)

  const [fontScale, setFontScale] = useState(1)
  const [cardOpacity, setCardOpacity] = useState(0.95)
  const [cardRadius, setCardRadius] = useState(20)
  const [borderWeight, setBorderWeight] = useState(1)

  const [query, setQuery] = useState("")
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [offset, setOffset] = useState<Point>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 }
    return {
      x: window.innerWidth / 2 - zoneAnchors.work.x * DEFAULT_SCALE,
      y: window.innerHeight / 2 - zoneAnchors.work.y * DEFAULT_SCALE,
    }
  })
  const [viewport, setViewport] = useState({ width: 1, height: 1 })
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  const [zoneVisibility, setZoneVisibility] = useState<Record<ZoneKey, boolean>>({
    philosophy: true,
    work: true,
    services: true,
    contact: true,
  })

  const [typeVisibility, setTypeVisibility] = useState<Record<BlockType, boolean>>({
    manifesto: true,
    case: true,
    service: true,
    system: true,
    note: true,
    cta: true,
  })

  const [positions, setPositions] = useState<Record<string, Point>>(() =>
    Object.fromEntries(canvasBlocks.map((block) => [block.id, { x: block.x, y: block.y }]))
  )

  const panDragRef = useRef<DragState | null>(null)
  const blockDragRef = useRef<BlockDragState | null>(null)
  const blockMovedRef = useRef(false)

  const [isPanning, setIsPanning] = useState(false)
  const [isDraggingBlock, setIsDraggingBlock] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const updateViewport = () => {
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect) return
      setViewport({ width: rect.width, height: rect.height })
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  const offsetForPoint = useCallback(
    (point: Point, nextScale: number): Point => ({
      x: viewport.width / 2 - point.x * nextScale,
      y: viewport.height / 2 - point.y * nextScale,
    }),
    [viewport.height, viewport.width]
  )

  const jumpToZone = useCallback(
    (zone: ZoneKey) => {
      const anchor = zoneAnchors[zone]
      setOffset(offsetForPoint({ x: anchor.x, y: anchor.y }, scale))
    },
    [offsetForPoint, scale]
  )

  const resetView = useCallback(() => {
    setScale(DEFAULT_SCALE)
    setOffset(offsetForPoint({ x: zoneAnchors.work.x, y: zoneAnchors.work.y }, DEFAULT_SCALE))
  }, [offsetForPoint])

  const resetBlockPositions = () => {
    setPositions(Object.fromEntries(canvasBlocks.map((block) => [block.id, { x: block.x, y: block.y }])))
  }

  const zoomFromPoint = useCallback(
    (nextScale: number, pointerX: number, pointerY: number) => {
      const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
      const worldX = (pointerX - offset.x) / scale
      const worldY = (pointerY - offset.y) / scale

      setScale(clampedScale)
      setOffset({
        x: pointerX - worldX * clampedScale,
        y: pointerY - worldY * clampedScale,
      })
    },
    [offset.x, offset.y, scale]
  )

  const zoomByStep = useCallback(
    (delta: number) => {
      const centerX = viewport.width / 2
      const centerY = viewport.height / 2
      zoomFromPoint(scale + delta, centerX, centerY)
    },
    [scale, viewport.height, viewport.width, zoomFromPoint]
  )

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!enableWheelZoom) return
    event.preventDefault()

    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return

    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const wheelFactor = event.deltaY < 0 ? 1.09 : 0.92

    zoomFromPoint(scale * wheelFactor, pointerX, pointerY)
  }

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enablePan || event.button !== 0) return
    if (event.target !== event.currentTarget) return

    panDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }

    setIsPanning(true)
  }

  const handleBlockPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, blockId: string) => {
    if (!enableBlockDrag || event.button !== 0) return

    event.stopPropagation()
    const blockPosition = positions[blockId]
    if (!blockPosition) return

    blockDragRef.current = {
      id: blockId,
      startX: event.clientX,
      startY: event.clientY,
      originX: blockPosition.x,
      originY: blockPosition.y,
    }

    blockMovedRef.current = false
    setIsDraggingBlock(true)
  }

  const clearDragging = () => {
    panDragRef.current = null
    blockDragRef.current = null
    setIsPanning(false)
    setIsDraggingBlock(false)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const blockDrag = blockDragRef.current
    if (blockDrag) {
      event.preventDefault()
      const deltaX = (event.clientX - blockDrag.startX) / scale
      const deltaY = (event.clientY - blockDrag.startY) / scale

      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        blockMovedRef.current = true
      }

      let nextX = blockDrag.originX + deltaX
      let nextY = blockDrag.originY + deltaY

      if (snapToGrid) {
        nextX = Math.round(nextX / GRID_SIZE) * GRID_SIZE
        nextY = Math.round(nextY / GRID_SIZE) * GRID_SIZE
      }

      setPositions((prev) => ({
        ...prev,
        [blockDrag.id]: { x: nextX, y: nextY },
      }))
      return
    }

    const panDrag = panDragRef.current
    if (!panDrag || !enablePan) return

    event.preventDefault()
    setOffset({
      x: panDrag.originX + (event.clientX - panDrag.startX),
      y: panDrag.originY + (event.clientY - panDrag.startY),
    })
  }

  useEffect(() => {
    const handlePointerUp = () => {
      panDragRef.current = null
      blockDragRef.current = null
      setIsPanning(false)
      setIsDraggingBlock(false)
    }

    window.addEventListener("pointerup", handlePointerUp)
    return () => window.removeEventListener("pointerup", handlePointerUp)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const editable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable
      if (editable && event.key !== "Escape") return

      if (event.key === "/") {
        event.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if (event.key === "g") {
        event.preventDefault()
        setShowGrid((prev) => !prev)
        return
      }

      if (event.key === "m") {
        event.preventDefault()
        setShowMiniMap((prev) => !prev)
        return
      }

      if (event.key === "0") {
        event.preventDefault()
        resetView()
        return
      }

      if (event.key === "1") {
        event.preventDefault()
        jumpToZone("philosophy")
        return
      }

      if (event.key === "2") {
        event.preventDefault()
        jumpToZone("work")
        return
      }

      if (event.key === "3") {
        event.preventDefault()
        jumpToZone("services")
        return
      }

      if (event.key === "4") {
        event.preventDefault()
        jumpToZone("contact")
        return
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        zoomByStep(0.08)
        return
      }

      if (event.key === "-") {
        event.preventDefault()
        zoomByStep(-0.08)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [jumpToZone, resetView, zoomByStep])

  const visibleBlocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return canvasBlocks.filter((block) => {
      if (!zoneVisibility[block.zone]) return false
      if (!typeVisibility[block.type]) return false

      if (!normalizedQuery) return true
      const haystack = `${block.title} ${block.body} ${block.detail}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [query, typeVisibility, zoneVisibility])

  const activeBlock = useMemo(
    () => canvasBlocks.find((block) => block.id === activeBlockId) ?? null,
    [activeBlockId]
  )

  const miniMap = {
    width: 220,
    height: 140,
    xScale: 220 / CANVAS_WIDTH,
    yScale: 140 / CANVAS_HEIGHT,
  }

  const viewBounds = {
    x: clamp(-offset.x / scale, 0, CANVAS_WIDTH),
    y: clamp(-offset.y / scale, 0, CANVAS_HEIGHT),
    width: clamp(viewport.width / scale, 0, CANVAS_WIDTH),
    height: clamp(viewport.height / scale, 0, CANVAS_HEIGHT),
  }

  const canvasCursor = isDraggingBlock ? "cursor-grabbing" : isPanning ? "cursor-grabbing" : "cursor-grab"

  return (
    <main
      className="relative h-dvh w-full overflow-hidden bg-[#f6f5f2] text-[#0e0e0e] transition-colors duration-300 dark:bg-[#0f0e0d] dark:text-[#ece7df]"
      style={{ fontSize: `${fontScale}rem` }}
    >
      <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-7rem)] flex-wrap items-center gap-2 rounded-2xl border border-[#0e0e0e]/20 bg-[#f6f5f2]/95 px-3 py-2 backdrop-blur-sm dark:border-[#ece7df]/20 dark:bg-[#0f0e0d]/95">
        <span className="text-sm uppercase tracking-[0.18em]">Pantom Canvas</span>
        {(Object.keys(zoneAnchors) as ZoneKey[]).map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => jumpToZone(zone)}
            className="rounded-full border border-[#0e0e0e]/20 px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition hover:-translate-y-0.5 hover:border-[#0e0e0e]/55 dark:border-[#ece7df]/20 dark:hover:border-[#ece7df]/55"
          >
            {zoneAnchors[zone].label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowControls((prev) => !prev)}
        className="absolute right-4 top-4 z-30 rounded-full border border-[#0e0e0e]/30 bg-[#f6f5f2]/95 px-4 py-2 text-xs uppercase tracking-[0.14em] backdrop-blur-sm transition hover:-translate-y-0.5 dark:border-[#ece7df]/30 dark:bg-[#0f0e0d]/95"
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      <div
        ref={viewportRef}
        className={`relative h-full w-full touch-none ${canvasCursor}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={clearDragging}
        onWheel={handleWheel}
      >
        {showGrid ? (
          <>
            <div
              aria-hidden
              className="absolute inset-0 dark:hidden"
              style={{
                backgroundImage: `url("${LIGHT_DOT_PATTERN}")`,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 hidden dark:block"
              style={{
                backgroundImage: `url("${DARK_DOT_PATTERN}")`,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              }}
            />
          </>
        ) : null}

        <div
          className="absolute left-0 top-0"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition:
              enableAnimations && !isPanning && !isDraggingBlock
                ? "transform 180ms ease"
                : "none",
          }}
        >
          {showZoneLabels ? (
            <>
              {(Object.keys(zoneAnchors) as ZoneKey[]).map((zone) => (
                <div
                  key={`zone-${zone}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.24em] text-[#0e0e0e]/55 dark:text-[#ece7df]/65"
                  style={{ left: zoneAnchors[zone].x, top: zoneAnchors[zone].y - 130 }}
                >
                  {zoneAnchors[zone].label}
                </div>
              ))}
            </>
          ) : null}

          {visibleBlocks.map((block) => {
            const point = positions[block.id] ?? { x: block.x, y: block.y }
            const isActive = activeBlockId === block.id

            return (
              <button
                key={block.id}
                type="button"
                onPointerDown={(event) => handleBlockPointerDown(event, block.id)}
                onClick={() => {
                  if (blockMovedRef.current) {
                    blockMovedRef.current = false
                    return
                  }
                  setActiveBlockId(block.id)
                }}
                className={`absolute space-y-3 border text-left transition ${blockTone(block.type)} ${
                  enableAnimations ? "duration-200" : "duration-0"
                } ${showShadows ? "shadow-[0_14px_30px_-18px_rgba(0,0,0,0.42)]" : "shadow-none"} ${
                  isActive ? "ring-2 ring-[#0e0e0e]/35 dark:ring-[#ece7df]/35" : ""
                }`}
                style={{
                  left: point.x,
                  top: point.y,
                  width: block.w,
                  minHeight: block.h,
                  borderRadius: cardRadius,
                  borderWidth: borderWeight,
                  borderColor: "rgb(14 14 14 / 0.18)",
                  opacity: cardOpacity,
                  padding: "16px 18px",
                  cursor: enableBlockDrag ? "grab" : "pointer",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.17em] opacity-70">{typeLabels[block.type]}</p>
                <h3 className="text-xl leading-tight font-semibold">{block.title}</h3>
                <p className="text-sm leading-relaxed opacity-85">{block.body}</p>
                <p className="text-xs uppercase tracking-[0.14em] opacity-70">Click to expand</p>
              </button>
            )
          })}
        </div>
      </div>

      {showMiniMap ? (
        <aside className="absolute bottom-4 left-4 z-20 rounded-2xl border border-[#0e0e0e]/20 bg-[#f6f5f2]/95 p-3 text-xs backdrop-blur-sm dark:border-[#ece7df]/20 dark:bg-[#0f0e0d]/95">
          <p className="mb-2 uppercase tracking-[0.14em]">Map</p>
          <div className="relative overflow-hidden rounded-lg border border-[#0e0e0e]/20 dark:border-[#ece7df]/20" style={{ width: miniMap.width, height: miniMap.height }}>
            {visibleBlocks.map((block) => {
              const point = positions[block.id] ?? { x: block.x, y: block.y }
              return (
                <span
                  key={`mini-${block.id}`}
                  className="absolute rounded-[2px] bg-[#0e0e0e]/45 dark:bg-[#ece7df]/55"
                  style={{
                    left: point.x * miniMap.xScale,
                    top: point.y * miniMap.yScale,
                    width: Math.max(2, block.w * miniMap.xScale),
                    height: Math.max(2, block.h * miniMap.yScale),
                  }}
                />
              )
            })}
            <span
              className="pointer-events-none absolute border border-[#0e0e0e] dark:border-[#ece7df]"
              style={{
                left: viewBounds.x * miniMap.xScale,
                top: viewBounds.y * miniMap.yScale,
                width: viewBounds.width * miniMap.xScale,
                height: viewBounds.height * miniMap.yScale,
              }}
            />
          </div>
        </aside>
      ) : null}

      {showControls ? (
        <aside className="control-panel-scroll absolute right-4 top-16 z-20 max-h-[calc(100dvh-5.5rem)] w-[340px] overflow-y-auto rounded-2xl border border-[#0e0e0e]/25 bg-[#f6f5f2]/96 p-4 backdrop-blur-sm dark:border-[#ece7df]/25 dark:bg-[#0f0e0d]/96">
          <div className="space-y-4">
            <section className="space-y-2 border-b border-[#0e0e0e]/15 pb-4 dark:border-[#ece7df]/15">
              <p className="text-xs uppercase tracking-[0.15em]">Global</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                    theme === "light"
                      ? "border-[#0e0e0e] bg-[#0e0e0e] text-[#f6f5f2]"
                      : "border-[#0e0e0e]/20"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                    theme === "dark"
                      ? "border-[#ece7df] bg-[#ece7df] text-[#0f0e0d]"
                      : "border-[#ece7df]/30 dark:border-[#ece7df]/20"
                  }`}
                >
                  Dark
                </button>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="canvas-search" className="text-xs uppercase tracking-[0.12em]">
                  Search blocks
                </label>
                <input
                  id="canvas-search"
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Case, service, note..."
                  className="w-full rounded-lg border border-[#0e0e0e]/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#0e0e0e]/45 focus:border-[#0e0e0e]/50 dark:border-[#ece7df]/20 dark:placeholder:text-[#ece7df]/40 dark:focus:border-[#ece7df]/50"
                />
              </div>
            </section>

            <section className="space-y-3 border-b border-[#0e0e0e]/15 pb-4 dark:border-[#ece7df]/15">
              <p className="text-xs uppercase tracking-[0.15em]">Canvas</p>
              <RangeRow label="Zoom" min={MIN_SCALE} max={MAX_SCALE} step={0.01} value={scale} onChange={setScale} />
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => zoomByStep(-0.08)} className="rounded-lg border border-[#0e0e0e]/20 py-1.5 text-xs uppercase tracking-[0.12em]">
                  -
                </button>
                <button type="button" onClick={() => zoomByStep(0.08)} className="rounded-lg border border-[#0e0e0e]/20 py-1.5 text-xs uppercase tracking-[0.12em]">
                  +
                </button>
                <button type="button" onClick={resetView} className="rounded-lg border border-[#0e0e0e]/20 py-1.5 text-xs uppercase tracking-[0.12em]">
                  Reset
                </button>
              </div>
              <ToggleRow label="Pan" value={enablePan} onChange={setEnablePan} />
              <ToggleRow label="Wheel Zoom" value={enableWheelZoom} onChange={setEnableWheelZoom} />
              <ToggleRow label="Grid" value={showGrid} onChange={setShowGrid} />
              <ToggleRow label="Zone Labels" value={showZoneLabels} onChange={setShowZoneLabels} />
              <ToggleRow label="Mini-map" value={showMiniMap} onChange={setShowMiniMap} />
            </section>

            <section className="space-y-3 border-b border-[#0e0e0e]/15 pb-4 dark:border-[#ece7df]/15">
              <p className="text-xs uppercase tracking-[0.15em]">Cards</p>
              <RangeRow label="Font Scale" min={0.85} max={1.25} step={0.01} value={fontScale} onChange={setFontScale} />
              <RangeRow label="Opacity" min={0.6} max={1} step={0.01} value={cardOpacity} onChange={setCardOpacity} />
              <RangeRow label="Radius" min={0} max={32} step={1} value={cardRadius} suffix="px" onChange={setCardRadius} />
              <RangeRow label="Border" min={1} max={3} step={1} value={borderWeight} suffix="px" onChange={setBorderWeight} />
              <ToggleRow label="Shadows" value={showShadows} onChange={setShowShadows} />
              <ToggleRow label="Animations" value={enableAnimations} onChange={setEnableAnimations} />
              <ToggleRow label="Draggable" value={enableBlockDrag} onChange={setEnableBlockDrag} />
              <ToggleRow label="Snap To Grid" value={snapToGrid} onChange={setSnapToGrid} />
              <button
                type="button"
                onClick={resetBlockPositions}
                className="w-full rounded-lg border border-[#0e0e0e]/20 py-1.5 text-xs uppercase tracking-[0.12em]"
              >
                Reset Block Positions
              </button>
            </section>

            <section className="space-y-3 border-b border-[#0e0e0e]/15 pb-4 dark:border-[#ece7df]/15">
              <p className="text-xs uppercase tracking-[0.15em]">Zones</p>
              {(Object.keys(zoneAnchors) as ZoneKey[]).map((zone) => (
                <ToggleRow
                  key={zone}
                  label={zoneAnchors[zone].label}
                  value={zoneVisibility[zone]}
                  onChange={(next) => setZoneVisibility((prev) => ({ ...prev, [zone]: next }))}
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  setZoneVisibility({ philosophy: true, work: true, services: true, contact: true })
                }
                className="w-full rounded-lg border border-[#0e0e0e]/20 py-1.5 text-xs uppercase tracking-[0.12em]"
              >
                Show All Zones
              </button>
            </section>

            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.15em]">Block Types</p>
              {typeOrder.map((type) => (
                <ToggleRow
                  key={type}
                  label={typeLabels[type]}
                  value={typeVisibility[type]}
                  onChange={(next) => setTypeVisibility((prev) => ({ ...prev, [type]: next }))}
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  setTypeVisibility({
                    manifesto: true,
                    case: true,
                    service: true,
                    system: true,
                    note: true,
                    cta: true,
                  })
                }
                className="w-full rounded-lg border border-[#0e0e0e]/20 py-1.5 text-xs uppercase tracking-[0.12em]"
              >
                Show All Types
              </button>
              <div className="rounded-lg border border-[#0e0e0e]/15 p-2 text-[10px] uppercase tracking-[0.12em] text-[#0e0e0e]/70 dark:border-[#ece7df]/20 dark:text-[#ece7df]/70">
                Shortcuts: / search, 1-4 jump, +/- zoom, 0 reset, g grid, m map
              </div>
            </section>
          </div>
        </aside>
      ) : null}

      {activeBlock ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0e0e0e]/45 p-5" onClick={() => setActiveBlockId(null)}>
          <article
            className="max-h-[85dvh] w-full max-w-2xl overflow-auto rounded-2xl border border-[#0e0e0e]/20 bg-[#f6f5f2] p-6 text-[#0e0e0e] dark:border-[#ece7df]/20 dark:bg-[#0f0e0d] dark:text-[#ece7df]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-[0.16em] opacity-70">{typeLabels[activeBlock.type]}</p>
            <h2 className="mt-2 text-3xl leading-tight font-semibold">{activeBlock.title}</h2>
            <p className="mt-4 text-base leading-relaxed opacity-90">{activeBlock.body}</p>
            <p className="mt-3 text-sm leading-relaxed opacity-80">{activeBlock.detail}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => jumpToZone(activeBlock.zone)}
                className="rounded-full border border-[#0e0e0e]/25 px-4 py-1.5 text-xs uppercase tracking-[0.12em] dark:border-[#ece7df]/25"
              >
                Jump to {zoneAnchors[activeBlock.zone].label}
              </button>
              <button
                type="button"
                onClick={() => setActiveBlockId(null)}
                className="rounded-full border border-[#0e0e0e]/25 px-4 py-1.5 text-xs uppercase tracking-[0.12em] dark:border-[#ece7df]/25"
              >
                Close
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </main>
  )
}
