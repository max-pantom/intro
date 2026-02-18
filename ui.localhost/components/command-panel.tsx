import { type ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { uiLocalhostTokens } from "@/ui.localhost/tokens"

type UiLocalhostCommandItem = {
  label: string
  href: string
}

type UiLocalhostCommandPanelProps = ComponentProps<"section"> & {
  query?: string
  items: UiLocalhostCommandItem[]
}

export function UiLocalhostCommandPanel({
  className,
  query = "#labs",
  items,
  ...props
}: UiLocalhostCommandPanelProps) {
  return (
    <section className={cn(uiLocalhostTokens.surfaces.command, className)} {...props}>
      <input
        readOnly
        value={query}
        aria-label="Command query"
        className="w-full border border-black/30 bg-white px-2 py-1 font-mono text-[12px] uppercase tracking-[0.02em] outline-none"
      />
      <div className="pantom-scrollbar mt-2 max-h-[220px] overflow-y-auto border border-black/16 bg-white/70">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between px-2 py-1 font-mono text-[12px] tracking-[0.02em]"
          >
            <span>{item.label}</span>
            <span className="text-black/45">{item.href}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
