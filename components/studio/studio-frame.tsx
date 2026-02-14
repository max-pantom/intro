"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"

import { defaultCmsPublicData } from "@/lib/cms-types"
import { fetchCmsPublicData } from "@/lib/cms-public-client"
import { trackCmsClick } from "@/lib/track-click"
import { type FolderTile, type NavItem, type NavKey } from "@/lib/studio-data"

type StudioFrameProps = {
  backgroundClassName?: string
  backgroundColor?: string
  headerTone?: "dark" | "light"
  headerClassName?: string
  navClassName?: string
  navOverride?: NavKey
  children: ReactNode
}

type CommandTarget = {
  label: string
  href: string
  external?: boolean
  aliases: string[]
}

function normalizeCommand(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function buildAliasesFromLabel(label: string) {
  const normalized = normalizeCommand(label)
  const plain = normalized.replace(/[^a-z0-9#\s]/g, "").trim()
  const noHash = plain.replace(/^#/, "").trim()
  return Array.from(new Set([normalized, plain, noHash].filter(Boolean)))
}

function buildCommandTargets(currentNavItems: NavItem[], currentFolderTiles: FolderTile[]): CommandTarget[] {
  const navTargets = currentNavItems.map((item) => ({
    label: item.label,
    href: item.href,
    external: item.external,
    aliases: buildAliasesFromLabel(item.label),
  }))

  const folderTargets = currentFolderTiles.map((item) => ({
    label: item.label,
    href: item.href,
    external: item.external,
    aliases: buildAliasesFromLabel(item.label),
  }))

  return [...navTargets, ...folderTargets]
}

function getActiveNav(pathname: string): NavKey {
  if (pathname === "/labs") return "labs"
  if (pathname.startsWith("/book-a-call")) return "book-a-call"
  if (pathname.startsWith("/principles") || pathname.startsWith("/dna")) return "dna"
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
  const router = useRouter()
  const activeKey = navOverride ?? getActiveNav(pathname)
  const isLabsPage = pathname.startsWith("/labs")
  const [currentNavItems, setCurrentNavItems] = useState(defaultCmsPublicData.navItems)
  const [currentFolderTiles, setCurrentFolderTiles] = useState(defaultCmsPublicData.homeFolderTiles)
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState("")
  const isLightHeader = headerTone === "light"
  const logoTextColor = isLightHeader ? "text-[#f5dfe1]" : isNavCollapsed ? "text-[#0d0d0d]" : "text-[#121212]"
  const navTextColor = isLightHeader ? "text-[#ffffff]" : "text-[#000000]"
  const commandBackdropClass = isLightHeader ? "bg-[#4f090d]/68" : "bg-black/20"
  const commandPanelClass = isLightHeader
    ? "border-white/35 bg-[#b71f27]/92 text-[#fff4f4]"
    : "border-black/30 bg-[#ececec] text-black"
  const commandInputClass = isLightHeader
    ? "border-white/35 bg-[#d43a42]/55 text-white placeholder:text-white/65"
    : "border-black/30 bg-white text-black placeholder:text-black/45"
  const commandListClass = isLightHeader ? "border-white/25 bg-[#cf2f38]/35" : "border-black/15 bg-white/70"
  const commandItemClass = isLightHeader ? "hover:bg-white/12" : "hover:bg-black/8"
  const commandHrefClass = isLightHeader ? "text-white/60" : "text-black/45"
  const frameStyle: CSSProperties = { backgroundColor: backgroundColor ?? "#ececec" }

  useEffect(() => {
    let isMounted = true

    void fetchCmsPublicData().then((payload) => {
      if (!isMounted) return
      if (payload?.navItems?.length) setCurrentNavItems(payload.navItems)
      if (payload?.homeFolderTiles?.length) setCurrentFolderTiles(payload.homeFolderTiles)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const onScroll = (event: Event) => {
      const target = event.target
      const scrollTop = target instanceof HTMLElement ? target.scrollTop : 0
      const nextCollapsedState = scrollTop > 0

      setIsNavCollapsed((previousState) => (previousState === nextCollapsedState ? previousState : nextCollapsedState))
    }

    window.addEventListener("scroll", onScroll, true)
    return () => window.removeEventListener("scroll", onScroll, true)
  }, [])

  const filteredCommands = useMemo(() => {
    const commandTargets = buildCommandTargets(currentNavItems, currentFolderTiles)
    const normalized = normalizeCommand(commandQuery)
    if (!normalized) return commandTargets

    return commandTargets.filter((command) => command.aliases.some((alias) => normalizeCommand(alias).includes(normalized)))
  }, [commandQuery, currentFolderTiles, currentNavItems])

  const runCommand = (command: CommandTarget) => {
    setIsCommandOpen(false)
    setCommandQuery("")
    trackCmsClick({
      source: "command",
      sourceContext: "command-palette",
      label: command.label,
      href: command.href,
    })

    if (command.external || command.href.startsWith("mailto:") || command.href.startsWith("http")) {
      window.location.href = command.href
      return
    }

    router.push(command.href)
  }

  const runExactCommandIfAny = (nextQuery: string) => {
    const commandTargets = buildCommandTargets(currentNavItems, currentFolderTiles)
    const normalized = normalizeCommand(nextQuery)
    if (!normalized) return

    const exact = commandTargets.find((command) => command.aliases.some((alias) => normalizeCommand(alias) === normalized))
    if (exact) runCommand(exact)
  }

  const handleNavItemClick = (item: NavItem) => {
    setIsMobileMenuOpen(false)
    trackCmsClick({
      source: "nav",
      sourceContext: "studio-nav",
      label: item.label,
      href: item.href,
      section: "nav",
    })
  }

  const emitLabsColumnsChange = (delta: -1 | 1) => {
    window.dispatchEvent(new CustomEvent("labs-columns-change", { detail: { delta } }))
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setIsCommandOpen((value) => !value)
      }

      if (event.key === "Escape") {
        setIsCommandOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className={`relative h-dvh w-full overflow-hidden ${backgroundClassName ?? ""}`} style={frameStyle}>
      <header className={`pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between px-5 pt-5 ${headerClassName ?? ""}`}>
        <Link href="/" className={`pantom-logo-flip pointer-events-auto text-[24px] leading-none tracking-[-0.02em] ${logoTextColor}`}>
          <span className="relative inline-flex h-[24px] min-w-[98px] items-center">
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${isNavCollapsed ? "translate-y-[-55%] scale-95 opacity-0" : "translate-y-[-50%] scale-100 opacity-100"}`}
            >
              PANTOM
            </span>
            <svg
              width="121"
              height="93"
              viewBox="0 0 121 93"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`absolute left-0 top-1/2 h-[20px] w-auto -translate-y-1/2 text-white mix-blend-difference transition-all duration-500 ease-out ${isNavCollapsed ? "translate-y-[-50%] scale-100 opacity-100" : "translate-y-[-45%] scale-95 opacity-0"}`}
            >
              <path
                d="M53.6292 28.1593V0H67.154V28.1593L99.9914 0H120.783L78.6827 36.1023H116.776V49.6438H76.7173L119.93 92.9099H100.803L67.154 59.2192V92.9099H53.6292V59.2188L19.9795 92.9099H0.852642L44.0655 49.6438H4.00713V36.1023H42.1001L0 0H20.7914L53.6292 28.1593Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </Link>

        <div className="pointer-events-auto relative flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            className={`md:hidden rounded-[2px] border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.04em] ${navTextColor} ${isLightHeader ? "border-white/45 bg-black/20" : "border-black/30 bg-white/45"}`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? "Close" : "Menu"}
          </button>

          <nav
            className={`${isMobileMenuOpen ? "flex" : "hidden"} md:flex flex-col items-end gap-[10px] rounded-[2px] px-2 py-1 text-right font-mono text-[12px] uppercase tracking-[-0.02em] md:rounded-none md:bg-transparent md:px-0 md:py-0 ${isLightHeader ? "bg-black/30" : "bg-white/62"} ${navClassName ?? ""}`}
          >
          {currentNavItems.map((item, index) => {
            const isActive = item.key === activeKey
            const baseOpacity = isActive ? 1 : isLightHeader ? 0.8 : 0.5
            const collapseIntoHome = !isMobileMenuOpen && isNavCollapsed && item.key !== "home"
            const itemClassName = `relative pr-5 ${navTextColor} transition-[opacity,transform] duration-300 hover:opacity-80`
            const itemStyle: CSSProperties = {
              opacity: collapseIntoHome ? 0 : baseOpacity,
              transform: collapseIntoHome ? `translateY(-${(index + 1) * 14}px) scale(0.94)` : "translateY(0) scale(1)",
              pointerEvents: collapseIntoHome ? "none" : "auto",
              transitionDelay: collapseIntoHome ? `${(index + 1) * 35}ms` : "0ms",
            }
            const homeBadgeClassName =
              isNavCollapsed && item.key === "home"
                ? "inline-flex bg-[#141414] px-1 text-[#f1f1f1]"
                : "inline-flex"

            return (
              item.external ? (
                <a
                  key={item.key}
                  href={item.href}
                  className={itemClassName}
                  style={itemStyle}
                  data-analytics-source="studio-nav"
                  onClick={() => handleNavItemClick(item)}
                >
                  <span className={homeBadgeClassName}>{isActive ? `[ ${item.label} ]` : item.label}</span>
                  {isActive ? <span className={`pantom-blue-blink absolute right-0 top-0.5 size-2 ${isNavCollapsed ? "bg-[#0b43b8]" : "bg-[#2067ff]"}`} /> : null}
                </a>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  className={itemClassName}
                  style={itemStyle}
                  data-analytics-source="studio-nav"
                  onClick={() => handleNavItemClick(item)}
                >
                  <span className={homeBadgeClassName}>{isActive ? `[ ${item.label} ]` : item.label}</span>
                  {isActive ? <span className={`pantom-blue-blink absolute right-0 top-0.5 size-2 ${isNavCollapsed ? "bg-[#0b43b8]" : "bg-[#2067ff]"}`} /> : null}
                </Link>
              )
            )
          })}

          {isLabsPage && isMobileMenuOpen ? (
            <div className="mt-1 flex items-center gap-2 border border-white/25 bg-black/20 px-2 py-1 md:hidden">
              <button
                type="button"
                onClick={() => emitLabsColumnsChange(-1)}
                className="h-6 w-6 border border-white/35 font-mono text-[12px] text-white"
                aria-label="Decrease labs columns"
              >
                -
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/85">Labs Size</span>
              <button
                type="button"
                onClick={() => emitLabsColumnsChange(1)}
                className="h-6 w-6 border border-white/35 font-mono text-[12px] text-white"
                aria-label="Increase labs columns"
              >
                +
              </button>
            </div>
          ) : null}
          </nav>
        </div>
      </header>

      {children}

      {isCommandOpen ? (
        <div className={`pointer-events-auto absolute inset-0 z-40 flex items-start justify-center px-4 pt-[10vh] md:pt-[12vh] ${commandBackdropClass}`}>
          <div className={`w-full max-w-[560px] border p-3 shadow-[0_14px_36px_rgba(0,0,0,0.22)] ${commandPanelClass}`}>
            <input
              autoFocus
              value={commandQuery}
              onChange={(event) => {
                const nextQuery = event.target.value
                setCommandQuery(nextQuery)
                runExactCommandIfAny(nextQuery)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && filteredCommands[0]) {
                  event.preventDefault()
                  runCommand(filteredCommands[0])
                }
              }}
              placeholder="Type #labs, #apps, principles..."
              className={`w-full border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.02em] outline-none ${commandInputClass}`}
            />
            <div className={`pantom-scrollbar mt-2 max-h-[220px] overflow-y-auto border ${commandListClass}`}>
              {filteredCommands.slice(0, 8).map((command) => (
                <button
                  key={command.label}
                  type="button"
                  onClick={() => runCommand(command)}
                  className={`flex w-full items-center justify-between px-2 py-1 text-left font-mono text-[12px] tracking-[0.02em] ${commandItemClass}`}
                >
                  <span>{command.label}</span>
                  <span className={commandHrefClass}>{command.href}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
