"use client"

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"

import { defaultCmsPublicData, type CmsPublicData, type CmsToolProject, type GalleryKey } from "@/lib/cms-types"

type Status = {
  tone: "idle" | "success" | "error"
  message: string
}

type ContentRow = {
  id: string
  index: number
  key: string
  label: string
  type: "nav" | "folder"
  value: string
}

function cloneDefaults(): CmsPublicData {
  return {
    navItems: defaultCmsPublicData.navItems.map((item) => ({ ...item })),
    homeFolderTiles: defaultCmsPublicData.homeFolderTiles.map((item) => ({ ...item })),
    galleries: {
      apps: [...defaultCmsPublicData.galleries.apps],
      website: [...defaultCmsPublicData.galleries.website],
      labs: [...defaultCmsPublicData.galleries.labs],
      tools: [...defaultCmsPublicData.galleries.tools],
    },
    foundersSlotsLeft: defaultCmsPublicData.foundersSlotsLeft,
    toolsProjects: defaultCmsPublicData.toolsProjects.map((project) => ({
      ...project,
      highlightUrls: [...project.highlightUrls],
    })),
  }
}

const galleryOptions: GalleryKey[] = ["apps", "website", "labs", "tools"]

function buildEmptyToolProject(index: number): CmsToolProject {
  return {
    id: `tool-project-${Date.now()}-${index + 1}`,
    name: `UNTITLED PROJECT ${index + 1}`,
    tagline: "",
    description: "",
    year: `${new Date().getFullYear()}`,
    status: "ACTIVE",
    linkLabel: "",
    linkHref: "",
    githubHref: "",
    instagramHref: "",
    demoUrl: "",
    highlightUrls: [],
  }
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [cmsData, setCmsData] = useState<CmsPublicData>(cloneDefaults)
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [activeGallery, setActiveGallery] = useState<GalleryKey>("apps")
  const [galleryFiles, setGalleryFiles] = useState<string[]>([])
  const [toolsProjectFiles, setToolsProjectFiles] = useState<string[]>([])
  const [hoveredPreviewPath, setHoveredPreviewPath] = useState<string | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [checkedRows, setCheckedRows] = useState<string[]>([])
  const [toolProjectPicker, setToolProjectPicker] = useState<Record<number, string>>({})
  const [emailsOpen, setEmailsOpen] = useState(false)
  const [sendStartEmail, setSendStartEmail] = useState("")
  const [sendStartFirstName, setSendStartFirstName] = useState("")
  const [sendStartStatus, setSendStartStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [sendStartError, setSendStartError] = useState<string | null>(null)

  const statusColor = useMemo(() => {
    if (status.tone === "error") return "text-[#a9182d]"
    if (status.tone === "success") return "text-[#126640]"
    return "text-[#777777]"
  }, [status.tone])

  const contentRows = useMemo<ContentRow[]>(() => {
    const navRows = cmsData.navItems.map((item, index) => {
      return {
        id: `nav-${item.key}`,
        index,
        key: item.key,
        label: item.label,
        type: "nav" as const,
        value: item.href,
      }
    })

    const folderRows = cmsData.homeFolderTiles.map((item, index) => {
      return {
        id: `folder-${item.color}-${index}`,
        index,
        key: item.color,
        label: item.label,
        type: "folder" as const,
        value: item.href,
      }
    })

    return [...navRows, ...folderRows]
  }, [cmsData.homeFolderTiles, cmsData.navItems])

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return contentRows

    return contentRows.filter((row) => {
      return [row.label, row.value, row.key, row.type].some((field) => field.toLowerCase().includes(query))
    })
  }, [contentRows, searchQuery])

  const toggleCheckedRow = (id: string) => {
    setCheckedRows((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      return [...current, id]
    })
  }

  const loadAdminData = async () => {
    setIsLoading(true)
    const response = await fetch("/api/admin/data", { cache: "no-store" })
    if (response.status === 401) {
      setIsAuthenticated(false)
      setIsLoading(false)
      return
    }

    if (!response.ok) {
      setStatus({ tone: "error", message: "Could not load CMS data." })
      setIsLoading(false)
      return
    }

    const payload = (await response.json()) as CmsPublicData
    setCmsData(payload)
    setIsAuthenticated(true)
    setIsLoading(false)
  }

  const fetchGalleryFiles = useCallback(async (gallery: GalleryKey) => {
    const response = await fetch(`/api/admin/images?gallery=${gallery}`, { cache: "no-store" })
    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as { files?: string[] }
    return Array.isArray(payload.files) ? payload.files : []
  }, [])

  const loadGalleryFiles = useCallback(async (gallery: GalleryKey) => {
    const files = await fetchGalleryFiles(gallery)
    setGalleryFiles(files)
  }, [fetchGalleryFiles])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAdminData().catch(() => {
        setIsLoading(false)
        setStatus({ tone: "error", message: "Could not connect to CMS API." })
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const timeoutId = window.setTimeout(() => {
      Promise.all([loadGalleryFiles(activeGallery), fetchGalleryFiles("tools")])
        .then(([, files]) => setToolsProjectFiles(files))
        .catch(() => {
          setGalleryFiles([])
          setToolsProjectFiles([])
        })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [activeGallery, fetchGalleryFiles, isAuthenticated, loadGalleryFiles])

  const login = async () => {
    setStatus({ tone: "idle", message: "" })
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setStatus({ tone: "error", message: payload?.error ?? "Login failed." })
      return
    }

    setPassword("")
    setStatus({ tone: "success", message: "Logged in." })
    await loadAdminData()
  }

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    setIsAuthenticated(false)
    setStatus({ tone: "idle", message: "Logged out." })
  }

  const addGalleryImage = (path: string) => {
    const current = cmsData.galleries[activeGallery]
    if (current.includes(path)) return

    setCmsData({
      ...cmsData,
      galleries: {
        ...cmsData.galleries,
        [activeGallery]: [...current, path],
      },
    })
  }

  const removeGalleryImage = (path: string) => {
    const current = cmsData.galleries[activeGallery]
    setCmsData({
      ...cmsData,
      galleries: {
        ...cmsData.galleries,
        [activeGallery]: current.filter((item) => item !== path),
      },
    })
  }

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    const current = [...cmsData.galleries[activeGallery]]
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= current.length) return

    const swap = current[nextIndex]
    current[nextIndex] = current[index] as string
    current[index] = swap as string

    setCmsData({
      ...cmsData,
      galleries: {
        ...cmsData.galleries,
        [activeGallery]: current,
      },
    })
  }

  const moveGalleryImageToIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    const current = [...cmsData.galleries[activeGallery]]
    if (fromIndex < 0 || fromIndex >= current.length) return
    if (toIndex < 0 || toIndex >= current.length) return

    const [moved] = current.splice(fromIndex, 1)
    if (!moved) return
    current.splice(toIndex, 0, moved)

    setCmsData({
      ...cmsData,
      galleries: {
        ...cmsData.galleries,
        [activeGallery]: current,
      },
    })
  }

  const uploadGalleryImage = async (file: File) => {
    const formData = new FormData()
    formData.set("gallery", activeGallery)
    formData.set("file", file)

    const response = await fetch("/api/admin/images", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      setStatus({ tone: "error", message: "Image upload failed." })
      return
    }

    const payload = (await response.json()) as { path?: string }
    if (payload.path) {
      addGalleryImage(payload.path)
      await loadGalleryFiles(activeGallery)
      setStatus({ tone: "success", message: "Image uploaded. Click save to publish." })
    }
  }

  const uploadToolProjectImage = async (index: number, file: File) => {
    const formData = new FormData()
    formData.set("gallery", "tools")
    formData.set("file", file)

    const response = await fetch("/api/admin/images", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      setStatus({ tone: "error", message: "Project image upload failed." })
      return
    }

    const payload = (await response.json()) as { path?: string }
    if (!payload.path) return

    updateToolProjectText(index, "demoUrl", payload.path)
    updateToolProjectHighlights(index, Array.from(new Set([...(cmsData.toolsProjects[index]?.highlightUrls ?? []), payload.path])))

    const files = await fetchGalleryFiles("tools")
    setToolsProjectFiles(files)
    if (activeGallery === "tools") {
      setGalleryFiles(files)
      addGalleryImage(payload.path)
    }

    setStatus({ tone: "success", message: "Project image uploaded. Click save to publish." })
  }

  const applyToolProjectImage = (index: number, path: string, mode: "demo" | "highlight") => {
    if (!path) return

    if (mode === "demo") {
      updateToolProjectText(index, "demoUrl", path)
      return
    }

    const current = cmsData.toolsProjects[index]?.highlightUrls ?? []
    updateToolProjectHighlights(index, Array.from(new Set([...current, path])))
  }

  const autoFillGallery = () => {
    const sorted = [...galleryFiles].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    setCmsData({
      ...cmsData,
      galleries: {
        ...cmsData.galleries,
        [activeGallery]: sorted,
      },
    })
    setStatus({ tone: "success", message: "Auto-filled from available files. Click save to publish." })
  }

  const sortSelectedGallery = () => {
    const sorted = [...cmsData.galleries[activeGallery]].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    setCmsData({
      ...cmsData,
      galleries: {
        ...cmsData.galleries,
        [activeGallery]: sorted,
      },
    })
    setStatus({ tone: "success", message: "Sorted selected images. Click save to publish." })
  }

  const updateToolProjectText = (
    index: number,
    key: Exclude<keyof CmsToolProject, "highlightUrls">,
    value: string,
  ) => {
    const next = [...cmsData.toolsProjects]
    const current = next[index]
    if (!current) return

    next[index] = { ...current, [key]: value }
    setCmsData({ ...cmsData, toolsProjects: next })
  }

  const updateToolProjectHighlights = (index: number, highlightUrls: string[]) => {
    const next = [...cmsData.toolsProjects]
    const current = next[index]
    if (!current) return

    next[index] = { ...current, highlightUrls }
    setCmsData({ ...cmsData, toolsProjects: next })
  }

  const addToolProject = () => {
    setCmsData({
      ...cmsData,
      toolsProjects: [...cmsData.toolsProjects, buildEmptyToolProject(cmsData.toolsProjects.length)],
    })
    setStatus({ tone: "success", message: "New tools project added. Click save to publish." })
  }

  const removeToolProject = (index: number) => {
    const next = cmsData.toolsProjects.filter((_, itemIndex) => itemIndex !== index)
    setCmsData({
      ...cmsData,
      toolsProjects: next.length > 0 ? next : [buildEmptyToolProject(0)],
    })
    setStatus({ tone: "success", message: "Tools project removed. Click save to publish." })
  }

  const moveToolProject = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= cmsData.toolsProjects.length) return

    const next = [...cmsData.toolsProjects]
    const swap = next[nextIndex]
    next[nextIndex] = next[index] as CmsToolProject
    next[index] = swap as CmsToolProject
    setCmsData({ ...cmsData, toolsProjects: next })
  }

  const handlePreviewMove = (event: MouseEvent, path: string) => {
    setHoveredPreviewPath(path)
    setPreviewPosition({ x: event.clientX + 16, y: event.clientY + 18 })
  }

  const sendStartEmailAction = async () => {
    setSendStartStatus("sending")
    setSendStartError(null)

    const res = await fetch("/api/admin/send-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: sendStartEmail,
        firstName: sendStartFirstName || undefined,
      }),
    })

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setSendStartError(data?.error ?? "Failed to send")
      setSendStartStatus("error")
      return
    }

    setSendStartStatus("sent")
    setSendStartEmail("")
    setSendStartFirstName("")
    setTimeout(() => setSendStartStatus("idle"), 3000)
  }

  const save = async () => {
    const response = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cmsData),
    })

    if (!response.ok) {
      setStatus({ tone: "error", message: "Could not save CMS data." })
      return
    }

    const payload = (await response.json()) as CmsPublicData
    setCmsData(payload)
    setStatus({ tone: "success", message: "Saved. Public pages now use these values." })
  }

  if (isLoading) {
    return (
      <main className="pantom-scrollbar flex h-dvh items-center justify-center overflow-y-auto bg-[#efefef] px-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[#7a7a7a]">Loading CMS...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="pantom-scrollbar flex h-dvh overflow-y-auto items-center justify-center bg-[#efefef] px-4 py-8">
        <section className="w-full max-w-[700px] border border-[#d7d7d7] bg-[#f4f4f4] p-4">
          <div className="grid gap-3 sm:grid-cols-[230px_1fr]">
            <div className="flex items-center gap-3 border border-[#dcdcdc] bg-[#ececec] px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f60d8] text-[12px] font-semibold text-white">MG</div>
              <div>
                <p className="font-semibold text-[18px] leading-none text-[#595959]">CMS</p>
                <p className="text-[13px] text-[#9a9a9a]">admin@pantom.com</p>
              </div>
            </div>

            <div className="border border-[#dcdcdc] bg-[#ececec] px-3 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9a9a9a]">Search</p>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") login()
                }}
                placeholder="Password"
                className="mt-2 h-9 w-full border border-[#d3d3d3] bg-[#f9f9f9] px-3 text-[13px] text-[#4b4b4b] outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={login}
                  className="h-8 border border-[#c6c6c6] bg-[#f9f9f9] px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#666666]"
                >
                  Login
                </button>
                <p className={`text-[11px] ${statusColor}`}>{status.message || "Set CMS_ADMIN_PASSWORD in env."}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="pantom-scrollbar h-dvh overflow-y-auto bg-[#efefef] p-2 sm:p-3">
      <section className="mx-auto w-full max-w-[1420px]">
        <div className="grid gap-3 lg:grid-cols-[230px_1fr]">
          <div className="flex items-center gap-3 border border-[#dbdbdb] bg-[#ececec] px-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f60d8] text-[12px] font-semibold text-white">MG</div>
            <div>
              <p className="font-semibold text-[24px] leading-none text-[#6c6c6c]">Metagravity</p>
              <p className="text-[13px] text-[#9d9d9d]">metagravity@pantom.com</p>
            </div>
          </div>

          <div className="border border-[#dbdbdb] bg-[#ececec] px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="SEARCH"
                className="h-9 min-w-[220px] flex-1 border border-[#d4d4d4] bg-[#f2f2f2] px-3 text-[12px] font-semibold tracking-[0.04em] text-[#6f6f6f] outline-none placeholder:text-[#9f9f9f]"
              />
              <button
                type="button"
                onClick={save}
                className="h-9 border border-[#c9c9c9] bg-[#f7f7f7] px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
              >
                Save
              </button>
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-2 border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
              >
                <Image src="/globe.svg" alt="Site" width={14} height={14} className="h-[14px] w-[14px]" />
                Site
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmailsOpen((o) => !o)}
                  className={`inline-flex h-9 items-center border px-4 text-[11px] font-semibold uppercase tracking-[0.08em] ${emailsOpen ? "border-[#b9b9b9] bg-[#ebebeb] text-[#3f3f3f]" : "border-[#c9c9c9] bg-[#f7f7f7] text-[#636363]"}`}
                >
                  Emails
                </button>
                {emailsOpen ? (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      aria-hidden
                      onClick={() => setEmailsOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[280px] border border-[#d0d0d0] bg-[#f4f4f4] p-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b6b6b]">
                        Send START
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8b8b8b]">
                        Pre-call form link. Logged for audit.
                      </p>
                      <div className="mt-3 space-y-2">
                        <input
                          type="email"
                          value={sendStartEmail}
                          onChange={(e) => setSendStartEmail(e.target.value)}
                          placeholder="person@company.com"
                          className="h-8 w-full border border-[#d4d4d4] bg-white px-2 text-[12px] text-[#4b4b4b] outline-none placeholder:text-[#9f9f9f]"
                        />
                        <input
                          type="text"
                          value={sendStartFirstName}
                          onChange={(e) => setSendStartFirstName(e.target.value)}
                          placeholder="First name (optional)"
                          className="h-8 w-full border border-[#d4d4d4] bg-white px-2 text-[12px] text-[#4b4b4b] outline-none placeholder:text-[#9f9f9f]"
                        />
                        <button
                          type="button"
                          onClick={sendStartEmailAction}
                          disabled={sendStartStatus === "sending" || !sendStartEmail.trim()}
                          className="h-8 border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendStartStatus === "sending" ? "Sending..." : sendStartStatus === "sent" ? "Sent" : "Send"}
                        </button>
                        {sendStartError ? (
                          <p className="text-[11px] text-[#a9182d]">{sendStartError}</p>
                        ) : null}
                        {sendStartStatus === "sent" ? (
                          <p className="text-[11px] text-[#126640]">Sent. Log recorded.</p>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
              <a
                href="/admin/analytics"
                className="inline-flex h-9 items-center border border-[#c9c9c9] bg-[#f7f7f7] px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
              >
                Analytics
              </a>
              <button
                type="button"
                onClick={logout}
                className="h-9 border border-[#c9c9c9] bg-[#f7f7f7] px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
              >
                Logout
              </button>
            </div>
            <p className={`mt-2 text-[11px] ${statusColor}`}>{status.message || "Edit rows below and save to publish."}</p>
          </div>
        </div>

        <section className="mt-3 border border-[#dbdbdb] bg-[#ececec] px-3 py-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Founders</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-[#4f4f4f]">
              <span className="font-semibold">Slots left</span>
              <input
                type="number"
                min={0}
                max={999}
                value={cmsData.foundersSlotsLeft}
                onChange={(e) => {
                  const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10)
                  const n = Number.isFinite(v) && v >= 0 ? Math.min(999, v) : 0
                  setCmsData({ ...cmsData, foundersSlotsLeft: n })
                }}
                className="h-8 w-16 border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-center text-[12px] font-semibold text-[#414141] outline-none"
              />
            </label>
            <span className="text-[11px] text-[#8b8b8b]">Shown on /founders. Decrements when a brief is submitted.</span>
          </div>
        </section>

        <section className="mt-3 overflow-x-auto border border-[#dbdbdb] bg-[#ececec]">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[44px_54px_.8fr_.8fr_1.3fr_2fr] border-b border-[#d9d9d9] bg-[#ebebeb] text-[12px] font-semibold text-[#8b8b8b]">
              <div className="border-r border-[#d9d9d9] px-3 py-3 text-center">#</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3 text-center">Sel</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Type</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Key</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Label</div>
              <div className="px-3 py-3">Href</div>
            </div>

            {filteredRows.map((row, visualIndex) => (
              <div key={row.id} className="grid grid-cols-[44px_54px_.8fr_.8fr_1.3fr_2fr] border-b border-[#dcdcdc] text-[12px] text-[#4f4f4f]">
                <div className="border-r border-[#dedede] px-3 py-3 text-center font-semibold">{visualIndex + 1}</div>
                <div className="border-r border-[#dedede] px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={checkedRows.includes(row.id)}
                    onChange={() => toggleCheckedRow(row.id)}
                    className="h-3.5 w-3.5 accent-black"
                  />
                </div>
                <div className="border-r border-[#dedede] px-3 py-3 font-semibold uppercase text-[#616161]">{row.type}</div>
                <div className="border-r border-[#dedede] px-3 py-3 font-semibold uppercase text-[#616161]">{row.key}</div>
                <div className="border-r border-[#dedede] px-2 py-2">
                  <input
                    value={row.label}
                    onChange={(event) => {
                      if (row.type === "nav") {
                        const next = [...cmsData.navItems]
                        next[row.index] = { ...next[row.index], label: event.target.value }
                        setCmsData({ ...cmsData, navItems: next })
                        return
                      }

                      const next = [...cmsData.homeFolderTiles]
                      next[row.index] = { ...next[row.index], label: event.target.value }
                      setCmsData({ ...cmsData, homeFolderTiles: next })
                    }}
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                </div>
                <div className="px-2 py-2">
                  <input
                    value={row.value}
                    onChange={(event) => {
                      if (row.type === "nav") {
                        const next = [...cmsData.navItems]
                        next[row.index] = { ...next[row.index], href: event.target.value }
                        setCmsData({ ...cmsData, navItems: next })
                        return
                      }

                      const next = [...cmsData.homeFolderTiles]
                      next[row.index] = { ...next[row.index], href: event.target.value }
                      setCmsData({ ...cmsData, homeFolderTiles: next })
                    }}
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-3 border border-[#dbdbdb] bg-[#ececec] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Image Manager</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex border border-[#d0d0d0] bg-[#f4f4f4]">
                {galleryOptions.map((gallery) => (
                  <button
                    key={gallery}
                    type="button"
                    onClick={() => setActiveGallery(gallery)}
                    className={`h-8 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${activeGallery === gallery ? "bg-[#dfdfdf] text-[#3f3f3f]" : "text-[#747474]"}`}
                  >
                    {gallery}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={autoFillGallery}
                className="h-8 border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
              >
                Auto Fill
              </button>
              <button
                type="button"
                onClick={sortSelectedGallery}
                className="h-8 border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
              >
                Sort A-Z
              </button>
              <label className="inline-flex h-8 cursor-pointer items-center border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      uploadGalleryImage(file).catch(() => setStatus({ tone: "error", message: "Image upload failed." }))
                    }
                    event.currentTarget.value = ""
                  }}
                />
              </label>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="border border-[#d7d7d7] bg-[#f1f1f1]">
              <div className="grid grid-cols-[44px_1fr_110px] border-b border-[#d9d9d9] bg-[#ebebeb] text-[12px] font-semibold text-[#8b8b8b]">
                <div className="border-r border-[#d9d9d9] px-3 py-2 text-center">#</div>
                <div className="border-r border-[#d9d9d9] px-3 py-2">Selected ({cmsData.galleries[activeGallery].length})</div>
                <div className="px-3 py-2">Actions</div>
              </div>

              <div className="pantom-scrollbar max-h-[320px] overflow-y-auto">
                {cmsData.galleries[activeGallery].map((path, index) => (
                  <div
                    key={`${path}-${index}`}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (draggedIndex !== null) {
                        moveGalleryImageToIndex(draggedIndex, index)
                      }
                      setDraggedIndex(null)
                    }}
                    className={`grid grid-cols-[44px_1fr_110px] border-b border-[#dfdfdf] text-[11px] text-[#4d4d4d] ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
                    onMouseEnter={(event) => handlePreviewMove(event, path)}
                    onMouseMove={(event) => handlePreviewMove(event, path)}
                    onMouseLeave={() => setHoveredPreviewPath(null)}
                  >
                    <div className="border-r border-[#dfdfdf] px-3 py-2 text-center font-semibold">{index + 1}</div>
                    <div className="truncate border-r border-[#dfdfdf] px-3 py-2">{path}</div>
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <button type="button" onClick={() => moveGalleryImage(index, -1)} className="h-6 w-6 border border-[#cfcfcf] bg-[#f7f7f7] text-[11px]">-</button>
                      <button type="button" onClick={() => moveGalleryImage(index, 1)} className="h-6 w-6 border border-[#cfcfcf] bg-[#f7f7f7] text-[11px]">+</button>
                      <button type="button" onClick={() => removeGalleryImage(path)} className="h-6 w-6 border border-[#cfcfcf] bg-[#f7f7f7] text-[11px]">x</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#d7d7d7] bg-[#f1f1f1]">
              <div className="grid grid-cols-[44px_1fr_80px] border-b border-[#d9d9d9] bg-[#ebebeb] text-[12px] font-semibold text-[#8b8b8b]">
                <div className="border-r border-[#d9d9d9] px-3 py-2 text-center">#</div>
                <div className="border-r border-[#d9d9d9] px-3 py-2">Available ({galleryFiles.length})</div>
                <div className="px-3 py-2">Add</div>
              </div>

              <div className="pantom-scrollbar max-h-[320px] overflow-y-auto">
                {galleryFiles.map((path, index) => {
                  const isSelected = cmsData.galleries[activeGallery].includes(path)
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => addGalleryImage(path)}
                      onMouseEnter={(event) => handlePreviewMove(event, path)}
                      onMouseMove={(event) => handlePreviewMove(event, path)}
                      onMouseLeave={() => setHoveredPreviewPath(null)}
                      disabled={isSelected}
                      className="grid w-full grid-cols-[44px_1fr_80px] border-b border-[#dfdfdf] text-left text-[11px] text-[#4d4d4d] disabled:opacity-45"
                    >
                      <div className="border-r border-[#dfdfdf] px-3 py-2 text-center font-semibold">{index + 1}</div>
                      <div className="truncate border-r border-[#dfdfdf] px-3 py-2">{path}</div>
                      <div className="px-3 py-2 font-semibold">{isSelected ? "ok" : "+"}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 border border-[#dbdbdb] bg-[#ececec] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">
              Tools Projects ({cmsData.toolsProjects.length})
            </p>
            <button
              type="button"
              onClick={addToolProject}
              className="h-8 border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
            >
              Add Project
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            {cmsData.toolsProjects.map((project, index) => (
              <article key={`${project.id}-${index}`} className="border border-[#d8d8d8] bg-[#f5f5f5] p-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfdfdf] pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#747474]">
                    Project {index + 1}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveToolProject(index, -1)}
                      className="h-6 w-6 border border-[#cfcfcf] bg-[#f7f7f7] text-[11px]"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => moveToolProject(index, 1)}
                      className="h-6 w-6 border border-[#cfcfcf] bg-[#f7f7f7] text-[11px]"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeToolProject(index)}
                      className="h-6 w-6 border border-[#cfcfcf] bg-[#f7f7f7] text-[11px]"
                    >
                      x
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <input
                    value={project.name}
                    onChange={(event) => updateToolProjectText(index, "name", event.target.value)}
                    placeholder="Project Name"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.tagline}
                    onChange={(event) => updateToolProjectText(index, "tagline", event.target.value)}
                    placeholder="Tagline"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.status}
                    onChange={(event) => updateToolProjectText(index, "status", event.target.value)}
                    placeholder="Status Badge"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.year}
                    onChange={(event) => updateToolProjectText(index, "year", event.target.value)}
                    placeholder="Year"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.linkLabel}
                    onChange={(event) => updateToolProjectText(index, "linkLabel", event.target.value)}
                    placeholder="Meta Link Label"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.linkHref}
                    onChange={(event) => updateToolProjectText(index, "linkHref", event.target.value)}
                    placeholder="Meta Link Href"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.githubHref}
                    onChange={(event) => updateToolProjectText(index, "githubHref", event.target.value)}
                    placeholder="GitHub Link (optional)"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.instagramHref}
                    onChange={(event) => updateToolProjectText(index, "instagramHref", event.target.value)}
                    placeholder="Instagram Link (optional)"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none"
                  />
                  <input
                    value={project.demoUrl}
                    onChange={(event) => updateToolProjectText(index, "demoUrl", event.target.value)}
                    placeholder="Demo URL (/tools-images/... or Blob URL)"
                    className="h-8 w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 text-[12px] font-semibold text-[#414141] outline-none md:col-span-2"
                  />
                  <div className="flex flex-wrap items-center gap-2 border border-[#d8d8d8] bg-[#f8f8f8] p-2 md:col-span-2">
                    <select
                      value={toolProjectPicker[index] ?? project.demoUrl ?? toolsProjectFiles[0] ?? ""}
                      onChange={(event) => setToolProjectPicker((current) => ({ ...current, [index]: event.target.value }))}
                      className="h-8 min-w-[240px] flex-1 border border-[#d2d2d2] bg-white px-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#565656] outline-none"
                    >
                      <option value="">Select tools image...</option>
                      {toolsProjectFiles.map((path) => (
                        <option key={`${project.id}-${path}`} value={path}>
                          {path}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => applyToolProjectImage(index, toolProjectPicker[index] ?? project.demoUrl, "demo")}
                      className="h-8 border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
                    >
                      Set Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => applyToolProjectImage(index, toolProjectPicker[index] ?? project.demoUrl, "highlight")}
                      className="h-8 border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
                    >
                      Add Highlight
                    </button>
                    <label className="inline-flex h-8 cursor-pointer items-center border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            uploadToolProjectImage(index, file).catch(() =>
                              setStatus({ tone: "error", message: "Project image upload failed." }),
                            )
                          }
                          event.currentTarget.value = ""
                        }}
                      />
                    </label>
                  </div>
                  <textarea
                    value={project.description}
                    onChange={(event) => updateToolProjectText(index, "description", event.target.value)}
                    placeholder="Description"
                    rows={3}
                    className="w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 py-1.5 text-[12px] font-semibold text-[#414141] outline-none md:col-span-2"
                  />
                  <textarea
                    value={project.highlightUrls.join("\n")}
                    onChange={(event) => {
                      const urls = event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean)
                      updateToolProjectHighlights(index, urls)
                    }}
                    placeholder="Highlight URLs (one per line)"
                    rows={3}
                    className="w-full border border-[#d8d8d8] bg-[#f8f8f8] px-2 py-1.5 text-[12px] font-semibold text-[#414141] outline-none md:col-span-2"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {hoveredPreviewPath ? (
        <div
          className="pointer-events-none fixed z-50 border border-[#d2d2d2] bg-[#fbfbfb] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
          style={{ left: `${previewPosition.x}px`, top: `${previewPosition.y}px` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hoveredPreviewPath} alt="Preview" className="h-[140px] w-[200px] object-cover" />
        </div>
      ) : null}
    </main>
  )
}
