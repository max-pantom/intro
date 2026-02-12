import { homeFolderTiles, navItems, type FolderTile, type NavItem } from "@/lib/studio-data"

export type CmsPublicData = {
  navItems: NavItem[]
  homeFolderTiles: FolderTile[]
}

export const defaultCmsPublicData: CmsPublicData = {
  navItems,
  homeFolderTiles,
}
