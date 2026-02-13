"use client"

import Link from "next/link"
import { useCallback, useState } from "react"

import { trackCmsClick } from "@/lib/track-click"
import { type FolderTile } from "@/lib/studio-data"

import { FolderIcon } from "./folder-icon"
import { RandomizedLabel } from "./randomized-label"

type FolderTileLinkProps = {
  folder: FolderTile
}

export function FolderTileLink({ folder }: FolderTileLinkProps) {
  const [triggerKey, setTriggerKey] = useState(0)

  const triggerLabelAnimation = useCallback(() => {
    setTriggerKey((value) => value + 1)
  }, [])

  return (
    <Link
      href={folder.href}
      className="group flex flex-col items-center text-center"
      onMouseEnter={triggerLabelAnimation}
      onFocus={triggerLabelAnimation}
      onClick={() => {
        trackCmsClick({ source: "folder", label: folder.label, href: folder.href })
      }}
    >
      <FolderIcon color={folder.color} className="h-[76px] w-[92px]" />
      <RandomizedLabel
        text={folder.label}
        triggerKey={triggerKey}
        className="mt-[10px] font-mono text-[12px] tracking-[-0.02em] text-[#3c3c3c]"
      />
    </Link>
  )
}
