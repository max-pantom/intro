import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function isUiSubdomain(hostname: string) {
  const hostWithoutPort = hostname.split(":")[0] ?? ""
  return hostWithoutPort === "ui.localhost" || hostWithoutPort.startsWith("ui.")
}

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host")?.toLowerCase() ?? ""
  if (!isUiSubdomain(hostHeader)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  const isFileRequest = /\.[a-z0-9]+$/i.test(url.pathname)

  if (isFileRequest) {
    return NextResponse.next()
  }

  if (url.pathname !== "/ui-localhost") {
    url.pathname = "/ui-localhost"
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}
