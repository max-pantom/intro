import { communityPrograms, philosophy } from "@/lib/pantom-content"

import { SectionHeading } from "./section-heading"

export function StudioPhilosophySection() {
  return (
    <section id="studio" data-analytics-section="studio" className="pantom-reveal space-y-8">
      <SectionHeading eyebrow="Studio" title="A community-driven model for modern product teams.">
        Pantom blends a core studio with a rotating community of writers, researchers, and product operators.
      </SectionHeading>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1f1a16]/20 bg-[#f7f1e9]/70 p-6 dark:border-[#e8dfd3]/20 dark:bg-[#171411]/65">
          <h3 className="text-xl font-semibold">Philosophy</h3>
          <ul className="mt-4 space-y-4 text-sm leading-relaxed text-[#554d44] dark:text-[#c2b7a8]">
            {philosophy.map((item) => (
              <li key={item.title} className="pantom-card rounded-xl border border-[#1f1a16]/15 p-4 dark:border-[#e8dfd3]/15">
                <p className="font-medium text-[#1f1a16] dark:text-[#f0e7db]">{item.title}</p>
                <p className="mt-1">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#1f1a16]/20 bg-[#e8ddd0]/55 p-6 dark:border-[#e8dfd3]/20 dark:bg-[#1f1c18]/55">
          <h3 className="text-xl font-semibold">Community Programs</h3>
          <ul className="mt-4 space-y-4 text-sm leading-relaxed text-[#554d44] dark:text-[#c2b7a8]">
            {communityPrograms.map((program) => (
              <li key={program.name} className="pantom-card rounded-xl border border-[#1f1a16]/15 p-4 dark:border-[#e8dfd3]/15">
                <p className="font-medium text-[#1f1a16] dark:text-[#f0e7db]">{program.name}</p>
                <p className="mt-1">{program.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
