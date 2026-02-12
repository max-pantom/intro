import { homeFolderTiles, navItems, type FolderTile, type NavItem } from "@/lib/studio-data"

export type GalleryKey = "apps" | "website" | "labs"

export type CmsGalleries = {
  apps: string[]
  website: string[]
  labs: string[]
}

export type CmsPublicData = {
  navItems: NavItem[]
  homeFolderTiles: FolderTile[]
  galleries: CmsGalleries
}

export const defaultCmsPublicData: CmsPublicData = {
  navItems,
  homeFolderTiles,
  galleries: {
    apps: [],
    website: [],
    labs: [],
  },
}
