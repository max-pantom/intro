"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { AnalyticsSummary } from "@/lib/analytics-types"

const EMPTY_SUMMARY: AnalyticsSummary = {
  generatedAt: "",
  realTimeViews: 0,
  totalEvents: 0,
  totalClicks: 0,
  last24hClicks: 0,
  uniqueTargets: 0,
  topTargets: [],
  sourceBreakdown: [
    { source: "nav", clicks: 0 },
    { source: "folder", clicks: 0 },
    { source: "command", clicks: 0 },
    { source: "other", clicks: 0 },
  ],
  dailyClicks: [],
  hourlyClicks: [],
  weeklyTrends: [],
  conversionFunnel: {
    landingSessions: 0,
    caseStudySessions: 0,
    contactSectionSessions: 0,
    contactClickSessions: 0,
    landingToCaseRate: 0,
    caseToContactRate: 0,
    contactToClickRate: 0,
  },
  topContent: [],
  outboundQuality: [],
  scrollDepthByPage: [],
  sectionVisibility: [],
  audienceSegments: {
    byDevice: [],
    bySource: [],
    byCountry: [],
    byHour: [],
  },
  contentImpact: {
    latestPublishAt: null,
    beforeCtr: 0,
    afterCtr: 0,
    deltaPct: 0,
  },
  performanceVitals: {
    byPage: [],
    correlation: {
      poorVitalsBounceRate: 0,
      goodVitalsBounceRate: 0,
    },
  },
  anomalyAlerts: [],
  botStats: {
    filteredEvents: 0,
    botSharePct: 0,
  },
  recentEvents: [],
}

function buildLinePoints(values: number[], width: number, height: number) {
  if (values.length === 0) return ""

  const maxValue = Math.max(...values, 1)
  const stepX = values.length > 1 ? width / (values.length - 1) : width

  return values
    .map((value, index) => {
      const x = index * stepX
      const y = height - (value / maxValue) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")
}

function formatPercent(part: number, total: number) {
  if (total === 0) return "0%"
  return `${Math.round((part / total) * 100)}%`
}

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary>(EMPTY_SUMMARY)
  const [isLoading, setIsLoading] = useState(true)
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [days, setDays] = useState(14)

  const loadSummary = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/analytics?days=${days}`, { cache: "no-store" })

      if (response.status === 401) {
        setIsUnauthorized(true)
        setErrorMessage("")
        return
      }

      if (!response.ok) {
        setErrorMessage("Could not load analytics data.")
        return
      }

      const payload = (await response.json()) as AnalyticsSummary
      setSummary(payload)
      setIsUnauthorized(false)
      setErrorMessage("")
    } catch {
      setErrorMessage("Could not connect to analytics endpoint.")
    } finally {
      setIsLoading(false)
    }
  }, [days])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSummary()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadSummary])

  const dailyChart = useMemo(() => {
    const values = summary.dailyClicks.map((point) => point.clicks)
    const points = buildLinePoints(values, 700, 180)
    const maxValue = Math.max(...values, 1)

    return { maxValue, points }
  }, [summary.dailyClicks])

  const hourlyMax = useMemo(() => Math.max(...summary.hourlyClicks.map((point) => point.clicks), 1), [summary.hourlyClicks])

  const trackedSourceStats = useMemo(() => {
    const sourceMap = new Map(summary.sourceBreakdown.map((row) => [row.source, row.clicks]))
    return {
      nav: sourceMap.get("nav") ?? 0,
      folder: sourceMap.get("folder") ?? 0,
      command: sourceMap.get("command") ?? 0,
      outbound: sourceMap.get("outbound") ?? 0,
    }
  }, [summary.sourceBreakdown])

  const deviceStats = useMemo(
    () => [...summary.audienceSegments.byDevice].sort((a, b) => b.sessions - a.sessions),
    [summary.audienceSegments.byDevice],
  )

  if (isLoading) {
    return (
      <main className="analytics-scrollbar flex h-dvh items-center justify-center overflow-y-auto bg-[#efefef] px-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[#7a7a7a]">Loading analytics...</p>
      </main>
    )
  }

  if (isUnauthorized) {
    return (
      <main className="analytics-scrollbar flex h-dvh items-center justify-center overflow-y-auto bg-[#efefef] px-4 py-8">
        <section className="w-full max-w-[560px] border border-[#d7d7d7] bg-[#f4f4f4] p-5">
          <p className="text-[14px] font-semibold text-[#555555]">Unauthorized</p>
          <p className="mt-1 text-[12px] text-[#7b7b7b]">Login through the CMS admin page first.</p>
          <Link href="/admin" className="mt-4 inline-flex h-9 items-center border border-[#c9c9c9] bg-[#f7f7f7] px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]">
            Go To Admin
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="analytics-scrollbar h-dvh overflow-x-auto overflow-y-auto bg-[#efefef] p-2 sm:p-3">
      <section className="mx-auto w-full max-w-[1420px]">
        <div className="flex flex-wrap items-center justify-between gap-2 border border-[#dbdbdb] bg-[#ececec] px-3 py-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">Admin Analytics</p>
            <p className="text-[11px] text-[#747474]">Clicks and behavior tracked from nav, folders, and command actions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a7a7a]">Window</label>
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="h-8 border border-[#c9c9c9] bg-[#f7f7f7] px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#636363]"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
            </select>
            <button
              type="button"
              onClick={() => void loadSummary()}
              className="inline-flex h-8 items-center border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]"
            >
              Refresh
            </button>
            <Link href="/admin" className="inline-flex h-8 items-center border border-[#c9c9c9] bg-[#f7f7f7] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636363]">
              Back To CMS
            </Link>
          </div>
        </div>

        {errorMessage ? <p className="mt-2 text-[12px] text-[#a9182d]">{errorMessage}</p> : null}

        <section className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-[#dbdbdb] bg-[#ececec] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8d8d8d]">Total Clicks</p>
            <p className="mt-1 text-[28px] font-semibold text-[#494949]">{summary.totalClicks.toLocaleString()}</p>
          </div>
          <div className="border border-[#dbdbdb] bg-[#ececec] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8d8d8d]">Last 24h</p>
            <p className="mt-1 text-[28px] font-semibold text-[#494949]">{summary.last24hClicks.toLocaleString()}</p>
          </div>
          <div className="border border-[#dbdbdb] bg-[#ececec] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8d8d8d]">Unique Targets</p>
            <p className="mt-1 text-[28px] font-semibold text-[#494949]">{summary.uniqueTargets.toLocaleString()}</p>
          </div>
          <div className="border border-[#dbdbdb] bg-[#ececec] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8d8d8d]">Tracked Events</p>
            <p className="mt-1 text-[28px] font-semibold text-[#494949]">{summary.recentEvents.length.toLocaleString()}</p>
          </div>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[1.5fr_1fr]">
          <div className="border border-[#dbdbdb] bg-[#ececec] p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Daily Click Trend</p>
            <div className="mt-3 border border-[#d8d8d8] bg-[#f5f5f5] p-2">
              <svg viewBox="0 0 700 180" className="h-[220px] w-full" preserveAspectRatio="none" role="img" aria-label="Daily clicks line chart">
                {[0, 1, 2, 3].map((line) => {
                  const y = (180 / 3) * line
                  return <line key={line} x1="0" y1={y} x2="700" y2={y} stroke="#d8d8d8" strokeWidth="1" />
                })}
                {dailyChart.points ? (
                  <polyline fill="none" stroke="#4e6acc" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={dailyChart.points} />
                ) : null}
              </svg>
              <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8c8c8c]">
                <span>{summary.dailyClicks[0]?.label ?? "-"}</span>
                <span>Peak {dailyChart.maxValue}</span>
                <span>{summary.dailyClicks.at(-1)?.label ?? "-"}</span>
              </div>
            </div>
          </div>

          <div className="border border-[#dbdbdb] bg-[#ececec] p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Source Breakdown</p>
            <div className="mt-3 space-y-2">
              {summary.sourceBreakdown.map((row) => (
                <div key={row.source} className="border border-[#d8d8d8] bg-[#f5f5f5] p-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#595959]">
                    <span className="uppercase tracking-[0.08em]">{row.source}</span>
                    <span>{row.clicks}</span>
                  </div>
                  <div className="mt-1 h-2 w-full bg-[#e4e4e4]">
                    <div className="h-2 bg-[#7d8ecf]" style={{ width: formatPercent(row.clicks, summary.totalClicks) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-3 border border-[#dbdbdb] bg-[#ececec] p-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Hourly Clicks (Last 24 Hours)</p>
          <div className="mt-3 flex h-[180px] items-end gap-1 overflow-x-auto border border-[#d8d8d8] bg-[#f5f5f5] p-2">
            {summary.hourlyClicks.map((point, index) => (
              <div key={`${point.label}-${index}`} className="flex min-w-6 flex-1 flex-col items-center justify-end gap-1">
                <div className="w-full bg-[#7d8ecf]" style={{ height: `${Math.max(2, (point.clicks / hourlyMax) * 130)}px` }} title={`${point.label}: ${point.clicks}`} />
                <span className="text-[9px] text-[#8a8a8a]">{index % 3 === 0 ? point.label : ""}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_1fr]">
          <div className="border border-[#dbdbdb] bg-[#ececec] p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Tracked Intent Channels</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="border border-[#d8d8d8] bg-[#f5f5f5] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#8d8d8d]">Nav Clicks</p>
                <p className="mt-1 text-[22px] font-semibold text-[#494949]">{trackedSourceStats.nav.toLocaleString()}</p>
              </div>
              <div className="border border-[#d8d8d8] bg-[#f5f5f5] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#8d8d8d]">Folder Clicks</p>
                <p className="mt-1 text-[22px] font-semibold text-[#494949]">{trackedSourceStats.folder.toLocaleString()}</p>
              </div>
              <div className="border border-[#d8d8d8] bg-[#f5f5f5] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#8d8d8d]">Command Clicks</p>
                <p className="mt-1 text-[22px] font-semibold text-[#494949]">{trackedSourceStats.command.toLocaleString()}</p>
              </div>
              <div className="border border-[#d8d8d8] bg-[#f5f5f5] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#8d8d8d]">Outbound Clicks</p>
                <p className="mt-1 text-[22px] font-semibold text-[#494949]">{trackedSourceStats.outbound.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="border border-[#dbdbdb] bg-[#ececec] p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Device Segments</p>
            <div className="mt-3 overflow-x-auto border border-[#d8d8d8] bg-[#f5f5f5]">
              <div className="min-w-[460px]">
                <div className="grid grid-cols-[1.2fr_100px_100px_120px] border-b border-[#dcdcdc] text-[11px] font-semibold text-[#8a8a8a]">
                  <div className="border-r border-[#dedede] px-3 py-2">Device</div>
                  <div className="border-r border-[#dedede] px-3 py-2">Sessions</div>
                  <div className="border-r border-[#dedede] px-3 py-2">Clicks</div>
                  <div className="px-3 py-2">Contact Clicks</div>
                </div>
                {deviceStats.map((device) => (
                  <div key={device.label} className="grid grid-cols-[1.2fr_100px_100px_120px] border-b border-[#dcdcdc] text-[11px] text-[#4f4f4f]">
                    <div className="border-r border-[#dedede] px-3 py-2 font-semibold uppercase">{device.label || "unknown"}</div>
                    <div className="border-r border-[#dedede] px-3 py-2">{device.sessions.toLocaleString()}</div>
                    <div className="border-r border-[#dedede] px-3 py-2">{device.clicks.toLocaleString()}</div>
                    <div className="px-3 py-2">{device.contactClicks.toLocaleString()}</div>
                  </div>
                ))}
                {deviceStats.length === 0 ? <div className="px-3 py-3 text-[11px] text-[#757575]">No device data yet.</div> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-2">
          <div className="border border-[#dbdbdb] bg-[#ececec]">
            <div className="border-b border-[#d9d9d9] bg-[#ebebeb] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Top Click Targets</div>
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[60px_1.2fr_2fr_90px_90px] border-b border-[#dcdcdc] text-[11px] font-semibold text-[#8a8a8a]">
                  <div className="border-r border-[#dedede] px-3 py-2">#</div>
                  <div className="border-r border-[#dedede] px-3 py-2">Label</div>
                  <div className="border-r border-[#dedede] px-3 py-2">Href</div>
                  <div className="border-r border-[#dedede] px-3 py-2">Clicks</div>
                  <div className="px-3 py-2">Days</div>
                </div>
                {summary.topTargets.map((target, index) => (
                  <div key={`${target.href}-${index}`} className="grid grid-cols-[60px_1.2fr_2fr_90px_90px] border-b border-[#dcdcdc] text-[11px] text-[#4f4f4f]">
                    <div className="border-r border-[#dedede] px-3 py-2 font-semibold">{index + 1}</div>
                    <div className="truncate border-r border-[#dedede] px-3 py-2 font-semibold">{target.label}</div>
                    <div className="truncate border-r border-[#dedede] px-3 py-2">{target.href}</div>
                    <div className="border-r border-[#dedede] px-3 py-2 font-semibold">{target.clicks}</div>
                    <div className="px-3 py-2 font-semibold">{target.uniqueDays}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-[#dbdbdb] bg-[#ececec]">
            <div className="border-b border-[#d9d9d9] bg-[#ebebeb] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">Recent Click Events</div>
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[130px_100px_1.2fr_2fr] border-b border-[#dcdcdc] text-[11px] font-semibold text-[#8a8a8a]">
                  <div className="border-r border-[#dedede] px-3 py-2">Time</div>
                  <div className="border-r border-[#dedede] px-3 py-2">Source</div>
                  <div className="border-r border-[#dedede] px-3 py-2">Label</div>
                  <div className="px-3 py-2">Href</div>
                </div>
                {summary.recentEvents.map((event, index) => (
                  <div key={`${event.occurredAt}-${index}`} className="grid grid-cols-[130px_100px_1.2fr_2fr] border-b border-[#dcdcdc] text-[11px] text-[#4f4f4f]">
                    <div className="border-r border-[#dedede] px-3 py-2 font-semibold">{new Date(event.occurredAt).toLocaleTimeString()}</div>
                    <div className="border-r border-[#dedede] px-3 py-2 font-semibold uppercase">{event.sourceContext || "-"}</div>
                    <div className="truncate border-r border-[#dedede] px-3 py-2">{event.label}</div>
                    <div className="truncate px-3 py-2">{event.href}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
