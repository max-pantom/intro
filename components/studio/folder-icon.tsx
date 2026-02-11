type FolderColor = "silver" | "graphite" | "red" | "blue" | "yellow" | "purple"

const folderStyles: Record<FolderColor, string> = {
  silver: "from-[#d8d8d8] via-[#b8b8b8] to-[#7f7f7f]",
  graphite: "from-[#22272e] via-[#20242a] to-[#0f1014]",
  red: "from-[#860d0d] via-[#ff0000] to-[#ff3a3a]",
  blue: "from-[#1d5fc4] via-[#2e94ff] to-[#0f4fbe]",
  yellow: "from-[#be8f00] via-[#ffdb1f] to-[#d9ac00]",
  purple: "from-[#6f0a95] via-[#d913ff] to-[#8a11b4]",
}

type FolderIconProps = {
  color: FolderColor
  className?: string
}

export function FolderIcon({ color, className }: FolderIconProps) {
  return (
    <div className={`relative ${className ?? "h-[92px] w-[130px]"}`}>
      <div
        className={`absolute inset-x-0 bottom-0 top-[22px] rounded-sm bg-gradient-to-b ${folderStyles[color]} shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]`}
      />
      <div
        className={`absolute left-[8px] top-0 h-[28px] w-[52px] rounded-t-sm bg-gradient-to-b ${folderStyles[color]} shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]`}
      />
      <div className="absolute inset-x-0 top-[22px] h-[4px] bg-white/16" />
    </div>
  )
}

export type { FolderColor }
