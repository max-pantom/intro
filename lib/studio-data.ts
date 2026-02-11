export type NavKey = "home" | "book-a-call" | "dna" | "labs" | "email" | "work"

export type NavItem = {
  key: NavKey
  label: string
  href: string
}

export const navItems: NavItem[] = [
  { key: "home", label: "HOME", href: "/" },
  { key: "book-a-call", label: "BOOK A CALL", href: "/book-a-call" },
  { key: "dna", label: "DNA", href: "/dna" },
  { key: "labs", label: "LABS", href: "/labs" },
  { key: "email", label: "EMAIL", href: "/email" },
  { key: "work", label: "WORK", href: "/work" },
]

export type FolderTile = {
  label: string
  href: string
  color: "silver" | "graphite" | "red" | "blue" | "yellow" | "purple"
  external?: boolean
}

export const homeFolderTiles: FolderTile[] = [
  { label: "#APPS", href: "/apps", color: "silver" },
  { label: "#WEBSITE", href: "/website", color: "graphite" },
  { label: "#LABS", href: "/labs", color: "red" },
  { label: "#BRANDING", href: "/branding", color: "blue" },
  { label: "#EXPERIMENTS", href: "/experiments", color: "yellow" },
  { label: "#BE NEXT [↗]", href: "/be-next", color: "purple", external: true },
]
