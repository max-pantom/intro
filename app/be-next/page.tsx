"use client"

import Link from "next/link"
import { useState } from "react"

import { Button, Input, RandomizedLabel, StudioFrame, Textarea } from "@/ui.localhost"

type StepChoice = {
  label: string
  value: string
}

type StepKey = "building" | "stage" | "timeline" | "budget"

type StepQuestion = {
  key: StepKey
  title: string
  options: StepChoice[]
}

type IntakeAnswers = Record<StepKey | "name" | "email" | "brief", string>

const stepQuestions: StepQuestion[] = [
  {
    key: "building",
    title: "What are we building?",
    options: [
      { label: "New product", value: "new-product" },
      { label: "Product redesign", value: "product-redesign" },
      { label: "Brand + website", value: "brand-website" },
      { label: "Ongoing product support", value: "ongoing-support" },
    ],
  },
  {
    key: "stage",
    title: "Where are you now?",
    options: [
      { label: "Idea stage", value: "idea-stage" },
      { label: "MVP live", value: "mvp-live" },
      { label: "Early traction", value: "early-traction" },
      { label: "Scaling product", value: "scaling-product" },
    ],
  },
  {
    key: "timeline",
    title: "When do you want to start?",
    options: [
      { label: "Immediately", value: "immediately" },
      { label: "Within 30 days", value: "within-30-days" },
      { label: "1-3 months", value: "one-to-three-months" },
      { label: "Exploring options", value: "exploring-options" },
    ],
  },
  {
    key: "budget",
    title: "What's your budget range?",
    options: [
      { label: "$5k-$10k", value: "5k-to-10k" },
      { label: "$10k-$25k", value: "10k-to-25k" },
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
  name: "",
  email: "",
  brief: "",
}

export default function BeNextPage() {
  const [hasStarted, setHasStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [optionRevealTicks, setOptionRevealTicks] = useState<Record<string, number>>({})
  const [answers, setAnswers] = useState<IntakeAnswers>(initialAnswers)
  const activeStep = stepQuestions[stepIndex] ?? null
  const isContactStep = stepIndex === stepQuestions.length
  const hasValidEmail = /\S+@\S+\.\S+/.test(answers.email.trim())
  const canAdvance = isContactStep
    ? Boolean(answers.name.trim() && answers.email.trim() && answers.brief.trim() && hasValidEmail)
    : Boolean(activeStep && answers[activeStep.key])
  const stepTitle = isContactStep ? "Who should we contact?" : (activeStep?.title ?? "")

  const startFlow = () => {
    setHasStarted(true)
    setStepIndex(0)
    setIsSubmitted(false)
    setIsSubmitting(false)
    setSubmitError("")
    setAnswers(initialAnswers)
  }

  const restartFlow = () => {
    setHasStarted(false)
    setStepIndex(0)
    setIsSubmitted(false)
    setIsSubmitting(false)
    setSubmitError("")
    setAnswers(initialAnswers)
  }

  const selectChoice = (value: string) => {
    if (!activeStep) return
    setAnswers((current) => ({ ...current, [activeStep.key]: value }))
  }

  const triggerOptionReveal = (value: string) => {
    setOptionRevealTicks((current) => ({
      ...current,
      [value]: (current[value] ?? 0) + 1,
    }))
  }

  const goForward = async () => {
    if (!canAdvance) return
    if (isContactStep) {
      setIsSubmitting(true)
      setSubmitError("")

      const response = await fetch("/api/start/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      }).catch(() => null)

      if (!response?.ok) {
        setIsSubmitting(false)
        setSubmitError("Could not send your application right now. Please try again.")
        return
      }

      setIsSubmitting(false)
      setIsSubmitted(true)
    } else {
      setStepIndex((value) => value + 1)
    }
  }

  const goBack = () => {
    if (stepIndex === 0) {
      setHasStarted(false)
      return
    }

    setStepIndex((value) => value - 1)
  }

  return (
    <StudioFrame
      navOverride="home"
      backgroundColor="#ececec"
      headerClassName="px-4 md:px-6 [&>a]:opacity-0 [&>a]:pointer-events-none"
      navClassName="bg-[#ececec]/84 md:bg-transparent"
    >
      <main className="relative h-full overflow-hidden px-4 pb-5 pt-6 md:px-6">
        <section className="absolute left-4 top-5 z-10 space-y-1.5 font-mono text-[10px] leading-none uppercase tracking-[0.02em] text-black/46 md:left-6 md:top-6 md:space-y-2 md:text-[16px]">
          <p>CURRENTLY ACCEPTING</p>
          <p className="pantom-badge-pulse-black inline-block bg-[#c7c7c7] px-[4px] py-[2px] text-[10px] text-[#676767] md:text-[16px]">2 NEW PROJECTS.</p>
        </section>

        <Link
          href="/"
          aria-label="Pantom oval logo"
          data-slot="pantom-oval-logo"
          className="pantom-oval-logo pantom-oval-logo-shimmer pointer-events-auto absolute left-1/2 top-[-2px] z-30 inline-flex h-[32px] w-[112px] -translate-x-1/2 transform-gpu items-center justify-center cursor-pointer overflow-hidden outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 md:top-0 md:h-[40px] md:w-[140px]"
        >
          <svg
            className="block h-full w-auto"
            width="190"
            height="70"
            viewBox="0 0 190 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Pantom logo"
          >
            <path d="M95 0C131.906 0 163.896 7.75346 179.626 19.0801H175.996L167.261 43.4824L168.73 19.0801H160.246L153.484 51H158.062L164.656 19.8779L163.271 44.0283H171.082L179.86 19.626L173.225 51H177.845L183.861 22.5957C187.828 26.4512 190 30.6322 190 35C190 54.33 147.467 70 95 70C58.1816 70 26.2556 62.2829 10.4863 51H13.709L16.1455 39.4922H21.7734C24.8812 39.4922 27.5271 39.0303 29.7529 38.1064C31.9788 37.1825 33.659 35.838 34.793 34.0742C35.9269 32.3103 36.5156 30.2522 36.5156 27.9004C36.5156 26.0524 36.0529 24.4563 35.1289 23.1123C34.2049 21.7684 32.9035 20.7599 31.2656 20.0879C29.6277 19.4159 27.7376 19.0801 25.5957 19.0801H14.9277L8.48633 49.4795C3.03628 45.0667 0 40.1643 0 35C0 15.67 42.5329 0 95 0ZM142.305 18.5762C138.861 18.5762 135.878 19.5418 133.358 21.5156C130.838 23.4896 128.906 26.0521 127.604 29.2021C126.302 32.3521 125.63 35.6283 125.63 39.0303C125.63 41.6762 126.093 43.944 127.017 45.834C127.941 47.7238 129.242 49.1522 130.922 50.1182L130.964 50.0762C132.644 51.0421 134.576 51.5458 136.76 51.5459C140.204 51.5459 143.186 50.5803 145.706 48.6064C148.226 46.6324 150.158 44.0699 151.46 40.9199C152.762 37.7699 153.435 34.4938 153.435 31.0918C153.435 28.4459 152.972 26.178 152.048 24.2881C151.124 22.3982 149.822 20.9699 148.143 20.0039C146.463 19.038 144.53 18.5762 142.305 18.5762ZM49.6699 19.0801L34.0039 51H39.6738L43.748 42.4736H55.8857L56.3477 51H61.9336L59.918 19.0801H49.6699ZM72.4414 19.0801L65.6797 51H70.8037L77.4814 19.542L79.3721 51H89.1582L95.9199 19.0801H90.7959L84.1182 50.5381L82.2275 19.0801H72.4414ZM100.59 19.0801L99.624 23.7422H109.83L104.076 51H109.578L115.374 23.7422H125.58L126.546 19.0801H100.59ZM141.38 23.0703C143.438 23.0703 145.034 23.742 146.168 25.0859C147.302 26.4299 147.849 28.3619 147.849 30.8818C147.849 33.4858 147.428 36.0484 146.546 38.5684C145.664 41.0881 144.446 43.1463 142.893 44.7422C141.339 46.3381 139.574 47.1356 137.601 47.1357C135.543 47.1357 133.946 46.464 132.812 45.1201H132.854C131.721 43.7762 131.132 41.8441 131.132 39.3242C131.132 36.7202 131.553 34.1577 132.435 31.6377C133.317 29.1179 134.534 27.0598 136.088 25.4639C137.642 23.868 139.406 23.0704 141.38 23.0703ZM55.6338 37.8115H45.9736L54.626 19.71L55.6338 37.8115ZM25.0078 23.7002C26.9814 23.7002 28.4511 24.0782 29.417 24.834C30.383 25.59 30.8457 26.7663 30.8457 28.4043C30.8457 29.7062 30.5089 30.8397 29.8789 31.8057C29.2489 32.7717 28.3254 33.5282 27.0654 34.0742C25.8054 34.6202 24.2933 34.8721 22.4873 34.8721H17.1113L19.5059 23.7002H25.0078Z" fill="#212121" />
          </svg>
        </Link>

        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          {!hasStarted ? (
            <section className="flex w-full max-w-[640px] translate-y-[-20px] flex-col items-center gap-28 text-center md:gap-32">
              <button
                type="button"
                onClick={startFlow}
                className="bg-[#0b0b0b] px-[10px] py-[4px] font-mono text-[16px] uppercase tracking-[0.02em] text-white"
                data-analytics-source="start-hero"
              >
                [ APPLY TO WORK TOGETHER ]
              </button>
              <p className="max-w-[560px] font-mono text-[16px] uppercase leading-[1.25] tracking-[0.02em] text-[#121212]">
                PANTOM PARTNERS WITH FOUNDERS BUILDING REAL PRODUCTS.
                <br />
                WE DESIGN THE SYSTEM.
                <br />
                WE BUILD THE CORE.
                <br />
                WE SHIP WITH INTENTION.
                <br />
                WE TAKE ON A LIMITED NUMBER OF PROJECTS AT A TIME.
              </p>
            </section>
          ) : isSubmitted ? (
            <section className="flex w-full max-w-[620px] translate-y-[-16px] flex-col items-center gap-4 text-center">
              <h2 className="font-mono text-[20px] uppercase tracking-[0.05em] text-[#121212]">APPLICATION SUBMITTED</h2>
              <p className="font-mono text-[14px] uppercase tracking-[0.03em] text-[#5e5e5e]">
                THANKS. WE WILL REVIEW AND REPLY WITH NEXT STEPS.
              </p>
              <button
                type="button"
                onClick={restartFlow}
                className="bg-[#0b0b0b] px-[10px] py-[4px] font-mono text-[14px] uppercase tracking-[0.02em] text-white"
              >
                [ START AGAIN ]
              </button>
            </section>
          ) : (
            <section className="w-full max-w-[560px] translate-y-[-10px]">
              <div className="space-y-3 text-center">
                <p className="font-mono text-[16px] uppercase leading-none tracking-[0.06em] text-black/40">
                  {String(stepIndex + 1).padStart(2, "0")}
                </p>
                <h2 className="font-mono text-[20px] uppercase leading-tight tracking-[0.03em] text-[#111111]">
                  {stepTitle}
                </h2>
                <div className="mx-auto w-full max-w-[420px] space-y-[3px]">
                  {!isContactStep && activeStep ? (
                    activeStep.options.map((option) => {
                      const isActive = answers[activeStep.key] === option.value

                      return (
                        <Button
                          key={option.value}
                          type="button"
                          onClick={() => selectChoice(option.value)}
                          onMouseEnter={() => triggerOptionReveal(option.value)}
                          onFocus={() => triggerOptionReveal(option.value)}
                          aria-pressed={isActive}
                          variant="ghost"
                          className={`group/choice h-auto w-full justify-start rounded-none border px-[8px] py-[7px] text-left font-mono text-[16px] uppercase leading-none tracking-[0.02em] transition ${isActive ? "border-[#6e6e6e] bg-[#bcbcbc] text-[#171717] hover:bg-[#a7a7a7] hover:text-[#101010]" : "border-[#a7a7a7] bg-[#252525] text-white hover:bg-[#2f2f2f] hover:text-white"}`}
                        >
                          <RandomizedLabel text={option.label} triggerKey={optionRevealTicks[option.value] ?? 0} />
                        </Button>
                      )
                    })
                  ) : (
                    <div className="space-y-[6px]">
                      <Input
                        value={answers.name}
                        onChange={(event) => setAnswers((current) => ({ ...current, name: event.target.value }))}
                        placeholder="NAME"
                        className="h-auto rounded-none border-[#a7a7a7] bg-[#252525] px-[8px] py-[7px] font-mono text-[16px] uppercase tracking-[0.02em] text-white placeholder:text-white/65 focus-visible:border-white focus-visible:ring-0 md:text-[16px]"
                      />
                      <Input
                        type="email"
                        value={answers.email}
                        onChange={(event) => setAnswers((current) => ({ ...current, email: event.target.value }))}
                        placeholder="EMAIL"
                        className="h-auto rounded-none border-[#a7a7a7] bg-[#252525] px-[8px] py-[7px] font-mono text-[16px] uppercase tracking-[0.02em] text-white placeholder:text-white/65 focus-visible:border-white focus-visible:ring-0 md:text-[16px]"
                      />
                      <Textarea
                        value={answers.brief}
                        onChange={(event) => setAnswers((current) => ({ ...current, brief: event.target.value }))}
                        placeholder="A LITTLE BRIEF ABOUT THE PROJECT"
                        className="min-h-[94px] rounded-none border-[#a7a7a7] bg-[#252525] px-[8px] py-[8px] font-mono text-[14px] tracking-[0.01em] text-white placeholder:text-white/65 focus-visible:border-white focus-visible:ring-0 md:text-[14px]"
                      />
                      {answers.email.trim() && !hasValidEmail ? (
                        <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-black/45">
                          Enter a valid email address.
                        </p>
                      ) : null}
                      {submitError ? <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-[#8b2323]">{submitError}</p> : null}
                    </div>
                  )}
                </div>
              </div>

              {!isContactStep ? (
                <button
                  type="button"
                  onClick={goForward}
                  disabled={!canAdvance}
                  className="group absolute right-0 top-1/2 hidden h-[64px] w-[124px] -translate-y-1/2 items-center justify-end pr-3 transition hover:translate-x-[2px] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:translate-x-0 md:inline-flex"
                  aria-label="Next question"
                >
                  <svg width="36" height="38" viewBox="0 0 42 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M41.5 22L0 0L10 22L0 44L41.5 22Z" fill="black" />
                  </svg>
                </button>
              ) : null}

              <div className="mt-5 flex flex-col items-center gap-3">
                {!isContactStep ? (
                  <button
                    type="button"
                    onClick={goForward}
                    disabled={!canAdvance}
                    className="group inline-flex h-[44px] w-[42px] items-center justify-center transition hover:translate-x-[2px] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:translate-x-0 md:hidden"
                    aria-label="Next question"
                  >
                    <svg width="42" height="44" viewBox="0 0 42 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M41.5 22L0 0L10 22L0 44L41.5 22Z" fill="black" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goForward}
                    disabled={!canAdvance || isSubmitting}
                    className="bg-[#0b0b0b] px-[10px] py-[6px] font-mono text-[16px] uppercase tracking-[0.02em] text-white disabled:opacity-30"
                  >
                    {isSubmitting ? "[ SENDING... ]" : "[ SUBMIT APPLICATION ]"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={goBack}
                  className="pt-1 font-mono text-[12px] uppercase tracking-[0.05em] text-black/40 hover:text-black/62"
                >
                  {stepIndex === 0 ? "[ Back to intro ]" : "[ Previous ]"}
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-4 z-40 px-4 md:bottom-6 md:px-6">
          <div className="mx-auto grid w-full grid-cols-[1fr_auto_1fr] items-center font-mono text-[11px] uppercase tracking-[0.06em] md:text-[12px]">
            <nav className="flex items-center justify-start">
              <a
                href="https://x.com/metagravity"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer px-2 py-[2px] text-black/70 transition hover:bg-black hover:text-white hover:underline hover:decoration-white/85 hover:underline-offset-[3px]"
              >
                X
              </a>
            </nav>
            <p className="px-3 text-center text-[#737373]">LETS WORK WITH YOU TOO AND ELEVATE YOUR SITE</p>
            <nav className="flex items-center justify-end gap-4">
              <a
                href="https://instagram.com/metagravity0"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer px-2 py-[2px] text-black/70 transition hover:bg-black hover:text-white hover:underline hover:decoration-white/85 hover:underline-offset-[3px]"
              >
                Instagram
              </a>
            </nav>
          </div>
        </div>
      </main>
    </StudioFrame>
  )
}
