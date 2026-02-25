import type { Metadata } from "next"
import Link from "next/link"

import { getFoundersSlots } from "@/lib/founders-slots"

export const metadata: Metadata = {
  title: "Founders | Pantom Portfolio",
  description: "Landing page for startup founders.",
  alternates: {
    canonical: "/founders",
  },
}

const pills = [
  "+ 3 - 5 delivery time",
  "+ One complete landing page delivered in figma",
  "+ No template work fully custom",
]

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M9 3.25V14.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.25 9H14.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PantomLogo() {
  return (
    <svg
      width="95"
      height="35"
      viewBox="0 0 95 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block w-[72px] sm:w-[95px] h-auto"
      aria-hidden
    >
      <path
        d="M47.5 0C65.9526 0 81.9475 3.87685 89.8125 9.54004H88.248L83.8799 21.7412L84.6152 9.54004H80.373L76.9922 25.5H79.2812L82.5781 9.93945L81.8848 22.0137H85.791L90.1807 9.81348L86.8623 25.5H89.1719L92.1367 11.5029C93.989 13.3737 95 15.3931 95 17.5C95 27.165 73.7335 35 47.5 35C29.0913 35 13.129 31.1412 5.24414 25.5H7.10449L8.32227 19.7461H11.1367C12.6907 19.7461 14.014 19.5147 15.127 19.0527C16.2397 18.5908 17.0795 17.9189 17.6465 17.0371C18.2135 16.1552 18.5078 15.1261 18.5078 13.9502C18.5078 13.0262 18.2765 12.2277 17.8145 11.5557C17.3525 10.8839 16.7016 10.3799 15.8828 10.0439C15.0639 9.70796 14.1188 9.54006 13.0479 9.54004H7.71387L4.45801 24.9082C1.59896 22.6579 0 20.1488 0 17.5C0 7.83502 21.2665 0 47.5 0ZM71.4023 9.28809C69.6803 9.28809 68.1887 9.77081 66.9287 10.7578C65.6688 11.7447 64.7027 13.0258 64.0518 14.6006C63.4008 16.1755 63.0655 17.8138 63.0654 19.5146C63.0654 20.8376 63.2959 21.972 63.7578 22.917C64.2198 23.8619 64.8711 24.5756 65.7109 25.0586L65.7324 25.0381C66.5723 25.5209 67.5381 25.7734 68.6299 25.7734C70.3519 25.7734 71.8435 25.2897 73.1035 24.3027C74.3633 23.3158 75.3295 22.0348 75.9805 20.46C76.6314 18.885 76.9668 17.2468 76.9668 15.5459C76.9668 14.2229 76.7364 13.0885 76.2744 12.1436C75.8124 11.1987 75.1612 10.4849 74.3213 10.002C73.4813 9.51899 72.5152 9.28812 71.4023 9.28809ZM25.085 9.54004L17.252 25.5H20.0869L22.124 21.2373H28.1924L28.4238 25.5H31.2168L30.209 9.54004H25.085ZM36.4707 9.54004L33.0898 25.5H35.6523L38.9912 9.77148L39.9355 25.5H44.8291L48.21 9.54004H45.6475L42.3086 25.2686L41.3643 9.54004H36.4707ZM50.5449 9.54004L50.0615 11.8711H55.165L52.2881 25.5H55.0391L57.9365 11.8711H63.04L63.5234 9.54004H50.5449ZM70.9404 11.5352C71.9692 11.5352 72.767 11.8711 73.334 12.543C73.901 13.215 74.1738 14.1814 74.1738 15.4414C74.1738 16.7433 73.9644 18.0243 73.5234 19.2842C73.0824 20.5441 72.4733 21.5731 71.6963 22.3711C70.9193 23.1691 70.0368 23.5684 69.0498 23.5684C68.0209 23.5683 67.2232 23.2315 66.6562 22.5596H66.6768C66.11 21.8876 65.8164 20.9218 65.8164 19.6621C65.8164 18.3602 66.0259 17.0792 66.4668 15.8193C66.9077 14.5595 67.5171 13.5304 68.2939 12.7324C69.0709 11.9344 69.9534 11.5352 70.9404 11.5352ZM28.0664 18.9062H23.2363L27.5625 9.85547L28.0664 18.9062ZM12.7539 11.8496C13.7408 11.8496 14.476 12.039 14.959 12.417C15.4419 12.795 15.6729 13.3832 15.6729 14.2021C15.6728 14.8531 15.5044 15.4204 15.1895 15.9033C14.8745 16.3862 14.4121 16.7642 13.7822 17.0371C13.1524 17.3099 12.3967 17.4355 11.4941 17.4355H8.80566L10.0029 11.8496H12.7539Z"
        fill="#212121"
      />
    </svg>
  )
}

export default async function FoundersPage() {
  const slotsLeft = await getFoundersSlots()
  return (
    <div className="page flex min-h-dvh w-full min-w-0 flex-col overflow-x-hidden bg-white">
      <header className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6 md:px-[24px] md:pt-[24px]">
        <div className="flex-1 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm" />
        <Link href="/" className="founders-logo-shimmer flex shrink-0 transition-[filter] duration-300 [.page:has(.book-a-call:hover)_&]:blur-sm" aria-label="Pantom home">
          <PantomLogo />
        </Link>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="rounded-full bg-[#f0f0f0] px-3 py-1.5 font-sans text-sm font-semibold text-[#a5a5a5] no-underline transition-colors duration-200 hover:bg-[#e8e8e8] hover:text-[#8a8a8a] sm:px-4 sm:py-2 sm:text-base"
          >
            works
          </Link>
          <a
            href="https://cal.com/metagravity/design"
            target="_blank"
            rel="noopener noreferrer"
            className="book-a-call rounded-full bg-[#e0e0e0] px-3 py-1.5 font-sans text-sm font-semibold text-[#717171] no-underline hover:bg-[#d8d8d8] sm:px-4 sm:py-2 sm:text-base"
          >
            Book a call
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pt-16 pb-12 transition-[filter] duration-300 sm:px-5 sm:pt-20 sm:pb-14 md:pt-[122px] md:px-[40px] md:pb-[40px] [.page:has(.book-a-call:hover)_&]:blur-sm">
        <h1 className="text-balance text-center text-[28px] font-semibold leading-tight tracking-[-0.01em] text-[#666666] sm:text-[32px] md:text-[52px]">
          landing page for
          <br />
          <span className="text-[#0c0c0c]">startup founders</span>
        </h1>

        <div className="mt-5 flex max-w-full flex-col items-center gap-2 overflow-x-auto px-1 sm:mt-6 sm:gap-[8px]">
          {pills.map((label, index) => {
            const hoverColors = ["group-hover:text-[#EC4899]", "group-hover:text-[#2067FF]", "group-hover:text-[#10B981]"] as const
            const hoverColor = hoverColors[index] ?? "group-hover:text-[#2067FF]"
            return (
              <div
                key={label}
                className="group inline-flex w-max cursor-default items-center justify-center gap-1.5 rounded-[70px] bg-[#EBEBEB] px-2 py-1.5 transition-colors"
              >
                <span className={`inline-block shrink-0 text-[#9D9D9D] transition-transform duration-300 group-hover:rotate-180 ${hoverColor}`}>
                  <PlusIcon className="shrink-0" />
                </span>
                <span className="whitespace-nowrap text-center text-xs font-medium text-[#767676] sm:text-base">{label.replace(/^\+ /, "")}</span>
              </div>
            )
          })}
        </div>

        <div className="group founders-card-group mt-12 flex flex-col items-center sm:mt-16 md:mt-[98px]">
          <a
            href="https://metagravity.gumroad.com/l/founders"
            target="_blank"
            rel="noopener noreferrer"
            className="relative block size-[200px] cursor-pointer overflow-hidden rounded-[32px] bg-[#DDDDDD] shadow-[inset_0_0_20px_rgba(0,0,0,0.04)] transition-colors duration-300 group-hover:bg-[#C8C8C8] sm:size-[220px] sm:rounded-[36px] md:size-[240px] md:rounded-[40px]"
          >
            <div className="absolute left-3 top-3 flex size-12 items-center justify-center rounded-full bg-white transition-transform duration-500 sm:left-4 sm:top-4 sm:size-14 md:left-[18px] md:top-[18px] md:size-[60px] group-hover:rotate-360">
              <span className="relative size-5 text-[#252525]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-0" aria-hidden>
                  <path d="M10 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
                  <line x1="4" y1="16" x2="16" y2="4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <polyline points="16 11 16 4 9 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-[#585858] sm:bottom-4 sm:left-4 sm:right-4 md:bottom-[18px] md:left-[18px] md:right-[18px]">
              <span className="text-[20px] font-semibold sm:text-[22px] md:text-[24px]">$951</span>
              <span className="text-[14px] font-medium line-through text-[#585858]/50 sm:text-[15px] md:text-[16px]">$2699</span>
            </div>
          </a>
          <p className="founders-click-shiver founders-click-shimmer mt-3 flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 font-sans text-[13px] font-semibold text-[#B8B8B8] transition-colors duration-300 group-hover:text-[#3E3E3E] hover:text-[#2E2E2E] sm:mt-4 sm:text-[14px]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden
            >
              <path
                d="M13.2222 4.47287C13.2222 3.29298 12.2632 2.33398 11.0833 2.33398H2.91666C1.73677 2.33398 0.777771 3.29298 0.777771 4.47287V5.05621H13.2222V4.47287Z"
                fill="currentColor"
              />
              <path
                d="M0.777771 9.52821C0.777771 10.7081 1.73677 11.6671 2.91666 11.6671H11.0833C12.2632 11.6671 13.2222 10.7081 13.2222 9.52821V6.22266H0.777771V9.52821ZM9.91666 8.1671H10.6944C11.0164 8.1671 11.2778 8.42843 11.2778 8.75043C11.2778 9.07243 11.0164 9.33377 10.6944 9.33377H9.91666C9.59466 9.33377 9.33333 9.07243 9.33333 8.75043C9.33333 8.42843 9.59466 8.1671 9.91666 8.1671ZM3.30555 8.1671H5.63888C5.96088 8.1671 6.22222 8.42843 6.22222 8.75043C6.22222 9.07243 5.96088 9.33377 5.63888 9.33377H3.30555C2.98355 9.33377 2.72222 9.07243 2.72222 8.75043C2.72222 8.42843 2.98355 8.1671 3.30555 8.1671Z"
                fill="currentColor"
              />
            </svg>
            Click to buy
          </p>
        </div>

        <div className="fixed bottom-[max(18px,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center pointer-events-none">
          <div className="inline-flex items-center justify-center gap-1.5 rounded-[70px] bg-[#EBEBEB] px-2 py-1.5 pointer-events-auto">
            <span className="founders-dot-pulse size-[9px] shrink-0 rounded-full bg-[#2067FF]/70" aria-hidden />
            <span className="text-center text-sm font-medium text-[#767676] sm:text-base">{slotsLeft} founder{slotsLeft === 1 ? "" : "s"} slot left</span>
          </div>
        </div>
      </main>
    </div>
  )
}
