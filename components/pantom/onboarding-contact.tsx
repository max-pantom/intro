import { onboardingSteps } from "@/lib/pantom-content"

import { SectionHeading } from "./section-heading"

export function OnboardingContactSection() {
  return (
    <section id="contact" data-analytics-section="contact" className="pantom-reveal space-y-8 border-t border-[#1f1a16]/20 pt-12 dark:border-[#e8dfd3]/20">
      <SectionHeading eyebrow="Onboarding" title="A clear contact flow that starts with context.">
        We keep the process lightweight while ensuring strategic clarity from day one.
      </SectionHeading>

      <div className="grid gap-6 md:grid-cols-[0.55fr_0.45fr]">
        <ol className="space-y-3 text-sm text-[#554d44] dark:text-[#c2b7a8]">
          {onboardingSteps.map((step, index) => (
            <li key={step} className="pantom-card rounded-xl border border-[#1f1a16]/20 p-4 dark:border-[#e8dfd3]/20">
              <span className="mr-2 font-[family-name:var(--font-serif)] text-xl text-[#1f1a16] dark:text-[#f0e7db]">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-[#1f1a16]/25 bg-[#1f1a16] p-6 text-[#f4efe9] dark:border-[#e8dfd3]/25 dark:bg-[#f4efe9] dark:text-[#1a1714]">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">Contact</p>
          <h3 className="mt-3 text-3xl font-semibold leading-tight">Tell us what you are building.</h3>
          <p className="mt-3 text-sm leading-relaxed opacity-85">
            Include stage, team size, and launch target. We reply with fit and timeline in 48 hours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a
              href="mailto:hello@pantom.studio"
              data-analytics-source="contact"
              className="rounded-full border border-current px-4 py-2 transition hover:-translate-y-0.5"
            >
              hello@pantom.studio
            </a>
            <a
              href="https://cal.com"
              target="_blank"
              rel="noreferrer"
              data-analytics-source="contact"
              className="rounded-full border border-current px-4 py-2 transition hover:-translate-y-0.5"
            >
              Book intro call
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
