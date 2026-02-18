"use client"

import { useEffect, type ReactNode } from "react"

import { StudioFrame } from "@/components/studio/studio-frame"

type AdminLayoutProps = {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  useEffect(() => {
    return () => {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/admin/logout")
        return
      }

      void fetch("/api/admin/logout", {
        method: "POST",
        keepalive: true,
      })
    }
  }, [])

  return (
    <StudioFrame
      navOverride="home"
      headerClassName="px-4 md:px-6"
      navClassName="bg-white/72 md:bg-transparent"
      backgroundColor="#efefef"
    >
      {children}
    </StudioFrame>
  )
}
