"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { getAnalyticsSessionId, sendAnalyticsEvent } from "@/lib/analytics-client"

function resolveLinkInfo(href: string) {
  const trimmed = href.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("javascript:")) return null
  if (trimmed.startsWith("#")) {
    return {
      href: trimmed,
      isExternal: false,
      targetHost: window.location.hostname.toLowerCase(),
    }
  }

  try {
    const target = new URL(trimmed, window.location.origin)
    return {
      href: target.href,
      isExternal: target.origin !== window.location.origin,
      targetHost: target.hostname.toLowerCase(),
    }
  } catch {
    return {
      href: trimmed,
      isExternal: trimmed.startsWith("mailto:") || trimmed.startsWith("tel:"),
      targetHost: "",
    }
  }
}

function flushItemDurations(
  itemVisibleSince: Map<string, number>,
  itemVisibleTotals: Map<string, number>,
  itemMeta: Map<string, { itemId: string; itemType: string; label: string }>,
) {
  const now = Date.now()

  for (const [key, since] of itemVisibleSince.entries()) {
    const current = itemVisibleTotals.get(key) ?? 0
    itemVisibleTotals.set(key, current + Math.max(0, now - since))
  }

  itemVisibleSince.clear()

  for (const [key, durationMs] of itemVisibleTotals.entries()) {
    if (durationMs < 800) continue
    const meta = itemMeta.get(key)
    if (!meta) continue

    sendAnalyticsEvent({
      eventName: "gallery_item_view_time",
      source: "gallery",
      sourceContext: "gallery-visibility",
      label: meta.label,
      itemId: meta.itemId,
      itemType: meta.itemType,
      durationMs,
    })
  }

  itemVisibleTotals.clear()
}

export function SiteAnalytics() {
  const pathname = usePathname()

  const sessionIdRef = useRef("")
  const pageStartMsRef = useRef(0)
  const maxScrollDepthRef = useRef(0)
  const scrollMarksRef = useRef(new Set<number>())

  const seenSectionsRef = useRef(new Set<string>())
  const seenItemsRef = useRef(new Set<string>())
  const previousPathRef = useRef("")
  const itemVisibleSinceRef = useRef(new Map<string, number>())
  const itemVisibleTotalsRef = useRef(new Map<string, number>())
  const itemMetaRef = useRef(new Map<string, { itemId: string; itemType: string; label: string }>())

  useEffect(() => {
    sessionIdRef.current = getAnalyticsSessionId()
  }, [])

  useEffect(() => {
    if (pathname.startsWith("/admin")) return

    pageStartMsRef.current = Date.now()
    maxScrollDepthRef.current = 0
    scrollMarksRef.current.clear()
    seenSectionsRef.current.clear()
    seenItemsRef.current.clear()
    itemVisibleSinceRef.current.clear()
    itemVisibleTotalsRef.current.clear()
    itemMetaRef.current.clear()

    sendAnalyticsEvent({
      eventName: "page_view",
      source: "other",
      sourceContext: "page",
      path: pathname,
      sessionId: sessionIdRef.current,
    })

    if (previousPathRef.current && previousPathRef.current !== pathname) {
      sendAnalyticsEvent({
        eventName: "route_change",
        source: "other",
        sourceContext: "route",
        label: `${previousPathRef.current} -> ${pathname}`,
        href: pathname,
        path: pathname,
        sessionId: sessionIdRef.current,
      })
    }

    previousPathRef.current = pathname

    if (pathname === "/") {
      sendAnalyticsEvent({
        eventName: "funnel_step",
        source: "other",
        sourceContext: "funnel",
        label: "landing",
        path: pathname,
        sessionId: sessionIdRef.current,
      })
    }

    if (/^\/(apps|website|sites|labs)(\/|$)/.test(pathname)) {
      sendAnalyticsEvent({
        eventName: "funnel_step",
        source: "other",
        sourceContext: "funnel",
        label: "case-study-view",
        path: pathname,
        sessionId: sessionIdRef.current,
      })
    }

    const onScroll = () => {
      const root = document.documentElement
      const scrolled = window.scrollY
      const trackable = Math.max(1, root.scrollHeight - window.innerHeight)
      const depth = Math.min(100, Math.round((scrolled / trackable) * 100))
      if (depth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = depth
      }

      for (const mark of [25, 50, 75, 100]) {
        if (depth >= mark && !scrollMarksRef.current.has(mark)) {
          scrollMarksRef.current.add(mark)
          sendAnalyticsEvent({
            eventName: "scroll_depth",
            source: "scroll",
            sourceContext: "page-scroll",
            path: pathname,
            value: mark,
            sessionId: sessionIdRef.current,
          })
        }
      }
    }

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href") || ""
      const linkInfo = resolveLinkInfo(href)
      if (!linkInfo) return

      const explicitSource = anchor.getAttribute("data-analytics-source") || ""
      const section = anchor.closest("[data-analytics-section]")?.getAttribute("data-analytics-section") || ""
      const sourceContext = explicitSource || section || "link"
      const label = (anchor.textContent || anchor.getAttribute("aria-label") || linkInfo.href).trim().slice(0, 180)
      const isAutoTrackedAlready = anchor.hasAttribute("data-analytics-source") || anchor.hasAttribute("data-analytics-item-id")

      if (!isAutoTrackedAlready) {
        sendAnalyticsEvent({
          eventName: "link_click",
          source: linkInfo.isExternal ? "outbound" : "other",
          sourceContext,
          section,
          label,
          href: linkInfo.href,
          path: pathname,
          sessionId: sessionIdRef.current,
          itemType: linkInfo.isExternal ? "external-link" : "internal-link",
        })
      }

      if (!linkInfo.isExternal) return

      sendAnalyticsEvent({
        eventName: "outbound_click",
        source: "outbound",
        sourceContext,
        section,
        label,
        href: linkInfo.href,
        path: pathname,
        sessionId: sessionIdRef.current,
        itemType: linkInfo.targetHost,
      })

      if (linkInfo.href.startsWith("mailto:") || linkInfo.href.includes("cal.com")) {
        sendAnalyticsEvent({
          eventName: "funnel_step",
          source: "outbound",
          sourceContext: "funnel",
          label: "contact-click",
          href: linkInfo.href,
          path: pathname,
          sessionId: sessionIdRef.current,
        })
      }
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.55) continue
          const element = entry.target as HTMLElement
          const section = element.dataset.analyticsSection
          if (!section) continue

          const key = `${pathname}::${section}`
          if (seenSectionsRef.current.has(key)) continue
          seenSectionsRef.current.add(key)

          sendAnalyticsEvent({
            eventName: "section_view",
            source: "section",
            sourceContext: section,
            section,
            label: section,
            path: pathname,
            sessionId: sessionIdRef.current,
          })

          if (section === "contact") {
            sendAnalyticsEvent({
              eventName: "funnel_step",
              source: "section",
              sourceContext: "funnel",
              label: "contact-section-view",
              path: pathname,
              sessionId: sessionIdRef.current,
            })
          }
        }
      },
      { threshold: [0.55] },
    )

    const itemObserver = new IntersectionObserver(
      (entries) => {
        const now = Date.now()
        for (const entry of entries) {
          const element = entry.target as HTMLElement
          const itemId = element.dataset.analyticsItemId || ""
          const itemType = element.dataset.analyticsItemType || "gallery"
          const label = element.dataset.analyticsItemLabel || itemId
          if (!itemId) continue

          const key = `${itemType}::${itemId}`
          itemMetaRef.current.set(key, { itemId, itemType, label })

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            if (!seenItemsRef.current.has(key)) {
              seenItemsRef.current.add(key)
              sendAnalyticsEvent({
                eventName: "gallery_item_open",
                source: "gallery",
                sourceContext: `${itemType}-gallery`,
                label,
                itemId,
                itemType,
                path: pathname,
                sessionId: sessionIdRef.current,
              })
            }

            if (!itemVisibleSinceRef.current.has(key)) {
              itemVisibleSinceRef.current.set(key, now)
            }
            continue
          }

          const visibleSince = itemVisibleSinceRef.current.get(key)
          if (visibleSince) {
            const total = itemVisibleTotalsRef.current.get(key) ?? 0
            itemVisibleTotalsRef.current.set(key, total + Math.max(0, now - visibleSince))
            itemVisibleSinceRef.current.delete(key)
          }
        }
      },
      { threshold: [0.6] },
    )

    const sectionElements = Array.from(document.querySelectorAll<HTMLElement>("[data-analytics-section]"))
    for (const element of sectionElements) {
      sectionObserver.observe(element)
    }

    const itemElements = Array.from(document.querySelectorAll<HTMLElement>("[data-analytics-item-id]"))
    for (const element of itemElements) {
      itemObserver.observe(element)
    }

    const heartbeatId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      sendAnalyticsEvent({
        eventName: "page_heartbeat",
        source: "other",
        sourceContext: "realtime",
        path: pathname,
        sessionId: sessionIdRef.current,
      })
    }, 15000)

    let lcpValue = 0
    let clsValue = 0
    let inpValue = 0

    const observers: PerformanceObserver[] = []

    if (typeof PerformanceObserver !== "undefined") {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            lcpValue = Math.max(lcpValue, entry.startTime)
          }
        })
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
        observers.push(lcpObserver)
      } catch {
        // No-op.
      }

      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value ?? 0
            }
          }
        })
        clsObserver.observe({ type: "layout-shift", buffered: true })
        observers.push(clsObserver)
      } catch {
        // No-op.
      }

      try {
        const inpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { duration?: number }>) {
            inpValue = Math.max(inpValue, entry.duration ?? 0)
          }
        })
        inpObserver.observe({ type: "event", buffered: true })
        observers.push(inpObserver)
      } catch {
        // No-op.
      }

      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { processingStart?: number; startTime: number }>) {
            const delay = (entry.processingStart ?? entry.startTime) - entry.startTime
            inpValue = Math.max(inpValue, delay)
          }
        })
        fidObserver.observe({ type: "first-input", buffered: true })
        observers.push(fidObserver)
      } catch {
        // No-op.
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    document.addEventListener("click", onDocumentClick, true)

    const flushPage = () => {
      flushItemDurations(itemVisibleSinceRef.current, itemVisibleTotalsRef.current, itemMetaRef.current)

      sendAnalyticsEvent({
        eventName: "page_dwell",
        source: "other",
        sourceContext: "engagement",
        path: pathname,
        durationMs: Math.max(0, Date.now() - pageStartMsRef.current),
        value: maxScrollDepthRef.current,
        sessionId: sessionIdRef.current,
      })

      if (lcpValue > 0) {
        sendAnalyticsEvent({
          eventName: "web_vital",
          source: "performance",
          sourceContext: "web-vitals",
          path: pathname,
          value: Number(lcpValue.toFixed(2)),
          sessionId: sessionIdRef.current,
          meta: { metricName: "LCP" },
        })
      }

      if (inpValue > 0) {
        sendAnalyticsEvent({
          eventName: "web_vital",
          source: "performance",
          sourceContext: "web-vitals",
          path: pathname,
          value: Number(inpValue.toFixed(2)),
          sessionId: sessionIdRef.current,
          meta: { metricName: "INP" },
        })
      }

      if (clsValue > 0) {
        sendAnalyticsEvent({
          eventName: "web_vital",
          source: "performance",
          sourceContext: "web-vitals",
          path: pathname,
          value: Number(clsValue.toFixed(4)),
          sessionId: sessionIdRef.current,
          meta: { metricName: "CLS" },
        })
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPage()
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      document.removeEventListener("click", onDocumentClick, true)
      window.removeEventListener("scroll", onScroll)
      window.clearInterval(heartbeatId)
      sectionObserver.disconnect()
      itemObserver.disconnect()
      for (const observer of observers) {
        observer.disconnect()
      }
      flushPage()
    }
  }, [pathname])

  return null
}
