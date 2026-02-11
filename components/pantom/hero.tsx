import Link from "next/link"

import { hero } from "@/lib/pantom-content"

import { ThemeToggle } from "./theme-toggle"

export function HeroSection() {
  return (
    <header className="pantom-reveal grid gap-10 border-b border-[#1f1a16]/20 pb-12 dark:border-[#e8dfd3]/20 md:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#554d44] dark:text-[#c2b7a8]">{hero.label}</p>
        <h1 className="max-w-4xl text-4xl leading-[1.05] font-semibold md:text-7xl">{hero.title}</h1>
        <p className="max-w-xl text-base leading-relaxed text-[#554d44] dark:text-[#c2b7a8]">{hero.narrative}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="#contact"
            className="rounded-full border border-[#1f1a16] bg-[#1f1a16] px-5 py-2.5 text-[#f4efe9] transition hover:-translate-y-0.5 dark:border-[#f4efe9] dark:bg-[#f4efe9] dark:text-[#1a1714]"
          >
            Start partnership
          </Link>
          <Link
            href="#case-studies"
            className="rounded-full border border-[#1f1a16]/25 px-5 py-2.5 transition hover:-translate-y-0.5 hover:border-[#1f1a16]/60 dark:border-[#e8dfd3]/25 dark:hover:border-[#e8dfd3]/60"
          >
            Read case stories
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-10 border-l border-[#1f1a16]/20 pl-6 dark:border-[#e8dfd3]/20">
        <div className="self-end">
          <ThemeToggle />
        </div>
        <div className="space-y-6">
          <p className="font-[family-name:var(--font-serif)] text-3xl leading-tight md:text-4xl">
            “{hero.partnerNote}”
          </p>
          <div className="grid gap-4 text-sm text-[#554d44] dark:text-[#c2b7a8]">
            <p>Product teams hire Pantom when they need originality with operational rigor.</p>
            <p>Design, code, and growth are built as one system.</p>
          </div>
        </div>
      </div>
    </header>
  )
}
