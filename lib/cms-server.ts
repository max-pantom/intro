import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { sql } from "@vercel/postgres"

import { defaultCmsPublicData, type CmsPublicData } from "@/lib/cms-types"

const CMS_DATA_DIR = path.join(process.cwd(), "data")
const CMS_DATA_PATH = path.join(CMS_DATA_DIR, "cms.json")
const folderColors = new Set(["silver", "graphite", "red", "blue", "yellow", "purple"])

function hasPostgresConfig() {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)
}

function ensurePostgresEnvAlias() {
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL
  }
}

function isAllowedGalleryPath(value: string, localPrefix: string) {
  if (value.startsWith(localPrefix)) return true

  if (!value.startsWith("https://")) return false

  try {
    const parsed = new URL(value)
    return parsed.hostname.endsWith(".public.blob.vercel-storage.com")
  } catch {
    return false
  }
}

async function ensureCmsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS cms_state (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

function sanitizeCmsData(input: unknown): CmsPublicData {
  const source = input && typeof input === "object" ? (input as Partial<CmsPublicData>) : {}
  const sourceNav = Array.isArray(source.navItems) ? source.navItems : []
  const sourceFolders = Array.isArray(source.homeFolderTiles) ? source.homeFolderTiles : []
  const sourceGalleries = source.galleries && typeof source.galleries === "object" ? source.galleries : null

  const navItems = defaultCmsPublicData.navItems.map((defaultItem) => {
    const candidate = sourceNav.find((item) => item && typeof item === "object" && "key" in item && item.key === defaultItem.key)
    if (!candidate) return defaultItem

    return {
      ...defaultItem,
      label: typeof candidate.label === "string" && candidate.label.trim() ? candidate.label : defaultItem.label,
      href: typeof candidate.href === "string" && candidate.href.trim() ? candidate.href : defaultItem.href,
      external: Boolean(candidate.external),
    }
  })

  const homeFolderTiles = defaultCmsPublicData.homeFolderTiles.map((defaultItem, index) => {
    const candidate = sourceFolders[index]
    if (!candidate || typeof candidate !== "object") return defaultItem

    return {
      ...defaultItem,
      label: typeof candidate.label === "string" && candidate.label.trim() ? candidate.label : defaultItem.label,
      href: typeof candidate.href === "string" && candidate.href.trim() ? candidate.href : defaultItem.href,
      color:
        typeof candidate.color === "string" && folderColors.has(candidate.color)
          ? candidate.color
          : defaultItem.color,
      external: Boolean(candidate.external),
    }
  })

  const galleries = {
    apps: Array.isArray(sourceGalleries?.apps)
      ? sourceGalleries.apps.filter(
          (value): value is string => typeof value === "string" && isAllowedGalleryPath(value, "/apps-images/"),
        )
      : defaultCmsPublicData.galleries.apps,
    website: Array.isArray(sourceGalleries?.website)
      ? sourceGalleries.website.filter(
          (value): value is string => typeof value === "string" && isAllowedGalleryPath(value, "/website-images/"),
        )
      : defaultCmsPublicData.galleries.website,
    labs: Array.isArray(sourceGalleries?.labs)
      ? sourceGalleries.labs.filter(
          (value): value is string => typeof value === "string" && isAllowedGalleryPath(value, "/lab-images/"),
        )
      : defaultCmsPublicData.galleries.labs,
  }

  return {
    navItems,
    homeFolderTiles,
    galleries,
  }
}

export async function getCmsPublicData(): Promise<CmsPublicData> {
  if (hasPostgresConfig()) {
    try {
      ensurePostgresEnvAlias()
      await ensureCmsTable()
      const result = await sql<{ data: unknown }>`SELECT data FROM cms_state WHERE id = 1`
      if (result.rows[0]?.data) {
        return sanitizeCmsData(result.rows[0].data)
      }

      const seeded = sanitizeCmsData(defaultCmsPublicData)
      await sql`INSERT INTO cms_state (id, data) VALUES (1, ${JSON.stringify(seeded)}::jsonb)`
      return seeded
    } catch {
      // Fallback to local file storage when database is unavailable.
    }
  }

  try {
    const raw = await readFile(CMS_DATA_PATH, "utf8")
    return sanitizeCmsData(JSON.parse(raw))
  } catch {
    return defaultCmsPublicData
  }
}

export async function saveCmsPublicData(input: unknown): Promise<CmsPublicData> {
  const next = sanitizeCmsData(input)

  if (hasPostgresConfig()) {
    try {
      ensurePostgresEnvAlias()
      await ensureCmsTable()
      await sql`
        INSERT INTO cms_state (id, data, updated_at)
        VALUES (1, ${JSON.stringify(next)}::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `
      return next
    } catch {
      // Fallback to local file storage when database is unavailable.
    }
  }

  await mkdir(CMS_DATA_DIR, { recursive: true })
  await writeFile(CMS_DATA_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8")
  return next
}
