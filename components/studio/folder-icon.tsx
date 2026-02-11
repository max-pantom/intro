import Image from "next/image"

type FolderColor = "silver" | "graphite" | "red" | "blue" | "yellow" | "purple"

const folderAssets: Record<Exclude<FolderColor, "graphite">, string> = {
  silver: "/folders/apps.svg",
  red: "/folders/labs.svg",
  blue: "/folders/branding.svg",
  yellow: "/folders/experiments.svg",
  purple: "/folders/be-next.svg",
}

type FolderIconProps = {
  color: FolderColor
  className?: string
}

export function FolderIcon({ color, className }: FolderIconProps) {
  const isWebsiteFolder = color === "graphite"

  return (
    <div
      className={`relative transition-transform duration-200 ease-out will-change-transform group-hover:-translate-y-1.5 motion-reduce:transform-none ${className ?? "h-[92px] w-[130px]"}`}
    >
      {isWebsiteFolder ? (
        <>
          <Image src="/folders/website-base.svg" alt="" fill sizes="(min-width: 768px) 200px, 94px" className="object-fill" />
          <div className="absolute inset-x-0 bottom-0 top-[22.17%] bg-[linear-gradient(180deg,#343434_0%,#232323_59.63%,#000000_100%)]" />
          <div className="pointer-events-none absolute bottom-[14.69%] left-[-6.25%] h-[37.92%] w-[112.5%] mix-blend-overlay">
            <Image src="/folders/website-overlay.svg" alt="" fill sizes="(min-width: 768px) 225px, 106px" className="object-fill" />
          </div>
        </>
      ) : (
        <Image src={folderAssets[color]} alt="" fill sizes="(min-width: 768px) 200px, 94px" className="object-fill" />
      )}
    </div>
  )
}

export type { FolderColor }
