export type AnalyticsSource = "nav" | "folder" | "command" | "other"

export type AnalyticsClickEvent = {
  occurredAt: string
  source: AnalyticsSource
  label: string
  href: string
}

export type AnalyticsTargetStat = {
  href: string
  label: string
  clicks: number
  uniqueDays: number
}

export type AnalyticsTimePoint = {
  label: string
  clicks: number
}

export type AnalyticsSummary = {
  totalClicks: number
  last24hClicks: number
  uniqueTargets: number
  topTargets: AnalyticsTargetStat[]
  sourceBreakdown: Array<{ source: AnalyticsSource; clicks: number }>
  dailyClicks: AnalyticsTimePoint[]
  hourlyClicks: AnalyticsTimePoint[]
  recentEvents: AnalyticsClickEvent[]
}
