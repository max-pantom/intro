"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { navItems, type NavKey } from "@/lib/studio-data"

type StudioFrameProps = {
  backgroundClassName?: string
  navOverride?: NavKey
  children: ReactNode
}

function getActiveNav(pathname: string): NavKey {
  if (pathname === "/labs") return "labs"
  if (pathname.startsWith("/book-a-call")) return "book-a-call"
  if (pathname.startsWith("/dna")) return "dna"
  if (pathname.startsWith("/email")) return "email"
  if (pathname.startsWith("/work")) return "work"
  return "home"
}

export function StudioFrame({ backgroundClassName, navOverride, children }: StudioFrameProps) {
  const pathname = usePathname()
  const activeKey = navOverride ?? getActiveNav(pathname)

  return (
    <div className={`relative h-dvh w-full overflow-hidden bg-[#e6e6e6] ${backgroundClassName ?? ""}`}>
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between px-5 pt-4 sm:px-8 sm:pt-6">
        <Link
          href="/"
          className="pointer-events-auto text-[30px] leading-none tracking-[-0.02em] text-[#121212] md:text-[46px]"
        >
          PANTOM
        </Link>

        <nav className="pointer-events-auto flex flex-col items-end gap-2 text-right font-mono text-[12px] tracking-[0.08em] md:gap-3 md:text-[36px] md:tracking-[0.12em]">
          {navItems.map((item) => {
            const isActive = item.key === activeKey
            return (
              <Link key={item.key} href={item.href} className="group flex items-center gap-2 text-[#6f6f6f] hover:text-[#333]">
                <span className={`${isActive ? "text-[#202020]" : ""}`}>{isActive ? `[ ${item.label} ]` : item.label}</span>
                <span
                  className={`inline-block size-2 transition-opacity sm:size-[8px] ${
                    isActive ? "bg-[#0d57f2] opacity-100" : "bg-[#0d57f2] opacity-0 group-hover:opacity-35"
                  }`}
                />
              </Link>
            )
          })}
        </nav>
      </header>

      {children}
    </div>
  )
}
