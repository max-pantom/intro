export type NavKey = "home" | "book-a-call" | "dna" | "labs" | "email"

export type NavItem = {
  key: NavKey
  label: string
  href: string
  external?: boolean
}

export const navItems: NavItem[] = [
  { key: "home", label: "HOME", href: "/" },
  { key: "book-a-call", label: "BOOK A CALL", href: "https://cal.com/metagravity/design", external: true },
  { key: "dna", label: "PRINCIPLES", href: "/principles" },
  { key: "email", label: "EMAIL", href: "mailto:metagravity0@gmail.com", external: true },
]

export type FolderTile = {
  label: string
  href: string
  color: "silver" | "graphite" | "red" | "blue" | "yellow" | "purple"
  external?: boolean
}

export const homeFolderTiles: FolderTile[] = [
  { label: "#APPS", href: "/apps", color: "silver" },
  { label: "#SITES", href: "/sites", color: "graphite" },
  { label: "#LABS", href: "/labs", color: "red" },
  { label: "#BRANDING", href: "/branding", color: "blue" },
  { label: "#TOOLS", href: "/tools", color: "yellow" },
  { label: "#START [↗]", href: "/start", color: "purple", external: true },
]
