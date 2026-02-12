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
    if (status.tone === "error") return "text-[#b90000]"
    if (status.tone === "success") return "text-[#155a1f]"
    return "text-black/55"
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
    return <main className="flex min-h-dvh items-center justify-center font-mono text-[12px] uppercase tracking-[0.06em]">Loading CMS...</main>
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#ececec] px-4">
        <section className="w-full max-w-[420px] border border-black/30 bg-white p-4">
          <h1 className="font-mono text-[13px] uppercase tracking-[0.06em] text-black">Simple CMS Login</h1>
          <p className="mt-1 font-mono text-[11px] text-black/60">Set `CMS_ADMIN_PASSWORD` in your env file.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") login()
            }}
            placeholder="Password"
            className="mt-3 w-full border border-black/30 px-2 py-1 font-mono text-[12px] outline-none"
          />
          <button
            type="button"
            onClick={login}
            className="mt-3 w-full border border-black/40 bg-black px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-white"
          >
            Login
          </button>
          {status.message ? <p className={`mt-2 font-mono text-[11px] ${statusColor}`}>{status.message}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="pantom-scrollbar h-dvh overflow-y-auto bg-[#ececec] px-2 py-3 md:px-6">
      <section className="mx-auto w-full max-w-[980px] border border-black/20 bg-white p-3 md:p-5">
        <div className="sticky top-0 z-10 -mx-3 -mt-3 border-b border-black/15 bg-white px-3 py-3 md:static md:m-0 md:border-b-0 md:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-[13px] uppercase tracking-[0.08em] text-black">CMS Dashboard</h1>
            <p className={`mt-1 font-mono text-[11px] ${statusColor}`}>{status.message || "Edit content, media, and save to publish."}</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button type="button" onClick={save} className="flex-1 border border-black/35 bg-black px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-white sm:flex-none sm:py-1.5">
              Save
            </button>
            <button type="button" onClick={logout} className="flex-1 border border-black/35 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-black sm:flex-none sm:py-1.5">
              Logout
            </button>
          </div>
        </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
          <section className="border border-black/15 p-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/80">Header Nav</h2>
            <div className="mt-2 space-y-2">
              {cmsData.navItems.map((item, index) => (
                <div key={item.key} className="border border-black/10 p-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/45">{item.key}</p>
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const next = [...cmsData.navItems]
                      next[index] = { ...next[index], label: event.target.value }
                      setCmsData({ ...cmsData, navItems: next })
                    }}
                    className="mt-1 w-full border border-black/20 px-2 py-1 font-mono text-[11px] outline-none"
                  />
                  <input
                    value={item.href}
                    onChange={(event) => {
                      const next = [...cmsData.navItems]
                      next[index] = { ...next[index], href: event.target.value }
                      setCmsData({ ...cmsData, navItems: next })
                    }}
                    className="mt-1 w-full border border-black/20 px-2 py-1 font-mono text-[11px] outline-none"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="border border-black/15 p-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/80">Home Folders</h2>
            <div className="mt-2 space-y-2">
              {cmsData.homeFolderTiles.map((item, index) => (
                <div key={`${item.color}-${index}`} className="border border-black/10 p-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/45">{item.color}</p>
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const next = [...cmsData.homeFolderTiles]
                      next[index] = { ...next[index], label: event.target.value }
                      setCmsData({ ...cmsData, homeFolderTiles: next })
                    }}
                    className="mt-1 w-full border border-black/20 px-2 py-1 font-mono text-[11px] outline-none"
                  />
                  <input
                    value={item.href}
                    onChange={(event) => {
                      const next = [...cmsData.homeFolderTiles]
                      next[index] = { ...next[index], href: event.target.value }
                      setCmsData({ ...cmsData, homeFolderTiles: next })
                    }}
                    className="mt-1 w-full border border-black/20 px-2 py-1 font-mono text-[11px] outline-none"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="border border-black/15 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-black/80">Image Manager</h2>
              <div className="flex items-center gap-1">
                {(["apps", "website", "labs"] as GalleryKey[]).map((gallery) => (
                  <button
                    key={gallery}
                    type="button"
                    onClick={() => setActiveGallery(gallery)}
                    className={`border px-2 py-1 font-mono text-[10px] uppercase ${activeGallery === gallery ? "border-black bg-black text-white" : "border-black/25 bg-white text-black/75"}`}
                  >
                    {gallery}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" onClick={autoFillGallery} className="border border-black/20 bg-white px-2 py-1 font-mono text-[10px] uppercase text-black/80">
                Auto Fill
              </button>
              <button type="button" onClick={sortSelectedGallery} className="border border-black/20 bg-white px-2 py-1 font-mono text-[10px] uppercase text-black/80">
                Sort A-Z
              </button>
              <label className="cursor-pointer border border-black/20 bg-white px-2 py-1 font-mono text-[10px] uppercase text-black/80">
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

            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div className="border border-black/10 p-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/45">Selected ({cmsData.galleries[activeGallery].length})</p>
                <div className="pantom-scrollbar mt-2 max-h-[200px] space-y-1 overflow-y-auto">
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
                      className={`flex items-center gap-1 border border-black/10 px-1 py-1 ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
                      onMouseEnter={(event) => handlePreviewMove(event, path)}
                      onMouseMove={(event) => handlePreviewMove(event, path)}
                      onMouseLeave={() => setHoveredPreviewPath(null)}
                    >
                      <span className="border border-black/20 px-1 font-mono text-[10px] text-black/60">drag</span>
                      <button type="button" onClick={() => moveGalleryImage(index, -1)} className="border border-black/20 px-1 font-mono text-[10px]">-</button>
                      <button type="button" onClick={() => moveGalleryImage(index, 1)} className="border border-black/20 px-1 font-mono text-[10px]">+</button>
                      <span className="truncate font-mono text-[10px] text-black/70">{path}</span>
                      <button type="button" onClick={() => removeGalleryImage(path)} className="ml-auto border border-black/20 px-1 font-mono text-[10px]">x</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-black/10 p-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/45">Available ({galleryFiles.length})</p>
                <div className="pantom-scrollbar mt-2 max-h-[200px] space-y-1 overflow-y-auto">
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
                        className="flex w-full items-center gap-2 border border-black/10 px-1 py-1 text-left disabled:opacity-45"
                      >
                        <span className="truncate font-mono text-[10px] text-black/70">{path}</span>
                        <span className="ml-auto border border-black/20 px-1 font-mono text-[10px]">{isSelected ? "ok" : "+"}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {hoveredPreviewPath ? (
        <div
          className="pointer-events-none fixed z-50 border border-black/25 bg-white p-1 shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
          style={{ left: `${previewPosition.x}px`, top: `${previewPosition.y}px` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hoveredPreviewPath} alt="Preview" className="h-[140px] w-[200px] object-cover" />
        </div>
      ) : null}
    </main>
  )
}
