import { caseStudies } from "@/lib/pantom-content"

import { SectionHeading } from "./section-heading"

export function CaseStudiesSection() {
  return (
    <section id="case-studies" data-analytics-section="case-studies" className="pantom-reveal space-y-8">
      <SectionHeading eyebrow="Case Studies" title="Story-led proof from product and brand engagements.">
        Each study traces challenge, strategic move, and measurable outcome.
      </SectionHeading>

      <div className="space-y-4">
        {caseStudies.map((study) => (
          <article
            key={study.name}
            className="pantom-card grid gap-6 rounded-2xl border border-[#1f1a16]/20 bg-[#f7f1e9]/70 p-6 dark:border-[#e8dfd3]/20 dark:bg-[#171411]/65 md:grid-cols-[0.3fr_0.7fr]"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#554d44] dark:text-[#c2b7a8]">{study.sector}</p>
              <h3 className="mt-2 text-2xl font-semibold">{study.name}</h3>
            </div>
            <div className="grid gap-4 text-sm leading-relaxed text-[#554d44] dark:text-[#c2b7a8]">
              <p>
                <span className="font-medium text-[#1f1a16] dark:text-[#f0e7db]">Challenge:</span>{" "}
                {study.story.challenge}
              </p>
              <p>
                <span className="font-medium text-[#1f1a16] dark:text-[#f0e7db]">Move:</span> {study.story.move}
              </p>
              <p>
                <span className="font-medium text-[#1f1a16] dark:text-[#f0e7db]">Result:</span> {study.story.result}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
