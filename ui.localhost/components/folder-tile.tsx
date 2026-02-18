"use client"

import Link from "next/link"
import { useState } from "react"
import { type ComponentProps } from "react"

import { FolderIcon, type FolderColor } from "@/components/studio/folder-icon"
import { RandomizedLabel } from "@/components/studio/randomized-label"
import { cn } from "@/lib/utils"

type UiLocalhostFolderTileProps = {
  label: string
  color: FolderColor
  href?: ComponentProps<typeof Link>["href"]
} & Omit<ComponentProps<typeof Link>, "href" | "children">

export function UiLocalhostFolderTile({
  label,
  color,
  href = "#",
  className,
  ...props
}: UiLocalhostFolderTileProps) {
  const [triggerKey, setTriggerKey] = useState(0)

  const content = (
    <>
      <FolderIcon color={color} className="h-[76px] w-[92px]" />
      <RandomizedLabel
        text={label}
        triggerKey={triggerKey}
        className="mt-[10px] font-mono text-[12px] tracking-[-0.02em] text-[#3c3c3c]"
      />
    </>
  )

  return (
    <Link
      href={href}
      onMouseEnter={() => setTriggerKey((value) => value + 1)}
      onFocus={() => setTriggerKey((value) => value + 1)}
      className={cn("group inline-flex flex-col items-center text-center", className)}
      {...props}
    >
      {content}
    </Link>
  )
}
