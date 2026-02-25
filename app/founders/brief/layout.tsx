import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Launch Brief | Founders | Pantom",
  description: "Submit your launch brief for the Pantom founders landing page sprint.",
}

export default function FoundersBriefLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
