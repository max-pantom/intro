"use client"

import Image from "next/image"
import { type ReactNode, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

type NavId = "home" | "book-call" | "dna" | "labs" | "email" | "work"
type ViewId =
  | "home"
  | "nav-book-call"
  | "nav-dna"
  | "nav-labs"
  | "nav-email"
  | "nav-work"
  | "folder-apps"
  | "folder-website"
  | "folder-labs"
  | "folder-branding"
  | "folder-experiments"
  | "folder-be-next"

type FolderIconId = "apps" | "website" | "labs" | "branding" | "experiments" | "be-next"

type NavItem = {
  id: NavId
  label: string
}

type FolderAction = {
  id: ViewId
  label: string
  icon: FolderIconId
}

type DetailConfig = {
  title: string
  icon: FolderIconId
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "HOME" },
  { id: "book-call", label: "BOOK A CALL" },
  { id: "dna", label: "DNA" },
  { id: "labs", label: "LABS" },
  { id: "email", label: "EMAIL" },
  { id: "work", label: "WORK" },
]

const HOME_FOLDERS: FolderAction[] = [
  { id: "folder-apps", label: "#APPS", icon: "apps" },
  { id: "folder-website", label: "#WEBSITE", icon: "website" },
  { id: "folder-labs", label: "#LABS", icon: "labs" },
  { id: "folder-branding", label: "#BRANDING", icon: "branding" },
  { id: "folder-experiments", label: "#EXPERIMENTS", icon: "experiments" },
  { id: "folder-be-next", label: "#BE NEXT [↗]", icon: "be-next" },
]

const DETAIL_VIEWS: Record<Exclude<ViewId, "home">, DetailConfig> = {
  "nav-book-call": { title: "BOOK A CALL", icon: "apps" },
  "nav-dna": { title: "DNA", icon: "website" },
  "nav-labs": { title: "LABS", icon: "labs" },
  "nav-email": { title: "EMAIL", icon: "branding" },
  "nav-work": { title: "WORK", icon: "experiments" },
  "folder-apps": { title: "APPS", icon: "apps" },
  "folder-website": { title: "WEBSITE", icon: "website" },
  "folder-labs": { title: "LABS", icon: "labs" },
  "folder-branding": { title: "BRANDING", icon: "branding" },
  "folder-experiments": { title: "EXPERIMENTS", icon: "experiments" },
  "folder-be-next": { title: "BE NEXT", icon: "be-next" },
}

function folderIcon(icon: FolderIconId) {
  switch (icon) {
    case "apps":
      return <Image src="/folders/apps.svg" alt="" fill sizes="92px" className="pointer-events-none select-none" />
    case "website":
      return <WebsiteFolderGraphic />
    case "labs":
      return <Image src="/folders/labs.svg" alt="" fill sizes="92px" className="pointer-events-none select-none" />
    case "branding":
      return <Image src="/folders/branding.svg" alt="" fill sizes="92px" className="pointer-events-none select-none" />
    case "experiments":
      return (
        <Image src="/folders/experiments.svg" alt="" fill sizes="92px" className="pointer-events-none select-none" />
      )
    case "be-next":
      return <Image src="/folders/be-next.svg" alt="" fill sizes="92px" className="pointer-events-none select-none" />
    default:
      return null
  }
}

function WebsiteFolderGraphic() {
  return (
    <>
      <Image src="/folders/website-base.svg" alt="" fill sizes="92px" className="pointer-events-none select-none" />
      <div className="absolute left-0 top-[16.83px] h-[59.363px] w-[92.103px] bg-gradient-to-b from-[#343434] via-[#232323] to-black" />
      <div className="absolute -left-[5.756px] top-[35.98px] h-[17.269px] w-[103.616px] mix-blend-overlay">
        <Image src="/folders/website-overlay.svg" alt="" fill sizes="104px" className="pointer-events-none select-none" />
      </div>
    </>
  )
}

type FolderTileProps = {
  icon: FolderIconId
  label: string
  onClick?: () => void
}

function FolderTile({ icon, label, onClick }: FolderTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[92.103px] flex-col items-center gap-[10px]"
      aria-label={label}
    >
      <div className="relative h-[75.913px] w-[92.103px] transition-transform duration-150 group-hover:-translate-y-0.5">
        {folderIcon(icon)}
      </div>
      <p className="w-full text-center font-mono text-[12px] leading-none tracking-[-0.24px] text-[#3c3c3c] uppercase">
        {label}
      </p>
    </button>
  )
}

function HomeView({ onFolderSelect }: { onFolderSelect: (view: ViewId) => void }) {
  return (
    <section className="absolute inset-0 flex items-center justify-center px-3">
      <div className="grid scale-[0.74] grid-cols-3 gap-[50px] sm:scale-[0.88] lg:scale-100">
        {HOME_FOLDERS.map((folder) => (
          <FolderTile key={folder.id} icon={folder.icon} label={folder.label} onClick={() => onFolderSelect(folder.id)} />
        ))}
      </div>
    </section>
  )
}

function DetailBlocks({ title, icon }: DetailConfig) {
  return (
    <section className="absolute inset-0">
      <div className="absolute left-1/2 top-[22px] -translate-x-1/2">
        <div className="relative h-[75.913px] w-[92.103px]">{folderIcon(icon)}</div>
      </div>

      <div className="absolute inset-x-3 top-[196px] flex flex-col gap-4 md:gap-5">
        <div className="grid grid-cols-4 gap-4 md:gap-5">
          <GrayBlock />
          <GrayBlock />
          <GrayBlock />
          <GrayBlock />
        </div>
        <div className="grid grid-cols-4 gap-4 md:gap-5">
          <GrayBlock />
          <GrayBlock />
          <GrayBlock />
          <GrayBlock />
        </div>
      </div>

      <p className="absolute bottom-[12px] left-1/2 -translate-x-1/2 font-mono text-[16px] font-semibold leading-none tracking-[-0.32px] text-[#3c3c3c] uppercase">
        : {title} :
      </p>
    </section>
  )
}

function GrayBlock() {
  return <div className="h-[min(384px,42dvh)] bg-[#c2c2c4]" />
}

function formatNavLabel(item: NavItem, activeNav: NavId) {
  if (item.id === activeNav) {
    return `[ ${item.label} ]`
  }
  return item.label
}

function SiteNav({
  activeNav,
  onSelect,
}: {
  activeNav: NavId
  onSelect: (value: NavId) => void
}) {
  return (
    <nav className="font-mono text-[12px] leading-none uppercase">
      <div className="grid grid-cols-[1fr_8px] items-start gap-x-[12px] gap-y-[10px]">
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeNav
          return (
            <div key={item.id} className="contents">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "text-right transition-colors duration-150",
                  active ? "text-black" : "text-black/50 hover:text-black/75",
                )}
              >
                {formatNavLabel(item, activeNav)}
              </button>
              <span className={cn("mt-0.5 size-2", active ? "bg-[#2067ff]" : "bg-transparent")} />
            </div>
          )
        })}
      </div>
    </nav>
  )
}

function resolveActiveNav(view: ViewId): NavId {
  if (view.startsWith("nav-")) {
    return view.replace("nav-", "") as Exclude<NavId, "home">
  }
  return "home"
}

function viewFromNav(nav: NavId): ViewId {
  if (nav === "home") {
    return "home"
  }
  return `nav-${nav}` as ViewId
}

export function PantomHomeCall() {
  const [view, setView] = useState<ViewId>("home")

  const activeNav = useMemo(() => resolveActiveNav(view), [view])

  let content: ReactNode
  if (view === "home") {
    content = <HomeView onFolderSelect={setView} />
  } else {
    content = <DetailBlocks {...DETAIL_VIEWS[view]} />
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#dddddd] text-black">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between pl-6 pr-3 pt-6">
        <button
          type="button"
          onClick={() => setView("home")}
          className="pointer-events-auto text-[24px] leading-none uppercase"
        >
          Pantom
        </button>
        <div className="pointer-events-auto">
          <SiteNav activeNav={activeNav} onSelect={(nav) => setView(viewFromNav(nav))} />
        </div>
      </header>
      {content}
    </main>
  )
}
