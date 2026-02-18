export const uiLocalhostTokens = {
  layout: {
    page: "h-full w-full overflow-auto px-4 pb-10 pt-24 md:px-6 md:pt-28",
    shell: "mx-auto w-full max-w-6xl space-y-5",
    panel:
      "border border-black/20 bg-white/64 p-4 shadow-[0_18px_46px_rgba(0,0,0,0.14)] backdrop-blur-sm md:p-5",
    grid: "grid gap-4 md:grid-cols-3",
  },
  typography: {
    eyebrow: "font-mono text-[11px] uppercase tracking-[0.08em] text-black/60",
    title: "font-mono text-[24px] uppercase tracking-[-0.02em] text-black md:text-[30px]",
    body: "text-sm text-black/65",
    label: "font-mono text-[12px] uppercase tracking-[0.02em]",
  },
  surfaces: {
    card: "pantom-card border border-black/16 bg-[#f3f3f3] p-4",
    callout: "border border-black/22 bg-[#e7e7e7] p-3",
    command: "border border-black/30 bg-[#ececec] p-3",
  },
  motion: {
    reveal: "pantom-reveal",
    blink: "pantom-blue-blink",
    logoFlip: "pantom-logo-flip",
  },
} as const

export function uiLocalhostDelay(index: number, stepMs = 40) {
  return {
    animationDelay: `${Math.max(0, index) * stepMs}ms`,
  }
}
