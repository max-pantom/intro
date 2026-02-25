"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import confetti from "canvas-confetti"
import html2canvas from "html2canvas"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/** Japanese-style gradients (top to bottom), refined nice colors */
const CARD_GRADIENTS = [
  "linear-gradient(180deg, #e8a0a8 0%, #c97b8a 50%, #a85f6d 100%)", // Sakura — blossom pink
  "linear-gradient(180deg, #b8a8d4 0%, #8b7aa8 50%, #6b5b82 100%)", // Fuji — wisteria
  "linear-gradient(180deg, #6b8cae 0%, #4a6b8a 50%, #2d4a66 100%)", // Ai — indigo
  "linear-gradient(180deg, #a8c9a0 0%, #7ba872 50%, #5a8a52 100%)", // Matcha — tea green
  "linear-gradient(180deg, #e8c4a0 0%, #d4a574 50%, #b88850 100%)", // Yūyake — sunset
  "linear-gradient(180deg, #9dd5d8 0%, #6eb5b8 50%, #4a9598 100%)", // Nami — wave / sea
]

const ONE_ACTION_OPTIONS = [
  "Join waitlist",
  "Sign up",
  "Book demo",
  "Purchase",
  "Download",
  "Other",
] as const

const ASSETS_OPTIONS = [
  "Logo",
  "Brand colors",
  "Screenshots",
  "Product visuals",
  "Copy/text",
  "None yet",
] as const

type BriefPayload = {
  name: string
  email: string
  productName: string
  website: string
  whatDoesItDo: string
  whoIsItFor: string
  whatProblem: string
  understandIn5Sec: string
  whatMakesDifferent: string
  oneAction: string
  otherAction: string
  brandThreeWords: string
  websitesLike: string
  assets: string[]
  uploadNote: string
  anythingImportant: string
  agreement: boolean
}

const initialPayload: BriefPayload = {
  name: "",
  email: "",
  productName: "",
  website: "",
  whatDoesItDo: "",
  whoIsItFor: "",
  whatProblem: "",
  understandIn5Sec: "",
  whatMakesDifferent: "",
  oneAction: "",
  otherAction: "",
  brandThreeWords: "",
  websitesLike: "",
  assets: [],
  uploadNote: "",
  anythingImportant: "",
  agreement: false,
}

function PantomLogo() {
  return (
    <svg
      width="95"
      height="35"
      viewBox="0 0 95 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      aria-hidden
    >
      <path
        d="M47.5 0C65.9526 0 81.9475 3.87685 89.8125 9.54004H88.248L83.8799 21.7412L84.6152 9.54004H80.373L76.9922 25.5H79.2812L82.5781 9.93945L81.8848 22.0137H85.791L90.1807 9.81348L86.8623 25.5H89.1719L92.1367 11.5029C93.989 13.3737 95 15.3931 95 17.5C95 27.165 73.7335 35 47.5 35C29.0913 35 13.129 31.1412 5.24414 25.5H7.10449L8.32227 19.7461H11.1367C12.6907 19.7461 14.014 19.5147 15.127 19.0527C16.2397 18.5908 17.0795 17.9189 17.6465 17.0371C18.2135 16.1552 18.5078 15.1261 18.5078 13.9502C18.5078 13.0262 18.2765 12.2277 17.8145 11.5557C17.3525 10.8839 16.7016 10.3799 15.8828 10.0439C15.0639 9.70796 14.1188 9.54006 13.0479 9.54004H7.71387L4.45801 24.9082C1.59896 22.6579 0 20.1488 0 17.5C0 7.83502 21.2665 0 47.5 0ZM71.4023 9.28809C69.6803 9.28809 68.1887 9.77081 66.9287 10.7578C65.6688 11.7447 64.7027 13.0258 64.0518 14.6006C63.4008 16.1755 63.0655 17.8138 63.0654 19.5146C63.0654 20.8376 63.2959 21.972 63.7578 22.917C64.2198 23.8619 64.8711 24.5756 65.7109 25.0586L65.7324 25.0381C66.5723 25.5209 67.5381 25.7734 68.6299 25.7734C70.3519 25.7734 71.8435 25.2897 73.1035 24.3027C74.3633 23.3158 75.3295 22.0348 75.9805 20.46C76.6314 18.885 76.9668 17.2468 76.9668 15.5459C76.9668 14.2229 76.7364 13.0885 76.2744 12.1436C75.8124 11.1987 75.1612 10.4849 74.3213 10.002C73.4813 9.51899 72.5152 9.28812 71.4023 9.28809ZM25.085 9.54004L17.252 25.5H20.0869L22.124 21.2373H28.1924L28.4238 25.5H31.2168L30.209 9.54004H25.085ZM36.4707 9.54004L33.0898 25.5H35.6523L38.9912 9.77148L39.9355 25.5H44.8291L48.21 9.54004H45.6475L42.3086 25.2686L41.3643 9.54004H36.4707ZM50.5449 9.54004L50.0615 11.8711H55.165L52.2881 25.5H55.0391L57.9365 11.8711H63.04L63.5234 9.54004H50.5449ZM70.9404 11.5352C71.9692 11.5352 72.767 11.8711 73.334 12.543C73.901 13.215 74.1738 14.1814 74.1738 15.4414C74.1738 16.7433 73.9644 18.0243 73.5234 19.2842C73.0824 20.5441 72.4733 21.5731 71.6963 22.3711C70.9193 23.1691 70.0368 23.5684 69.0498 23.5684C68.0209 23.5683 67.2232 23.2315 66.6562 22.5596H66.6768C66.11 21.8876 65.8164 20.9218 65.8164 19.6621C65.8164 18.3602 66.0259 17.0792 66.4668 15.8193C66.9077 14.5595 67.5171 13.5304 68.2939 12.7324C69.0709 11.9344 69.9534 11.5352 70.9404 11.5352ZM28.0664 18.9062H23.2363L27.5625 9.85547L28.0664 18.9062ZM12.7539 11.8496C13.7408 11.8496 14.476 12.039 14.959 12.417C15.4419 12.795 15.6729 13.3832 15.6729 14.2021C15.6728 14.8531 15.5044 15.4204 15.1895 15.9033C14.8745 16.3862 14.4121 16.7642 13.7822 17.0371C13.1524 17.3099 12.3967 17.4355 11.4941 17.4355H8.80566L10.0029 11.8496H12.7539Z"
        fill="#212121"
      />
    </svg>
  )
}

const inputPillClass =
  "h-[39px] w-full max-w-[322px] rounded-[19.5px] border-0 bg-[#E9E9E9] px-4 text-base text-[#212121] placeholder:text-[#585858]/60 focus:bg-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#888]/30 focus-visible:ring-2 focus-visible:ring-[#888]/30 focus-visible:border-transparent border-transparent"
const textareaPillClass =
  "min-h-[100px] w-full max-w-[322px] resize-y rounded-[19.5px] border-0 bg-[#E9E9E9] px-4 py-3 text-base text-[#212121] placeholder:text-[#585858]/60 focus:bg-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#888]/30 focus-visible:ring-2 focus-visible:ring-[#888]/30 focus-visible:border-transparent border-transparent"
const btnPillClass =
  "h-[39px] rounded-[19.5px] bg-[#E9E9E9] px-5 py-2 text-base font-medium text-[#585858] hover:bg-[#E0E0E0] disabled:opacity-50 transition-opacity"
const btnNextClass =
  "h-[39px] rounded-[19.5px] bg-[#2067FF] px-5 py-2 text-base font-medium text-white hover:bg-[#1856dd] disabled:opacity-50 transition-opacity"

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" className={className} aria-hidden>
      <title>download</title>
      <g fill="#A5A3A2">
        <polyline points="14 8 10 12 6 8" fill="none" stroke="#A5A3A2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <line x1="10" y1="3" x2="10" y2="12" fill="none" stroke="#A5A3A2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m17,13v1c0,1.657-1.343,3-3,3H6c-1.657,0-3-1.343-3-3v-1" fill="none" stroke="#A5A3A2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </g>
    </svg>
  )
}

/** Custom circular checkbox: hidden native input + visible circle + checkmark (peer pattern) */
function BriefCheckbox({
  checked,
  onChange,
  "aria-label": ariaLabel,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  "aria-label"?: string
  className?: string
}) {
  return (
    <span className={`relative flex size-4 shrink-0 ${className ?? ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
      />
      <span
        className="pointer-events-none size-4 rounded-full border-2 border-[#DDDDDD] bg-[#E9E9E9] transition-colors peer-checked:border-[#2067FF] peer-checked:bg-[#2067FF]"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-0 m-auto size-2.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2 6l3 3 5-6" />
      </svg>
    </span>
  )
}

export default function FoundersBriefPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState<BriefPayload>(initialPayload)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [showInvalid, setShowInvalid] = useState(false)
  const [shakeTrigger, setShakeTrigger] = useState(0)
  const [gradientIndex, setGradientIndex] = useState(0)
  const [randomiseTrigger, setRandomiseTrigger] = useState(0)
  const captureRef = useRef<HTMLDivElement>(null)
  const confettiFiredRef = useRef(false)

  const cardRandom = useMemo(() => {
    const r = () => Math.random()
    return {
      dot: { top: 50 + r() * 100, right: 15 + r() * 25, size: 6 + r() * 6 },
    }
  }, [submitted, randomiseTrigger])

  const handleRandomise = () => {
    setGradientIndex(Math.floor(Math.random() * CARD_GRADIENTS.length))
    setRandomiseTrigger((t) => t + 1)
  }

  const update = (key: keyof BriefPayload, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setShowInvalid(false)
  }

  const toggleAsset = (asset: string) => {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.includes(asset) ? prev.assets.filter((a) => a !== asset) : [...prev.assets, asset],
    }))
  }

  const hasValidEmail = /\S+@\S+\.\S+/.test(form.email.trim())
  const totalSteps = 3

  const step0Valid =
    form.name.trim() && form.email.trim() && hasValidEmail && form.productName.trim()
  const step1Valid =
    form.whatDoesItDo.trim() &&
    form.whoIsItFor.trim() &&
    form.whatProblem.trim() &&
    form.understandIn5Sec.trim() &&
    form.whatMakesDifferent.trim() &&
    form.oneAction &&
    (form.oneAction !== "Other" || form.otherAction.trim())
  const step2Valid =
    form.brandThreeWords.trim() && form.agreement

  const canNext =
    stepIndex === 0 ? step0Valid : stepIndex === 1 ? step1Valid : step2Valid
  const isLastStep = stepIndex === totalSteps - 1

  const goNext = async () => {
    if (!canNext) {
      setShakeTrigger((t) => t + 1)
      setShowInvalid(true)
      return
    }
    setShowInvalid(false)
    if (isLastStep) {
      setIsSubmitting(true)
      setSubmitError("")
      const res = await fetch("/api/founders/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).catch(() => null)
      if (!res?.ok) {
        setSubmitError("Something went wrong. Please try again.")
        setIsSubmitting(false)
        return
      }
      setSubmitted(true)
      setIsSubmitting(false)
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  const goPrev = () => {
    if (stepIndex === 0) return
    setShowInvalid(false)
    setStepIndex((i) => i - 1)
  }

  const invalid = (empty: boolean) =>
    showInvalid && empty ? "founders-brief-shake placeholder:text-[#B85450]" : ""

  useEffect(() => {
    if (submitted && !confettiFiredRef.current) {
      confettiFiredRef.current = true
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ffb7c5", "#c9b1e8", "#7c9eb2", "#c5e1a5", "#ff9a8b", "#a8edea"],
      })
    }
  }, [submitted])

  const handleSaveCard = async () => {
    const el = captureRef.current
    if (!el) return
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      })
      const link = document.createElement("a")
      link.download = `${(form.productName.trim() || "brief").replace(/[^a-zA-Z0-9-_]/g, "-")}-card.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (err) {
      console.error("Save card failed:", err)
    }
  }

  const cardContent = (
    <>
      <div className="text-white drop-shadow-md">
        <p className="text-lg font-semibold leading-tight">{form.name.trim() || "Name"}</p>
        <p className="mt-0.5 text-sm font-medium text-white/90">{form.email.trim() || "Email"}</p>
      </div>
      <div className="text-white">
        <p className="text-[22px] font-semibold leading-tight drop-shadow-sm">{form.productName.trim() || "Product"}</p>
      </div>
    </>
  )

  const cardDecor = (
    <div
      className="absolute rounded-full bg-white/20"
      style={{
        top: cardRandom.dot.top,
        right: cardRandom.dot.right,
        width: cardRandom.dot.size,
        height: cardRandom.dot.size,
      }}
      aria-hidden
    />
  )

  if (submitted) {
    return (
      <div className="page flex min-h-dvh w-full flex-col overflow-y-auto bg-white">
        <header className="flex shrink-0 items-center justify-between px-[24px] pt-[24px]">
          <div className="flex-1 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm" />
          <Link
            href="/founders"
            className="flex shrink-0 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm"
            aria-label="Pantom home"
          >
            <PantomLogo />
          </Link>
          <div className="flex flex-1 justify-end">
            <a
              href="https://cal.com/metagravity/design"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#e0e0e0] px-2 py-1 text-xs font-semibold text-[#717171] no-underline hover:bg-[#d8d8d8] sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2 md:text-base"
            >
              Book a call
            </a>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-8 px-[24px] py-16 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm">
          <h1 className="text-center text-[28px] font-semibold text-[#0c0c0c] md:text-[40px]">Thanks for your brief</h1>

          {/* Hidden flat copy for image capture (no 3D transform) */}
          <div
            ref={captureRef}
            className="fixed left-[-9999px] top-0 z-[-1] flex h-[240px] w-[240px] flex-col justify-between overflow-hidden rounded-[40px] p-5"
            style={{
              background: CARD_GRADIENTS[gradientIndex],
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15), inset 0 0 20px rgba(255,255,255,0.08)",
            }}
            aria-hidden
          >
            {cardDecor}
            {cardContent}
          </div>

          <div className="perspective-midrange">
            <div
              className="brief-success-card relative flex size-[240px] flex-col justify-between overflow-hidden rounded-[40px] p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),inset_0_0_20px_rgba(255,255,255,0.08)] transform-3d transition-transform duration-300 ease-out"
              style={{ background: CARD_GRADIENTS[gradientIndex] }}
            >
              {cardDecor}
              {cardContent}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-[#585858]">Card color</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CARD_GRADIENTS.map((grad, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGradientIndex(i)}
                  className="h-[34px] min-w-[52px] shrink-0 rounded-[17px] border-2 border-transparent transition-[transform,border-color] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#888]/40"
                  style={{
                    background: grad,
                    borderColor: gradientIndex === i ? "#212121" : undefined,
                    boxShadow: gradientIndex === i ? "0 0 0 2px #fff" : undefined,
                  }}
                  aria-label={`Gradient ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleSaveCard}
              className="inline-flex items-center gap-2 rounded-full bg-[#EBEBEB] px-4 py-2.5 text-base font-semibold text-[#585858] transition-colors hover:bg-[#E0E0E0]"
              aria-label="Save card as image"
            >
              <DownloadIcon />
              Save card
            </button>
            <button
              type="button"
              onClick={handleRandomise}
              className="inline-flex items-center gap-2 rounded-full bg-[#EBEBEB] px-4 py-2.5 text-base font-semibold text-[#585858] transition-colors hover:bg-[#E0E0E0]"
              aria-label="Randomise card look"
            >
              Randomise
            </button>
            <Link
              href="/founders"
              className="inline-block rounded-full bg-[#EBEBEB] px-5 py-2.5 text-base font-semibold text-[#767676] no-underline hover:bg-[#e0e0e0]"
            >
              Back to founders
            </Link>
          </div>

          <p className="max-w-md text-center text-sm text-[#767676]">We’ll review it and get back to you with next steps.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="page flex min-h-dvh w-full flex-col overflow-y-auto bg-white">
      <header className="flex shrink-0 items-center justify-between px-[24px] pt-[24px]">
        <div className="flex-1 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm" />
        <Link
          href="/founders"
          className="flex shrink-0 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm"
          aria-label="Pantom home"
        >
          <PantomLogo />
        </Link>
        <div className="flex flex-1 justify-end">
          <a
            href="https://cal.com/metagravity/design"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#e0e0e0] px-2 py-1 text-xs font-semibold text-[#717171] no-underline hover:bg-[#d8d8d8] sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2 md:text-base"
          >
            Book a call
          </a>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-[24px] py-10 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm">
        <div className="flex w-full max-w-[322px] flex-col items-center gap-3">
          {/* Step 0: Basics */}
          {stepIndex === 0 && (
            <>
              <Input
                key={`name-${shakeTrigger}`}
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Name"
                className={`${inputPillClass} ${invalid(!form.name.trim())}`}
                aria-label="Your name"
              />
              <Input
                key={`email-${shakeTrigger}`}
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="Email"
                className={`${inputPillClass} ${invalid(!form.email.trim() || !hasValidEmail)}`}
                aria-label="Email address"
              />
              <Input
                key={`productName-${shakeTrigger}`}
                type="text"
                value={form.productName}
                onChange={(e) => update("productName", e.target.value)}
                placeholder="Product name"
                className={`${inputPillClass} ${invalid(!form.productName.trim())}`}
                aria-label="Product name"
              />
              <div className="relative w-full max-w-[322px]">
                <Input
                  type="url"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="Website url"
                  className={`${inputPillClass} pr-16`}
                  aria-label="Website (optional)"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#585858]/60">
                  Optional
                </span>
              </div>
            </>
          )}

          {/* Step 1: Product + Message */}
          {stepIndex === 1 && (
            <>
              <Textarea
                key={`whatDoesItDo-${shakeTrigger}`}
                value={form.whatDoesItDo}
                onChange={(e) => update("whatDoesItDo", e.target.value)}
                placeholder="What does your product do? (one sentence)"
                className={`${textareaPillClass} ${invalid(!form.whatDoesItDo.trim())}`}
                aria-label="What does your product do"
              />
              <Textarea
                key={`whoIsItFor-${shakeTrigger}`}
                value={form.whoIsItFor}
                onChange={(e) => update("whoIsItFor", e.target.value)}
                placeholder="Who is it for?"
                className={`${textareaPillClass} ${invalid(!form.whoIsItFor.trim())}`}
                aria-label="Who is it for"
              />
              <Textarea
                key={`whatProblem-${shakeTrigger}`}
                value={form.whatProblem}
                onChange={(e) => update("whatProblem", e.target.value)}
                placeholder="What problem does it solve?"
                className={`${textareaPillClass} ${invalid(!form.whatProblem.trim())}`}
                aria-label="What problem does it solve"
              />
              <Textarea
                key={`understandIn5Sec-${shakeTrigger}`}
                value={form.understandIn5Sec}
                onChange={(e) => update("understandIn5Sec", e.target.value)}
                placeholder="What should visitors get in 5 seconds?"
                className={`${textareaPillClass} ${invalid(!form.understandIn5Sec.trim())}`}
                aria-label="5 second takeaway"
              />
              <Textarea
                key={`whatMakesDifferent-${shakeTrigger}`}
                value={form.whatMakesDifferent}
                onChange={(e) => update("whatMakesDifferent", e.target.value)}
                placeholder="What makes you different?"
                className={`${textareaPillClass} ${invalid(!form.whatMakesDifferent.trim())}`}
                aria-label="What makes you different"
              />
              <select
                key={`oneAction-${shakeTrigger}`}
                value={form.oneAction}
                onChange={(e) => update("oneAction", e.target.value)}
                className={`${inputPillClass} appearance-none bg-[#E9E9E9] pr-10 ${invalid(!form.oneAction || (form.oneAction === "Other" && !form.otherAction.trim()))}`}
                aria-label="One action visitors should take"
              >
                <option value="">One action (e.g. Join waitlist)</option>
                {ONE_ACTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {form.oneAction === "Other" && (
                <Input
                  key={`otherAction-${shakeTrigger}`}
                  type="text"
                  value={form.otherAction}
                  onChange={(e) => update("otherAction", e.target.value)}
                  placeholder="Other action"
                  className={`${inputPillClass} ${invalid(!form.otherAction.trim())}`}
                  aria-label="Other action"
                />
              )}
            </>
          )}

          {/* Step 2: Direction, Assets, Final, Agreement */}
          {stepIndex === 2 && (
            <>
              <Input
                key={`brandThreeWords-${shakeTrigger}`}
                type="text"
                value={form.brandThreeWords}
                onChange={(e) => update("brandThreeWords", e.target.value)}
                placeholder="Brand in 3 words"
                className={`${inputPillClass} ${invalid(!form.brandThreeWords.trim())}`}
                aria-label="Brand in 3 words"
              />
              <Textarea
                value={form.websitesLike}
                onChange={(e) => update("websitesLike", e.target.value)}
                placeholder="1–3 websites you like (optional)"
                className={textareaPillClass}
                aria-label="Websites you like"
              />
              <div className="flex w-full max-w-[322px] flex-wrap justify-center gap-2">
                {ASSETS_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-[19.5px] bg-[#E9E9E9] px-3 py-2 text-sm font-medium text-[#585858] hover:bg-[#E0E0E0]"
                  >
                    <BriefCheckbox
                      checked={form.assets.includes(opt)}
                      onChange={() => toggleAsset(opt)}
                      aria-label={opt}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              <Input
                type="text"
                value={form.uploadNote}
                onChange={(e) => update("uploadNote", e.target.value)}
                placeholder="Upload note (optional)"
                className={inputPillClass}
                aria-label="Upload assets note"
              />
              <Textarea
                value={form.anythingImportant}
                onChange={(e) => update("anythingImportant", e.target.value)}
                placeholder="Anything else we should know? (optional)"
                className={textareaPillClass}
                aria-label="Anything important"
              />
              <label
                key={`agreement-${shakeTrigger}`}
                className={`flex w-full max-w-[322px] cursor-pointer items-start gap-3 rounded-[19.5px] bg-[#E9E9E9] px-4 py-3 ${showInvalid && !form.agreement ? "founders-brief-shake" : ""}`}
              >
                <BriefCheckbox
                  checked={form.agreement}
                  onChange={(v) => update("agreement", v)}
                  aria-label="Agree to terms"
                  className="mt-0.5"
                />
                <span className={`text-sm ${showInvalid && !form.agreement ? "text-[#B85450]" : "text-[#585858]"}`}>
                  One landing page sprint, 3–5 days, one revision included.
                </span>
              </label>
            </>
          )}

          {form.email.trim() && stepIndex === 0 && !hasValidEmail && (
            <p className="text-sm text-[#B85450]">Enter a valid email.</p>
          )}
          {submitError && <p className="text-sm text-[#B85450]">{submitError}</p>}

          <div className="mt-6 flex w-full max-w-[322px] items-center justify-between gap-4">
            {stepIndex === 0 ? (
              <Link
                key={`prev-${shakeTrigger}`}
                href="/founders"
                className={`${btnPillClass} ${showInvalid ? "founders-brief-shake" : ""}`}
              >
                Previous
              </Link>
            ) : (
              <button
                key={`prev-${shakeTrigger}`}
                type="button"
                onClick={goPrev}
                className={`${btnPillClass} ${showInvalid ? "founders-brief-shake" : ""}`}
              >
                Previous
              </button>
            )}
            <button
              key={`next-${shakeTrigger}`}
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className={`${btnNextClass} ${!canNext ? "opacity-60" : ""} ${showInvalid && !canNext ? "founders-brief-shake" : ""}`}
            >
              {isLastStep ? (isSubmitting ? "Sending…" : "Submit Brief") : "Next"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
