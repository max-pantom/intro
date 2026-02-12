import { mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { list, put } from "@vercel/blob"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { GalleryKey } from "@/lib/cms-types"

const CMS_COOKIE = "cms_admin"
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)$/i

const galleryConfig: Record<GalleryKey, { folder: string; publicPrefix: string }> = {
  apps: { folder: path.join(process.cwd(), "public", "apps-images"), publicPrefix: "/apps-images/" },
  website: { folder: path.join(process.cwd(), "public", "website-images"), publicPrefix: "/website-images/" },
  labs: { folder: path.join(process.cwd(), "public", "lab-images"), publicPrefix: "/lab-images/" },
}

async function isAuthorized() {
  const cookieStore = await cookies()
  return cookieStore.get(CMS_COOKIE)?.value === "1"
}

function hasBlobConfig() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function getGallery(request: Request): GalleryKey | null {
  const gallery = new URL(request.url).searchParams.get("gallery")
  if (!gallery) return null
  if (gallery === "apps" || gallery === "website" || gallery === "labs") return gallery
  return null
}

export async function GET(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const gallery = getGallery(request)
  if (!gallery) {
    return NextResponse.json({ error: "Missing or invalid gallery." }, { status: 400 })
  }

  const config = galleryConfig[gallery]

  let localFiles: string[] = []
  try {
    const entries = await readdir(config.folder, { withFileTypes: true })
    localFiles = entries
      .filter((entry) => entry.isFile() && IMAGE_FILE_PATTERN.test(entry.name))
      .map((entry) => `${config.publicPrefix}${entry.name}`)
  } catch {
    localFiles = []
  }

  if (hasBlobConfig()) {
    try {
      const response = await list({
        prefix: `${gallery}/`,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      const blobFiles = response.blobs.map((blob) => blob.url)
      const files = Array.from(new Set([...blobFiles, ...localFiles]))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))

      return NextResponse.json({ files })
    } catch {
      return NextResponse.json({ files: localFiles })
    }
  }

  const files = localFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
  return NextResponse.json({ files })
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const galleryValue = formData.get("gallery")
  if (galleryValue !== "apps" && galleryValue !== "website" && galleryValue !== "labs") {
    return NextResponse.json({ error: "Missing or invalid gallery." }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 })
  }

  const extension = path.extname(file.name).toLowerCase()
  if (!IMAGE_FILE_PATTERN.test(extension)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 })
  }

  const safeName = path
    .basename(file.name, extension)
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  const nextName = `${safeName || "image"}-${Date.now()}${extension}`
  const config = galleryConfig[galleryValue]

  if (hasBlobConfig()) {
    const blob = await put(`${galleryValue}/${nextName}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ path: blob.url })
  }

  await mkdir(config.folder, { recursive: true })
  const outputPath = path.join(config.folder, nextName)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(outputPath, buffer)

  return NextResponse.json({ path: `${config.publicPrefix}${nextName}` })
}
