"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"

import { navItems, type NavKey } from "@/lib/studio-data"

type StudioFrameProps = {
  backgroundClassName?: string
  backgroundColor?: string
  headerTone?: "dark" | "light"
  headerClassName?: string
  navClassName?: string
  navOverride?: NavKey
  children: ReactNode
}

function getActiveNav(pathname: string): NavKey {
  if (pathname === "/labs") return "labs"
  if (pathname.startsWith("/book-a-call")) return "book-a-call"
  if (pathname.startsWith("/dna")) return "dna"
  if (pathname.startsWith("/email")) return "email"
  return "home"
}

export function StudioFrame({
  backgroundClassName,
  backgroundColor,
  headerTone = "dark",
  headerClassName,
  navClassName,
  navOverride,
  children,
}: StudioFrameProps) {
  const pathname = usePathname()
  const activeKey = navOverride ?? getActiveNav(pathname)
  const isLightHeader = headerTone === "light"
  const logoTextColor = isLightHeader ? "text-[#f5dfe1]" : "text-[#121212]"
  const navTextColor = isLightHeader ? "text-[#ffffff]" : "text-[#000000]"
  const frameStyle: CSSProperties = { backgroundColor: backgroundColor ?? "#ececec" }

  return (
    <div className={`relative h-dvh w-full overflow-hidden ${backgroundClassName ?? ""}`} style={frameStyle}>
      <header className={`pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between px-5 pt-5 ${headerClassName ?? ""}`}>
        <Link href="/" className={`pointer-events-auto text-[24px] leading-none tracking-[-0.02em] ${logoTextColor}`}>
          PANTOM
        </Link>

        <nav
          className={`pointer-events-auto flex flex-col items-end gap-[10px] text-right font-mono text-[12px] uppercase tracking-[-0.02em] ${navClassName ?? ""}`}
        >
          {navItems.map((item) => {
            const isActive = item.key === activeKey
            const itemClassName = `relative pr-5 ${navTextColor} transition-opacity hover:opacity-80 ${isActive ? "opacity-100" : isLightHeader ? "opacity-80" : "opacity-50"}`
            return (
              item.external ? (
                <a key={item.key} href={item.href} className={itemClassName}>
                  <span>{isActive ? `[ ${item.label} ]` : item.label}</span>
                  {isActive ? <span className="absolute right-0 top-0.5 size-2 bg-[#2067ff]" /> : null}
                </a>
              ) : (
                <Link key={item.key} href={item.href} className={itemClassName}>
                  <span>{isActive ? `[ ${item.label} ]` : item.label}</span>
                  {isActive ? <span className="absolute right-0 top-0.5 size-2 bg-[#2067ff]" /> : null}
                </Link>
              )
            )
          })}
        </nav>
      </header>

      {children}
    </div>
  )
}
