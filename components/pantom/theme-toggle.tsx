"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "pantom-theme"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light"
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    return stored ?? (systemDark ? "dark" : "light")
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"

    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-[#1f1a16]/25 px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition hover:-translate-y-0.5 hover:border-[#1f1a16]/60 dark:border-[#e8dfd3]/25 dark:hover:border-[#e8dfd3]/60"
      aria-label="Toggle color mode"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  )
}
