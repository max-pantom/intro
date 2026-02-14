"use client"

import { useEffect, type ReactNode } from "react"

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

  return children
}
