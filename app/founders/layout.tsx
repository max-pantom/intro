import type { ReactNode } from "react"

import "./founders-font.css"

export default function FoundersLayout({ children }: { children: ReactNode }) {
  return <div className="founders-page">{children}</div>
}
