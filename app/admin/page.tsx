"use client"

import { useEffect, useMemo, useState, type MouseEvent } from "react"

import { defaultCmsPublicData, type CmsPublicData, type GalleryKey } from "@/lib/cms-types"

type Status = {
  tone: "idle" | "success" | "error"
  message: string
}

function cloneDefaults(): CmsPublicData {
  return {
    navItems: defaultCmsPublicData.navItems.map((item) => ({ ...item })),
    homeFolderTiles: defaultCmsPublicData.homeFolderTiles.map((item) => ({ ...item })),
    galleries: {
      apps: [...defaultCmsPublicData.galleries.apps],
      website: [...defaultCmsPublicData.galleries.website],
      labs: [...defaultCmsPublicData.galleries.labs],
    },
  }
}

const galleryOptions: GalleryKey[] = ["apps", "website", "labs"]

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [cmsData, setCmsData] = useState<CmsPublicData>(cloneDefaults)
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [activeGallery, setActiveGallery] = useState<GalleryKey>("apps")
  const [galleryFiles, setGalleryFiles] = useState<string[]>([])
  const [hoveredPreviewPath, setHoveredPreviewPath] = useState<string | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const statusColor = useMemo(() => {
    if (status.tone === "error") return "text-[#a9182d]"
    if (status.tone === "success") return "text-[#126640]"
    return "text-black/58"
  }, [status.tone])

  const statusBadgeClass = useMemo(() => {
    if (status.tone === "error") return "border-[#a9182d]/28 bg-[#a9182d]/7 text-[#8f1325]"
    if (status.tone === "success") return "border-[#126640]/25 bg-[#126640]/8 text-[#0f5536]"
    return "border-black/15 bg-black/5 text-black/62"
  }, [status.tone])

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

  const loadGalleryFiles = async (gallery: GalleryKey) => {
    const response = await fetch(`/api/admin/images?gallery=${gallery}`, { cache: "no-store" })
    if (!response.ok) {
      setGalleryFiles([])
      return
    }

    const payload = (await response.json()) as { files?: string[] }
    setGalleryFiles(Array.isArray(payload.files) ? payload.files : [])
  }

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
      loadGalleryFiles(activeGallery).catch(() => setGalleryFiles([]))
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [activeGallery, isAuthenticated])

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

  const handlePreviewMove = (event: MouseEvent, path: string) => {
    setHoveredPreviewPath(path)
    setPreviewPosition({ x: event.clientX + 16, y: event.clientY + 18 })
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
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#efefed_0%,#d8d8d5_100%)] px-4">
        <div className="pointer-events-none absolute left-[-9rem] top-[-8rem] h-[20rem] w-[20rem] rounded-full bg-[#0e3fcb]/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-[22rem] w-[22rem] rounded-full bg-[#f0ab65]/16 blur-3xl" />
        <div className="relative rounded-[18px] border border-black/14 bg-white/76 px-7 py-4 shadow-[0_24px_65px_rgba(18,18,18,0.16)] backdrop-blur">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-black/68">Loading CMS Workspace...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(130deg,#efefec_0%,#d7d6d4_56%,#cecfc9_100%)] px-4 py-8">
        <div className="pointer-events-none absolute left-[-8rem] top-[6%] h-[20rem] w-[20rem] rounded-full bg-[#0d47d6]/14 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-9rem] right-[-7rem] h-[20rem] w-[20rem] rounded-full bg-[#121212]/10 blur-3xl" />

        <section className="relative w-full max-w-[470px] overflow-hidden rounded-[22px] border border-black/20 bg-[#f8f8f6] shadow-[0_30px_72px_rgba(0,0,0,0.2)]">
          <div className="h-3 bg-[linear-gradient(90deg,#0c43c0_0%,#2a65ea_38%,#f8f8f6_100%)]" />

          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/54">Studio / CMS</p>
            <h1 className="mt-2 font-mono text-[24px] leading-none tracking-[-0.04em] text-black">Admin Login</h1>
            <p className="mt-3 max-w-[32ch] font-mono text-[11px] leading-relaxed text-black/65">Use your CMS password to edit navigation labels, folder links, and gallery order.</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-black/45">`CMS_ADMIN_PASSWORD` must be set in your environment.</p>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") login()
              }}
              placeholder="Password"
              className="mt-5 w-full rounded-[10px] border border-black/18 bg-white px-3 py-2.5 font-mono text-[12px] text-black outline-none transition focus:border-black/40"
            />

            <button
              type="button"
              onClick={login}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-black/35 bg-black font-mono text-[11px] uppercase tracking-[0.09em] text-white transition hover:bg-black/90"
            >
              Login
            </button>

            <p className={`mt-3 min-h-4 font-mono text-[11px] ${statusColor}`}>{status.message || " "}</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="pantom-scrollbar relative h-dvh overflow-y-auto bg-[linear-gradient(125deg,#efefec_0%,#dddcd8_64%,#d0d1cd_100%)] px-3 py-4 md:px-8 md:py-8">
      <div className="pointer-events-none absolute left-[-11rem] top-[-10rem] h-[24rem] w-[24rem] rounded-full bg-[#1147ca]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-11rem] right-[-9rem] h-[24rem] w-[24rem] rounded-full bg-[#0d0d0d]/8 blur-3xl" />

      <section className="relative mx-auto w-full max-w-[1260px]">
        <div className="sticky top-3 z-20 rounded-[18px] border border-black/18 bg-[#f7f7f5]/95 px-4 py-4 shadow-[0_20px_40px_rgba(0,0,0,0.14)] backdrop-blur md:px-6 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/52">Studio / Content Manager</p>
              <h1 className="mt-1 font-mono text-[24px] leading-none tracking-[-0.04em] text-black md:text-[28px]">CMS Dashboard</h1>
              <p className={`mt-2 font-mono text-[11px] ${statusColor}`}>{status.message || "Edit content and media, then save to publish."}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.09em] ${statusBadgeClass}`}>
                {status.tone === "idle" ? "Ready" : status.tone}
              </span>
              <button
                type="button"
                onClick={save}
                className="inline-flex h-9 items-center justify-center rounded-[10px] border border-black/35 bg-black px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-white transition hover:bg-black/88"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-9 items-center justify-center rounded-[10px] border border-black/28 bg-white px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-black/82 transition hover:bg-black/3"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] xl:items-start">
          <section className="rounded-[18px] border border-black/18 bg-[#f8f8f6] p-4 shadow-[0_15px_36px_rgba(0,0,0,0.12)] md:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-black/82">Header Nav</h2>
              <span className="rounded-full border border-black/15 bg-black/4 px-2 py-0.5 font-mono text-[10px] text-black/60">{cmsData.navItems.length}</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {cmsData.navItems.map((item, index) => (
                <article key={item.key} className="rounded-[12px] border border-black/12 bg-white/82 p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-black/45">{item.key}</p>
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const next = [...cmsData.navItems]
                      next[index] = { ...next[index], label: event.target.value }
                      setCmsData({ ...cmsData, navItems: next })
                    }}
                    className="mt-1.5 w-full rounded-[9px] border border-black/16 bg-white px-3 py-2 font-mono text-[11px] text-black/86 outline-none transition focus:border-black/38"
                    placeholder="Label"
                  />
                  <input
                    value={item.href}
                    onChange={(event) => {
                      const next = [...cmsData.navItems]
                      next[index] = { ...next[index], href: event.target.value }
                      setCmsData({ ...cmsData, navItems: next })
                    }}
                    className="mt-1.5 w-full rounded-[9px] border border-black/16 bg-white px-3 py-2 font-mono text-[11px] text-black/86 outline-none transition focus:border-black/38"
                    placeholder="Href"
                  />
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-black/18 bg-[#f8f8f6] p-4 shadow-[0_15px_36px_rgba(0,0,0,0.12)] md:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-black/82">Home Folders</h2>
              <span className="rounded-full border border-black/15 bg-black/4 px-2 py-0.5 font-mono text-[10px] text-black/60">{cmsData.homeFolderTiles.length}</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {cmsData.homeFolderTiles.map((item, index) => (
                <article key={`${item.color}-${index}`} className="rounded-[12px] border border-black/12 bg-white/82 p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-black/45">{item.color}</p>
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const next = [...cmsData.homeFolderTiles]
                      next[index] = { ...next[index], label: event.target.value }
                      setCmsData({ ...cmsData, homeFolderTiles: next })
                    }}
                    className="mt-1.5 w-full rounded-[9px] border border-black/16 bg-white px-3 py-2 font-mono text-[11px] text-black/86 outline-none transition focus:border-black/38"
                    placeholder="Label"
                  />
                  <input
                    value={item.href}
                    onChange={(event) => {
                      const next = [...cmsData.homeFolderTiles]
                      next[index] = { ...next[index], href: event.target.value }
                      setCmsData({ ...cmsData, homeFolderTiles: next })
                    }}
                    className="mt-1.5 w-full rounded-[9px] border border-black/16 bg-white px-3 py-2 font-mono text-[11px] text-black/86 outline-none transition focus:border-black/38"
                    placeholder="Href"
                  />
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-black/18 bg-[#f8f8f6] p-4 shadow-[0_15px_36px_rgba(0,0,0,0.12)] md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-black/82">Image Manager</h2>
              <div className="inline-flex rounded-full border border-black/16 bg-white p-0.5">
                {galleryOptions.map((gallery) => (
                  <button
                    key={gallery}
                    type="button"
                    onClick={() => setActiveGallery(gallery)}
                    className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition ${
                      activeGallery === gallery ? "bg-black text-white" : "text-black/65 hover:bg-black/4"
                    }`}
                  >
                    {gallery}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={autoFillGallery}
                className="inline-flex h-8 items-center justify-center rounded-[9px] border border-black/20 bg-white px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-black/80 transition hover:bg-black/4"
              >
                Auto Fill
              </button>
              <button
                type="button"
                onClick={sortSelectedGallery}
                className="inline-flex h-8 items-center justify-center rounded-[9px] border border-black/20 bg-white px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-black/80 transition hover:bg-black/4"
              >
                Sort A-Z
              </button>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-[9px] border border-black/20 bg-white px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-black/80 transition hover:bg-black/4">
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

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <article className="rounded-[12px] border border-black/12 bg-white/82 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/48">Selected</p>
                  <span className="rounded-full border border-black/12 bg-black/4 px-2 py-0.5 font-mono text-[10px] text-black/60">{cmsData.galleries[activeGallery].length}</span>
                </div>

                <div className="pantom-scrollbar mt-2 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
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
                      className={`flex items-center gap-1.5 rounded-[8px] border border-black/12 bg-white px-1.5 py-1.5 ${
                        draggedIndex === index ? "opacity-55" : "opacity-100"
                      }`}
                      onMouseEnter={(event) => handlePreviewMove(event, path)}
                      onMouseMove={(event) => handlePreviewMove(event, path)}
                      onMouseLeave={() => setHoveredPreviewPath(null)}
                    >
                      <span className="rounded-[6px] border border-black/18 bg-black/3 px-1.5 font-mono text-[10px] text-black/58">drag</span>
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(index, -1)}
                        className="h-5 w-5 rounded-[6px] border border-black/18 bg-white font-mono text-[10px] leading-none"
                        aria-label="Move image up"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(index, 1)}
                        className="h-5 w-5 rounded-[6px] border border-black/18 bg-white font-mono text-[10px] leading-none"
                        aria-label="Move image down"
                      >
                        +
                      </button>
                      <span className="truncate font-mono text-[10px] text-black/72">{path}</span>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(path)}
                        className="ml-auto h-5 w-5 rounded-[6px] border border-black/18 bg-white font-mono text-[10px] leading-none"
                        aria-label="Remove image"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[12px] border border-black/12 bg-white/82 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/48">Available</p>
                  <span className="rounded-full border border-black/12 bg-black/4 px-2 py-0.5 font-mono text-[10px] text-black/60">{galleryFiles.length}</span>
                </div>

                <div className="pantom-scrollbar mt-2 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
                  {galleryFiles.map((path) => {
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
                        className="flex w-full items-center gap-2 rounded-[8px] border border-black/12 bg-white px-2 py-1.5 text-left transition hover:bg-black/2 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <span className="truncate font-mono text-[10px] text-black/72">{path}</span>
                        <span className="ml-auto rounded-[6px] border border-black/18 bg-black/3 px-1.5 font-mono text-[10px] text-black/70">{isSelected ? "ok" : "+"}</span>
                      </button>
                    )
                  })}
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>

      {hoveredPreviewPath ? (
        <div
          className="pointer-events-none fixed z-50 rounded-[12px] border border-black/20 bg-white p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.2)]"
          style={{ left: `${previewPosition.x}px`, top: `${previewPosition.y}px` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hoveredPreviewPath} alt="Preview" className="h-[140px] w-[200px] rounded-[8px] object-cover" />
        </div>
      ) : null}
    </main>
  )
}
