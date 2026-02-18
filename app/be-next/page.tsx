"use client"

import { useMemo, useState } from "react"

import { StudioFrame } from "@/components/studio/studio-frame"
import { Field, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type StepChoice = {
  label: string
  value: string
}

type StepQuestion = {
  title: string
  options: StepChoice[]
}

type IntakeAnswers = {
  building: string
  stage: string
  timeline: string
  budget: string
  summary: string
  company: string
  name: string
  email: string
  website: string
}

const stepQuestions: StepQuestion[] = [
  {
    title: "What are we building?",
    options: [
      { label: "New product", value: "new-product" },
      { label: "Product redesign", value: "product-redesign" },
      { label: "Brand + website", value: "brand-website" },
      { label: "Ongoing product support", value: "ongoing-support" },
    ],
  },
  {
    title: "Where are you now?",
    options: [
      { label: "Idea stage", value: "idea-stage" },
      { label: "MVP live", value: "mvp-live" },
      { label: "Early traction", value: "early-traction" },
      { label: "Scaling product", value: "scaling-product" },
    ],
  },
  {
    title: "When do you want to start?",
    options: [
      { label: "Immediately", value: "immediately" },
      { label: "Within 30 days", value: "within-30-days" },
      { label: "1-3 months", value: "one-to-three-months" },
      { label: "Exploring options", value: "exploring-options" },
    ],
  },
  {
    title: "What's your budget range?",
    options: [
      { label: "$5k-$10k", value: "5k-10k" },
      { label: "$10k-$25k", value: "10k-25k" },
      { label: "$25k+", value: "25k-plus" },
      { label: "Flexible, depending on scope", value: "flexible" },
    ],
  },
]

const initialAnswers: IntakeAnswers = {
  building: "",
  stage: "",
  timeline: "",
  budget: "",
  summary: "",
  company: "",
  name: "",
  email: "",
  website: "",
}

const totalSteps = 5

export default function BeNextPage() {
  const [isStarted, setIsStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [answers, setAnswers] = useState<IntakeAnswers>(initialAnswers)

  const canGoNext = useMemo(() => {
    if (stepIndex === 0) return Boolean(answers.building)
    if (stepIndex === 1) return Boolean(answers.stage)
    if (stepIndex === 2) return Boolean(answers.timeline)
    if (stepIndex === 3) return Boolean(answers.budget)
    return Boolean(answers.summary.trim() && answers.company.trim() && answers.name.trim() && answers.email.trim())
  }, [answers, stepIndex])

  const setChoice = (key: "building" | "stage" | "timeline" | "budget", value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }))
  }

  const goNext = () => {
    if (!canGoNext) return
    if (stepIndex < totalSteps - 1) {
      setStepIndex((value) => value + 1)
      return
    }
    setIsSubmitted(true)
  }

  const goBack = () => {
    setStepIndex((value) => Math.max(0, value - 1))
  }

  return (
    <StudioFrame
      navOverride="home"
      backgroundColor="#ebebeb"
      headerClassName="px-4 md:px-6 [&>a]:opacity-0 [&>a]:pointer-events-none"
      navClassName="bg-[#ebebeb]/82 md:bg-transparent"
    >
      <main className="relative h-full overflow-hidden px-4 pb-5 pt-7 md:px-6 md:pt-6">
        <section className="absolute left-6 top-7 z-10 space-y-1 font-mono text-[12px] leading-none uppercase tracking-[0.06em] text-[#6e6e6e] md:left-6 md:top-7">
          <p>CURRENTLY ACCEPTING</p>
          <p className="inline-block bg-[#7ea4ff] px-2 py-1 text-[#0d2a6b]">2 NEW PROJECTS.</p>
        </section>

        <div className="pointer-events-none absolute left-1/2 top-7 z-10 -translate-x-1/2">
          <svg width="190" height="70" viewBox="0 0 190 70" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Pantom logo">
            <path d="M95 0C131.906 0 163.896 7.75346 179.626 19.0801H175.996L167.261 43.4824L168.73 19.0801H160.246L153.484 51H158.062L164.656 19.8779L163.271 44.0283H171.082L179.86 19.626L173.225 51H177.845L183.861 22.5957C187.828 26.4512 190 30.6322 190 35C190 54.33 147.467 70 95 70C58.1816 70 26.2556 62.2829 10.4863 51H13.709L16.1455 39.4922H21.7734C24.8812 39.4922 27.5271 39.0303 29.7529 38.1064C31.9788 37.1825 33.659 35.838 34.793 34.0742C35.9269 32.3103 36.5156 30.2522 36.5156 27.9004C36.5156 26.0524 36.0529 24.4563 35.1289 23.1123C34.2049 21.7684 32.9035 20.7599 31.2656 20.0879C29.6277 19.4159 27.7376 19.0801 25.5957 19.0801H14.9277L8.48633 49.4795C3.03628 45.0667 0 40.1643 0 35C0 15.67 42.5329 0 95 0ZM142.305 18.5762C138.861 18.5762 135.878 19.5418 133.358 21.5156C130.838 23.4896 128.906 26.0521 127.604 29.2021C126.302 32.3521 125.63 35.6283 125.63 39.0303C125.63 41.6762 126.093 43.944 127.017 45.834C127.941 47.7238 129.242 49.1522 130.922 50.1182L130.964 50.0762C132.644 51.0421 134.576 51.5458 136.76 51.5459C140.204 51.5459 143.186 50.5803 145.706 48.6064C148.226 46.6324 150.158 44.0699 151.46 40.9199C152.762 37.7699 153.435 34.4938 153.435 31.0918C153.435 28.4459 152.972 26.178 152.048 24.2881C151.124 22.3982 149.822 20.9699 148.143 20.0039C146.463 19.038 144.53 18.5762 142.305 18.5762ZM49.6699 19.0801L34.0039 51H39.6738L43.748 42.4736H55.8857L56.3477 51H61.9336L59.918 19.0801H49.6699ZM72.4414 19.0801L65.6797 51H70.8037L77.4814 19.542L79.3721 51H89.1582L95.9199 19.0801H90.7959L84.1182 50.5381L82.2275 19.0801H72.4414ZM100.59 19.0801L99.624 23.7422H109.83L104.076 51H109.578L115.374 23.7422H125.58L126.546 19.0801H100.59ZM141.38 23.0703C143.438 23.0703 145.034 23.742 146.168 25.0859C147.302 26.4299 147.849 28.3619 147.849 30.8818C147.849 33.4858 147.428 36.0484 146.546 38.5684C145.664 41.0881 144.446 43.1463 142.893 44.7422C141.339 46.3381 139.574 47.1356 137.601 47.1357C135.543 47.1357 133.946 46.464 132.812 45.1201H132.854C131.721 43.7762 131.132 41.8441 131.132 39.3242C131.132 36.7202 131.553 34.1577 132.435 31.6377C133.317 29.1179 134.534 27.0598 136.088 25.4639C137.642 23.868 139.406 23.0704 141.38 23.0703ZM55.6338 37.8115H45.9736L54.626 19.71L55.6338 37.8115ZM25.0078 23.7002C26.9814 23.7002 28.4511 24.0782 29.417 24.834C30.383 25.59 30.8457 26.7663 30.8457 28.4043C30.8457 29.7062 30.5089 30.8397 29.8789 31.8057C29.2489 32.7717 28.3254 33.5282 27.0654 34.0742C25.8054 34.6202 24.2933 34.8721 22.4873 34.8721H17.1113L19.5059 23.7002H25.0078Z" fill="#212121"/>
          </svg>
        </div>

        <div className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2">
          <div className="mx-auto flex w-full max-w-[640px] justify-center px-4">
            {!isStarted ? (
              <button
                type="button"
                onClick={() => setIsStarted(true)}
                className="border border-[#0f0f0f] bg-[#101114] px-3 py-1 font-mono text-[12px] uppercase leading-none tracking-[0.08em] text-[#f2f2f2]"
                data-analytics-source="start-hero"
              >
                START
              </button>
            ) : (
              <section className="w-full border border-[#101114]/35 bg-[#f1f1f1] p-4 shadow-[0_16px_34px_-22px_rgba(0,0,0,0.55)] md:p-5" data-analytics-section="start-intake-flow">
                <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[#5f5f5f]">
                  <p>Step {stepIndex + 1} / {totalSteps}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStarted(false)
                      setStepIndex(0)
                      setIsSubmitted(false)
                    }}
                    className="border border-[#101114]/20 px-2 py-0.5 text-[#4b4b4b] hover:bg-[#dadada]"
                  >
                    close
                  </button>
                </div>

                {!isSubmitted ? (
                  <>
                    {stepIndex <= 3 ? (
                      <div className="space-y-3">
                        <h2 className="font-mono text-[14px] uppercase tracking-[0.04em] text-[#1b1b1b]">
                          {stepQuestions[stepIndex]?.title}
                        </h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {stepQuestions[stepIndex]?.options.map((option) => {
                            const key = stepIndex === 0 ? "building" : stepIndex === 1 ? "stage" : stepIndex === 2 ? "timeline" : "budget"
                            const isActive = answers[key] === option.value

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setChoice(key, option.value)}
                                className={`min-h-10 border px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.06em] transition ${isActive ? "border-[#101114] bg-[#101114] text-[#f2f2f2]" : "border-[#101114]/20 bg-[#ebebeb] text-[#1f1f1f] hover:bg-[#dfdfdf]"}`}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h2 className="font-mono text-[14px] uppercase tracking-[0.04em] text-[#1b1b1b]">
                          Tell us about your product.
                        </h2>

                        <FieldGroup>
                          <Field>
                            <FieldLabel>
                              <FieldTitle className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5b5b5b]">Project summary</FieldTitle>
                            </FieldLabel>
                            <Textarea
                              value={answers.summary}
                              onChange={(event) => setAnswers((current) => ({ ...current, summary: event.target.value }))}
                              className="min-h-20 bg-white"
                            />
                          </Field>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <Field>
                              <FieldLabel>
                                <FieldTitle className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5b5b5b]">Company name</FieldTitle>
                              </FieldLabel>
                              <Input value={answers.company} onChange={(event) => setAnswers((current) => ({ ...current, company: event.target.value }))} className="bg-white" />
                            </Field>

                            <Field>
                              <FieldLabel>
                                <FieldTitle className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5b5b5b]">Your name</FieldTitle>
                              </FieldLabel>
                              <Input value={answers.name} onChange={(event) => setAnswers((current) => ({ ...current, name: event.target.value }))} className="bg-white" />
                            </Field>

                            <Field>
                              <FieldLabel>
                                <FieldTitle className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5b5b5b]">Email</FieldTitle>
                              </FieldLabel>
                              <Input type="email" value={answers.email} onChange={(event) => setAnswers((current) => ({ ...current, email: event.target.value }))} className="bg-white" />
                            </Field>

                            <Field>
                              <FieldLabel>
                                <FieldTitle className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5b5b5b]">Website (optional)</FieldTitle>
                              </FieldLabel>
                              <Input value={answers.website} onChange={(event) => setAnswers((current) => ({ ...current, website: event.target.value }))} className="bg-white" />
                            </Field>
                          </div>
                        </FieldGroup>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={goBack}
                        disabled={stepIndex === 0}
                        className="h-7 border border-[#101114]/20 px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[#4f4f4f] disabled:opacity-35"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!canGoNext}
                        className="h-7 border border-[#101114] bg-[#101114] px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-white disabled:opacity-35"
                      >
                        {stepIndex === totalSteps - 1 ? "Submit application" : "Continue"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 py-6 text-center">
                    <h2 className="font-mono text-[14px] uppercase tracking-[0.05em] text-[#111]">Application Submitted</h2>
                    <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#5e5e5e]">
                      Thanks. We will review and reply with next steps.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStarted(false)
                        setStepIndex(0)
                        setIsSubmitted(false)
                        setAnswers(initialAnswers)
                      }}
                      className="mx-auto h-7 border border-[#101114]/20 px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[#4f4f4f]"
                    >
                      Close
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        <p className="absolute inset-x-0 bottom-6 z-10 text-center font-mono text-[12px] uppercase tracking-[0.06em] text-[#737373]">
          LETS WORK WITH YOU TOO AND ELEVATE YOUR SITE
        </p>
      </main>
    </StudioFrame>
  )
}
