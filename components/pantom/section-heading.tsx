import { ReactNode } from "react"

type SectionHeadingProps = {
  eyebrow: string
  title: string
  children?: ReactNode
}

export function SectionHeading({ eyebrow, title, children }: SectionHeadingProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[0.25fr_0.75fr] md:items-end">
      <p className="text-xs uppercase tracking-[0.2em] text-[#554d44] dark:text-[#c2b7a8]">{eyebrow}</p>
      <div className="space-y-2">
        <h2 className="text-3xl leading-tight font-semibold md:text-5xl">{title}</h2>
        {children ? <div className="max-w-3xl text-sm text-[#554d44] dark:text-[#c2b7a8]">{children}</div> : null}
      </div>
    </div>
  )
}
