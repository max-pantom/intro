"use client"

import { useEffect, useMemo, useState, type MouseEvent } from "react"

import { defaultCmsPublicData, type CmsPublicData, type GalleryKey } from "@/lib/cms-types"

type Status = {
  tone: "idle" | "success" | "error"
  message: string
}

type ContentRow = {
  amountSpent: string
  id: string
  index: number
  label: string
  scarcity: string
  ticket: string
  tokenUsed: string
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
  const [searchQuery, setSearchQuery] = useState("")
  const [checkedRows, setCheckedRows] = useState<string[]>([])

  const statusColor = useMemo(() => {
    if (status.tone === "error") return "text-[#a9182d]"
    if (status.tone === "success") return "text-[#126640]"
    return "text-[#777777]"
  }, [status.tone])

  const tableDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()).replace(/\//g, "-")
  }, [])

  const contentRows = useMemo<ContentRow[]>(() => {
    const navRows = cmsData.navItems.map((item, index) => {
      const tokenUsed = (item.label.length + item.href.length) * 1000
      return {
        amountSpent: "$" + (tokenUsed / 9.7).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        id: `nav-${item.key}`,
        index,
        label: item.label,
        scarcity: `${index + 1}/${cmsData.navItems.length}`,
        ticket: item.key.toUpperCase(),
        tokenUsed: tokenUsed.toLocaleString(),
        type: "nav" as const,
        value: item.href,
      }
    })

    const folderRows = cmsData.homeFolderTiles.map((item, index) => {
      const tokenUsed = (item.label.length + item.href.length) * 1000
      return {
        amountSpent: "$" + (tokenUsed / 8.4).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        id: `folder-${item.color}-${index}`,
        index,
        label: item.label,
        scarcity: `${index + 1}/${cmsData.homeFolderTiles.length}`,
        ticket: item.color.toUpperCase(),
        tokenUsed: tokenUsed.toLocaleString(),
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
      return [row.label, row.value, row.ticket, row.type].some((field) => field.toLowerCase().includes(query))
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
      <main className="flex min-h-dvh items-center justify-center bg-[#efefef] px-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[#7a7a7a]">Loading CMS...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#efefef] px-4 py-8">
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
    <main className="pantom-scrollbar min-h-dvh overflow-y-auto bg-[#efefef] p-2 sm:p-3">
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

        <section className="mt-3 overflow-x-auto border border-[#dbdbdb] bg-[#ececec]">
          <div className="min-w-[1150px]">
            <div className="grid grid-cols-[44px_54px_1.2fr_1.7fr_1fr_1fr_1.1fr_1.1fr_.7fr_.9fr] border-b border-[#d9d9d9] bg-[#ebebeb] text-[12px] font-semibold text-[#8b8b8b]">
              <div className="border-r border-[#d9d9d9] px-3 py-3 text-center">#</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3 text-center">Sel</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Name</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Email</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Token Used</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Amount spent</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Ticket</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Summary</div>
              <div className="border-r border-[#d9d9d9] px-3 py-3">Scarcity</div>
              <div className="px-3 py-3">Date</div>
            </div>

            {filteredRows.map((row, visualIndex) => (
              <div key={row.id} className="grid grid-cols-[44px_54px_1.2fr_1.7fr_1fr_1fr_1.1fr_1.1fr_.7fr_.9fr] border-b border-[#dcdcdc] text-[12px] text-[#4f4f4f]">
                <div className="border-r border-[#dedede] px-3 py-3 text-center font-semibold">{visualIndex + 1}</div>
                <div className="border-r border-[#dedede] px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={checkedRows.includes(row.id)}
                    onChange={() => toggleCheckedRow(row.id)}
                    className="h-3.5 w-3.5 accent-black"
                  />
                </div>
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
                <div className="border-r border-[#dedede] px-2 py-2">
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
                <div className="border-r border-[#dedede] px-3 py-3 font-semibold">{row.tokenUsed}</div>
                <div className="border-r border-[#dedede] px-3 py-3 font-semibold">{row.amountSpent}</div>
                <div className="border-r border-[#dedede] px-3 py-3 font-semibold">{row.ticket}</div>
                <div className="border-r border-[#dedede] px-3 py-3 font-semibold">{row.type === "nav" ? "Navigation item" : "Home folder tile"}</div>
                <div className="border-r border-[#dedede] px-3 py-3 font-semibold">{row.scarcity}</div>
                <div className="px-3 py-3 font-semibold">{tableDate}</div>
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
