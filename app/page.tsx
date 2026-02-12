"use client"

import { useEffect, useState } from "react"

import { FolderTileLink } from "@/components/studio/folder-tile-link"
import { StudioFrame } from "@/components/studio/studio-frame"
import { homeFolderTiles } from "@/lib/studio-data"

export default function HomePage() {
  const [folders, setFolders] = useState(homeFolderTiles)

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/cms/public", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) return null
        return response.json() as Promise<{ homeFolderTiles?: typeof homeFolderTiles }>
      })
      .then((payload) => {
        if (payload?.homeFolderTiles?.length) {
          setFolders(payload.homeFolderTiles)
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  return (
    <StudioFrame navOverride="home">
      <main className="flex h-full items-center justify-center px-4">
        <section className="grid grid-cols-2 gap-x-7 gap-y-8 sm:grid-cols-3 sm:gap-x-[50px] sm:gap-y-[50px]">
          {folders.map((folder) => (
            <FolderTileLink key={folder.href} folder={folder} />
          ))}
        </section>
      </main>
    </StudioFrame>
  )
}
