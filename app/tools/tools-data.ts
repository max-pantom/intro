import { readdir } from "node:fs/promises"
import path from "node:path"

import { type CmsToolProject } from "@/lib/cms-types"
import { getCmsPublicData } from "@/lib/cms-server"

const TOOLS_IMAGES_DIR = path.join(process.cwd(), "public", "tools-images")
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)$/i
const DEFAULT_TOOLS_PREVIEWS = ["/website-images/Index.png", "/website-images/Marv.png", "/lab-images/28.gif"]

async function getToolsImagePaths() {
  try {
    const entries = await readdir(TOOLS_IMAGES_DIR, { withFileTypes: true })
    const matched = entries
      .filter((entry) => entry.isFile() && IMAGE_FILE_PATTERN.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((name) => `/tools-images/${name}`)

    return matched.length > 0 ? matched : [...DEFAULT_TOOLS_PREVIEWS]
  } catch {
    return [...DEFAULT_TOOLS_PREVIEWS]
  }
}

function hydrateToolsProjects(projects: CmsToolProject[], fallbackImages: string[]) {
  if (projects.length === 0 && fallbackImages.length > 0) {
    return fallbackImages.map((imagePath, index) => ({
      id: `tool-project-${index + 1}`,
      name: `TOOL PROJECT ${index + 1}`,
      tagline: "INTERACTIVE PREVIEW",
      description: "ADD PROJECT DETAILS FROM /ADMIN TO CUSTOMIZE THIS VIEW.",
      year: `${new Date().getFullYear()}`,
      status: "ACTIVE",
      linkLabel: "",
      linkHref: "",
      githubHref: "",
      instagramHref: "",
      demoUrl: imagePath,
      highlightUrls: [],
    }))
  }

  return projects.map((project, index) => {
    const fallbackImage = fallbackImages[index] ?? fallbackImages[0] ?? DEFAULT_TOOLS_PREVIEWS[index % DEFAULT_TOOLS_PREVIEWS.length] ?? ""

    return {
      ...project,
      demoUrl: project.demoUrl || project.highlightUrls[0] || fallbackImage,
      highlightUrls: project.highlightUrls.length > 0 ? project.highlightUrls : fallbackImage ? [fallbackImage] : [],
    }
  })
}

function ensureMinimumProjects(projects: CmsToolProject[], fallbackImages: string[]) {
  const fakeProjects: CmsToolProject[] = [
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
  ]

  const next = [...projects]
  for (const project of fakeProjects) {
    if (next.length >= 3) break
    if (!next.some((item) => item.id === project.id)) {
      const fallbackImage = fallbackImages[next.length] ?? fallbackImages[0] ?? DEFAULT_TOOLS_PREVIEWS[next.length % DEFAULT_TOOLS_PREVIEWS.length]
      next.push({
        ...project,
        demoUrl: fallbackImage,
        highlightUrls: fallbackImage ? [fallbackImage] : [],
      })
    }
  }

  return next
}

export async function getToolsProjects() {
  const cmsData = await getCmsPublicData()
  const toolsImages = cmsData.galleries.tools.length > 0 ? cmsData.galleries.tools : await getToolsImagePaths()
  return ensureMinimumProjects(hydrateToolsProjects(cmsData.toolsProjects, toolsImages), toolsImages)
}
