import Link from "next/link"

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer data-analytics-section="footer" className="pantom-reveal flex flex-col gap-4 border-t border-[#1f1a16]/20 pt-8 text-xs uppercase tracking-[0.15em] text-[#554d44] dark:border-[#e8dfd3]/20 dark:text-[#c2b7a8] md:flex-row md:items-center md:justify-between">
      <p>Pantom Studio {year}</p>
      <div className="flex items-center gap-5">
        <Link href="#services" data-analytics-source="footer" className="transition hover:text-[#1f1a16] dark:hover:text-[#f0e7db]">
          Services
        </Link>
        <Link href="#studio" data-analytics-source="footer" className="transition hover:text-[#1f1a16] dark:hover:text-[#f0e7db]">
          Studio
        </Link>
        <Link href="/lab" data-analytics-source="footer" className="transition hover:text-[#1f1a16] dark:hover:text-[#f0e7db]">
          Lab
        </Link>
      </div>
    </footer>
  )
}
