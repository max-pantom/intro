"use client"

import { useState } from "react"

const LIGHT_LEAK_PRESETS = [
  { id: "warm", rgb: [255, 210, 170] },
  { id: "peach", rgb: [255, 190, 150] },
  { id: "gold", rgb: [255, 220, 140] },
  { id: "cool", rgb: [180, 220, 255] },
  { id: "lavender", rgb: [220, 200, 255] },
  { id: "mint", rgb: [200, 255, 220] },
  { id: "off", rgb: [255, 255, 255] },
] as const

function rgba(rgb: readonly number[], alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

export function FoundersLightLeak() {
  const [presetId, setPresetId] = useState<string>("warm")
  const [intensity, setIntensity] = useState(70)
  const [open, setOpen] = useState(false)
  const preset = LIGHT_LEAK_PRESETS.find((p) => p.id === presetId) ?? LIGHT_LEAK_PRESETS[0]
  const isOff = preset.id === "off"

  const mult = intensity / 100
  const alpha1 = 0.5 * mult
  const alpha2 = 0.14 * mult

  return (
    <>
      {/* Soft light leak from top-left — increased strength */}
      {!isOff && (
        <div
          className="pointer-events-none fixed inset-0 z-10"
          aria-hidden
          style={{
            background: `radial-gradient(ellipse 95% 75% at 0% 0%, ${rgba(preset.rgb, alpha1)} 0%, ${rgba(preset.rgb, alpha2)} 45%, transparent 70%)`,
          }}
        />
      )}

      {/* Controls on the left: collapsed pill "Light", expand to show slider + circular swatches */}
      <div className="fixed left-4 top-4 z-20 flex flex-col gap-3 sm:left-6 sm:top-6 md:left-[24px] md:top-[24px]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-9 items-center justify-center rounded-full bg-[#EBEBEB] px-4 text-[12px] font-medium text-[#666] transition-colors hover:bg-[#e0e0e0]"
        >
          Light
        </button>

        {open && (
          <div className="flex flex-col gap-3 rounded-2xl bg-[#f5f5f5] p-3 shadow-sm">
            {/* Intensity slider */}
            <div className="flex items-center gap-2">
              <span className="w-8 text-[10px] font-medium text-[#888] tabular-nums">{intensity}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="h-1.5 w-24 appearance-none rounded-full bg-[#ddd] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#666]"
              />
            </div>

            {/* Circular color swatches — no labels */}
            <div className="flex flex-wrap gap-2">
              {LIGHT_LEAK_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  title={p.id === "off" ? "Off" : p.id}
                  className={`h-8 w-8 shrink-0 rounded-full transition-[transform,opacity] hover:scale-110 ${
                    presetId === p.id ? "ring-2 ring-[#333] ring-offset-2 ring-offset-[#f5f5f5]" : "opacity-90 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: p.id === "off" ? "#e0e0e0" : rgba(p.rgb, 0.7),
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
