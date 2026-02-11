import { services } from "@/lib/pantom-content"

import { SectionHeading } from "./section-heading"

export function ServicesSection() {
  return (
    <section id="services" className="pantom-reveal space-y-8">
      <SectionHeading eyebrow="Services" title="Design, development, branding, and MVP delivery.">
        Built for startup velocity with production constraints in mind.
      </SectionHeading>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <article
            key={service.title}
            className="pantom-card rounded-2xl border border-[#1f1a16]/20 bg-[#e8ddd0]/55 p-6 dark:border-[#e8dfd3]/20 dark:bg-[#1f1c18]/55"
          >
            <h3 className="text-2xl leading-tight font-medium">{service.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#554d44] dark:text-[#c2b7a8]">{service.detail}</p>
            <ul className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-[#554d44] dark:text-[#c2b7a8]">
              {service.deliverables.map((item) => (
                <li key={item} className="rounded-full border border-[#1f1a16]/20 px-3 py-1 dark:border-[#e8dfd3]/20">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
