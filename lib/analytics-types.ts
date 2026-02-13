export type AnalyticsSource = "nav" | "folder" | "command" | "gallery" | "outbound" | "section" | "scroll" | "performance" | "system" | "other"

export type AnalyticsDevice = "mobile" | "tablet" | "desktop" | "bot" | "unknown"

export type AnalyticsEvent = {
  occurredAt: string
  eventName: string
  sessionId: string
  path: string
  source: AnalyticsSource
  sourceContext: string
  label: string
  href: string
  section: string
  itemId: string
  itemType: string
  value: number
  durationMs: number
  isBot: boolean
  meta: {
    referrer: string
    referrerHost: string
    utmSource: string
    utmMedium: string
    utmCampaign: string
    locale: string
    timezone: string
    country: string
    city: string
    userAgent: string
    device: AnalyticsDevice
    metricName: "LCP" | "INP" | "CLS" | "OTHER" | ""
  }
}

export type AnalyticsTimePoint = {
  label: string
  clicks: number
}

export type AnalyticsWeeklyTrendPoint = {
  label: string
  clicks: number
  conversions: number
}

export type AnalyticsTargetStat = {
  href: string
  label: string
  clicks: number
  uniqueDays: number
}

export type AnalyticsContentStat = {
  itemId: string
  label: string
  itemType: string
  opens: number
  avgViewSeconds: number
  contactFollowThroughRate: number
}

export type AnalyticsOutboundQualityStat = {
  href: string
  sourceContext: string
  clicks: number
  contactClicks: number
}

export type AnalyticsScrollDepthStat = {
  path: string
  avgDepth: number
  p75Depth: number
  sessions: number
}

export type AnalyticsSectionStat = {
  section: string
  views: number
  uniqueSessions: number
  dropOffRate: number
}

export type AnalyticsSegmentStat = {
  label: string
  sessions: number
  clicks: number
  contactClicks: number
}

export type AnalyticsHourStat = {
  hour: string
  clicks: number
}

export type AnalyticsFunnel = {
  landingSessions: number
  caseStudySessions: number
  contactSectionSessions: number
  contactClickSessions: number
  landingToCaseRate: number
  caseToContactRate: number
  contactToClickRate: number
}

export type AnalyticsContentImpact = {
  latestPublishAt: string | null
  beforeCtr: number
  afterCtr: number
  deltaPct: number
}

export type AnalyticsVitalsByPage = {
  path: string
  lcp: number
  inp: number
  cls: number
  samples: number
  bounceRate: number
}

export type AnalyticsVitalsCorrelation = {
  poorVitalsBounceRate: number
  goodVitalsBounceRate: number
}

export type AnalyticsVitalsSummary = {
  byPage: AnalyticsVitalsByPage[]
  correlation: AnalyticsVitalsCorrelation
}

export type AnalyticsBotStats = {
  filteredEvents: number
  botSharePct: number
}

export type AnalyticsRecentEvent = {
  occurredAt: string
  eventName: string
  sourceContext: string
  label: string
  href: string
  path: string
}

export type AnalyticsSummary = {
  generatedAt: string
  realTimeViews: number
  totalEvents: number
  totalClicks: number
  last24hClicks: number
  uniqueTargets: number
  topTargets: AnalyticsTargetStat[]
  sourceBreakdown: Array<{ source: string; clicks: number }>
  dailyClicks: AnalyticsTimePoint[]
  hourlyClicks: AnalyticsTimePoint[]
  weeklyTrends: AnalyticsWeeklyTrendPoint[]
  conversionFunnel: AnalyticsFunnel
  topContent: AnalyticsContentStat[]
  outboundQuality: AnalyticsOutboundQualityStat[]
  scrollDepthByPage: AnalyticsScrollDepthStat[]
  sectionVisibility: AnalyticsSectionStat[]
  audienceSegments: {
    byDevice: AnalyticsSegmentStat[]
    bySource: AnalyticsSegmentStat[]
    byCountry: AnalyticsSegmentStat[]
    byHour: AnalyticsHourStat[]
  }
  contentImpact: AnalyticsContentImpact
  performanceVitals: AnalyticsVitalsSummary
  anomalyAlerts: string[]
  botStats: AnalyticsBotStats
  recentEvents: AnalyticsRecentEvent[]
}

export type RecordAnalyticsEventInput = {
  eventName: string
  sessionId?: string
  path?: string
  source?: AnalyticsSource
  sourceContext?: string
  label?: string
  href?: string
  section?: string
  itemId?: string
  itemType?: string
  value?: number
  durationMs?: number
  occurredAt?: string
  meta?: Partial<AnalyticsEvent["meta"]>
}
