"use client"

import { useEffect, useState } from "react"

export function FoundersSlotPill({ initialSlots }: { initialSlots: number }) {
  const [slotsLeft, setSlotsLeft] = useState(initialSlots)

  const fetchSlots = () => {
    fetch("/api/founders/slots")
      .then((res) => res.ok ? res.json() : null)
      .then((data: { slotsLeft?: number } | null) => {
        if (typeof data?.slotsLeft === "number" && data.slotsLeft >= 0) {
          setSlotsLeft(data.slotsLeft)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  useEffect(() => {
    const onFocus = () => fetchSlots()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  return (
    <div className="fixed bottom-[max(18px,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center pointer-events-none">
      <div className="inline-flex items-center justify-center gap-1.5 rounded-[70px] bg-[#EBEBEB] px-2 py-1.5 pointer-events-auto">
        <span className="founders-dot-pulse size-[9px] shrink-0 rounded-full bg-[#2067FF]/70" aria-hidden />
        <span className="text-center text-sm font-medium text-[#767676] sm:text-base">
          {slotsLeft} founder{slotsLeft === 1 ? "" : "s"} slot left
        </span>
      </div>
    </div>
  )
}
