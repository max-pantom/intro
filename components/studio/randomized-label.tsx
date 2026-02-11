"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#[]{}/*+?!_-"

type RandomizedLabelProps = {
  text: string
  className?: string
  triggerKey?: number
}

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "#"
}

export function RandomizedLabel({ text, className, triggerKey = 0 }: RandomizedLabelProps) {
  const [displayText, setDisplayText] = useState(text)
  const intervalRef = useRef<number | null>(null)
  const reducedMotionRef = useRef(false)

  const stopAnimation = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const runAnimation = useCallback(() => {
    stopAnimation()

    if (reducedMotionRef.current) {
      setDisplayText(text)
      return
    }

    let frame = 0
    const totalFrames = Math.max(10, text.replaceAll(" ", "").length * 3)

    intervalRef.current = window.setInterval(() => {
      frame += 1
      const progress = frame / totalFrames
      const revealedCount = Math.floor(progress * text.length)

      const nextText = text
        .split("")
        .map((char, index) => {
          if (char === " ") return " "
          if (index < revealedCount) return text[index] ?? char
          return randomGlyph()
        })
        .join("")

      setDisplayText(nextText)

      if (frame >= totalFrames) {
        stopAnimation()
        setDisplayText(text)
      }
    }, 24)
  }, [stopAnimation, text])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncPreference = () => {
      reducedMotionRef.current = mediaQuery.matches
      if (mediaQuery.matches) {
        stopAnimation()
        setDisplayText(text)
      }
    }

    syncPreference()
    mediaQuery.addEventListener("change", syncPreference)

    return () => {
      mediaQuery.removeEventListener("change", syncPreference)
    }
  }, [stopAnimation, text])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      runAnimation()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      stopAnimation()
    }
  }, [runAnimation, stopAnimation, triggerKey])

  return (
    <span className={className} aria-label={text}>
      {displayText}
    </span>
  )
}
