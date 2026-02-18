import { HomeCubeLab } from "@/components/home-cube-lab"
import { StudioFrame } from "@/components/studio/studio-frame"

export default function CubeLabPage() {
  return (
    <StudioFrame
      navOverride="labs"
      headerTone="light"
      backgroundColor="#060b16"
      headerClassName="px-4 md:px-6"
      navClassName="bg-black/30 md:bg-transparent"
    >
      <HomeCubeLab />
    </StudioFrame>
  )
}
