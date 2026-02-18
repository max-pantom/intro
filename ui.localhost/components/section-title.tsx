import { type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { uiLocalhostTokens } from "@/ui.localhost/tokens"

type UiLocalhostSectionTitleProps = {
  eyebrow: string
  title: string
  children?: ReactNode
  className?: string
}

export function UiLocalhostSectionTitle({
  eyebrow,
  title,
  children,
  className,
}: UiLocalhostSectionTitleProps) {
  return (
    <header className={cn("space-y-1.5", className)}>
      <p className={uiLocalhostTokens.typography.eyebrow}>{eyebrow}</p>
      <h2 className={uiLocalhostTokens.typography.title}>{title}</h2>
      {children ? <p className={uiLocalhostTokens.typography.body}>{children}</p> : null}
    </header>
  )
}
