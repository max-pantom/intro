"use client"

import { useEffect, useState } from "react"

import { FolderTileLink } from "@/components/studio/folder-tile-link"
import { StudioFrame } from "@/components/studio/studio-frame"
import { fetchCmsPublicData } from "@/lib/cms-public-client"
import { homeFolderTiles } from "@/lib/studio-data"

export default function HomePage() {
  const [folders, setFolders] = useState(homeFolderTiles)

  useEffect(() => {
    let isMounted = true

    void fetchCmsPublicData().then((payload) => {
      if (!isMounted) return
      if (payload?.homeFolderTiles?.length) {
        setFolders(payload.homeFolderTiles)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <StudioFrame navOverride="home">
      <main className="flex h-full items-center justify-center px-4" data-analytics-section="hero">
        <section className="grid grid-cols-2 gap-x-7 gap-y-8 sm:grid-cols-3 sm:gap-x-[50px] sm:gap-y-[50px]" data-analytics-section="home-folders">
          {folders.map((folder) => (
            <FolderTileLink key={folder.href} folder={folder} />
          ))}
        </section>
      </main>
    </StudioFrame>
  )
}
