import { ToolsContent } from "@/app/tools/tools-content"
import { getToolsProjects } from "@/app/tools/tools-data"
import { StudioFrame } from "@/components/studio/studio-frame"

export const dynamic = "force-dynamic"

export default async function ToolsJourneyPage() {
  const toolsProjects = await getToolsProjects()

  return (
    <StudioFrame navOverride="home" headerClassName="hidden">
      <ToolsContent projects={toolsProjects} mode="journey" />
    </StudioFrame>
  )
}
