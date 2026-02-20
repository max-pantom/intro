import { homeFolderTiles, navItems, type FolderTile, type NavItem } from "@/lib/studio-data"

export type GalleryKey = "apps" | "website" | "labs" | "tools"

export type CmsGalleries = {
  apps: string[]
  website: string[]
  labs: string[]
  tools: string[]
}

export type CmsToolProject = {
  id: string
  name: string
  tagline: string
  description: string
  year: string
  status: string
  linkLabel: string
  linkHref: string
  githubHref: string
  instagramHref: string
  demoUrl: string
  highlightUrls: string[]
}

export type CmsPublicData = {
  navItems: NavItem[]
  homeFolderTiles: FolderTile[]
  galleries: CmsGalleries
  toolsProjects: CmsToolProject[]
}

export const defaultCmsPublicData: CmsPublicData = {
  navItems,
  homeFolderTiles,
  galleries: {
    apps: [],
    website: [],
    labs: [],
    tools: [],
  },
  toolsProjects: [
    {
      id: "node-base-effect-tool",
      name: "A NODE BASE EFFECT TOOL",
      tagline: "NODE EDITOR",
      description: "I BUILT THIS BECAUSE I WANTED TO VISUALIZE HOW I CAN ADD DIFFERENT EFFECTS TO AN IMAGE BUT NOW ITS A NODE EDITOR",
      year: "2026",
      status: "ACTIVE",
      linkLabel: "SURFCE.WORK [↗]",
      linkHref: "https://surfce.work",
      githubHref: "https://github.com/max-pantom",
      instagramHref: "https://instagram.com/metagravity0",
      demoUrl: "",
      highlightUrls: [],
    },
    {
      id: "kinetic-type-engine",
      name: "KINETIC TYPE ENGINE",
      tagline: "MOTION TYPE",
      description: "A LIVE TYPE TOOL TO STAGE TIMING CURVES, WEIGHT SHIFTS, AND LAYERED GLYPH EFFECTS FOR EDITORIAL HEADLINES.",
      year: "2026",
      status: "IN PROGRESS",
      linkLabel: "TYPELAB.LOCAL [↗]",
      linkHref: "https://example.com",
      githubHref: "",
      instagramHref: "",
      demoUrl: "",
      highlightUrls: [],
    },
    {
      id: "palette-drift-mixer",
      name: "PALETTE DRIFT MIXER",
      tagline: "COLOR SYSTEM",
      description: "A SYSTEM TOOL TO BLEND BRAND PALETTES, PREVIEW CONTRAST, AND EXPORT APPROVED COLOR STATES FOR UI FLOWS.",
      year: "2026",
      status: "BETA",
      linkLabel: "PALETTE.DRIFT [↗]",
      linkHref: "https://example.com",
      githubHref: "",
      instagramHref: "",
      demoUrl: "",
      highlightUrls: [],
    },
  ],
}
