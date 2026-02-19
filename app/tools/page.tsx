import { readdir } from "node:fs/promises"
import path from "node:path"

import { ToolsContent } from "@/app/tools/tools-content"
import { StudioFrame } from "@/components/studio/studio-frame"
import { type CmsToolProject } from "@/lib/cms-types"
import { getCmsPublicData } from "@/lib/cms-server"

export const dynamic = "force-dynamic"

const TOOLS_IMAGES_DIR = path.join(process.cwd(), "public", "tools-images")
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)$/i

async function getToolsImagePaths() {
  try {
    const entries = await readdir(TOOLS_IMAGES_DIR, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && IMAGE_FILE_PATTERN.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((name) => `/tools-images/${name}`)
  } catch {
    return []
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
      demoUrl: imagePath,
      highlightUrls: [],
    }))
  }

  return projects.map((project, index) => {
    const fallbackImage = fallbackImages[index] ?? fallbackImages[0] ?? ""

    return {
      ...project,
      demoUrl: project.demoUrl || project.highlightUrls[0] || fallbackImage,
      highlightUrls: project.highlightUrls.length > 0 ? project.highlightUrls : fallbackImage ? [fallbackImage] : [],
    }
  })
}

export default async function ToolsPage() {
  const cmsData = await getCmsPublicData()
  const toolsImages = cmsData.galleries.tools.length > 0 ? cmsData.galleries.tools : await getToolsImagePaths()
  const toolsProjects = hydrateToolsProjects(cmsData.toolsProjects, toolsImages)

  return (
    <StudioFrame navOverride="home" headerClassName="px-5 md:px-6">
      <ToolsContent projects={toolsProjects} />
    </StudioFrame>
  )
}
