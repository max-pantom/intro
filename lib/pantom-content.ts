export type StudioService = {
  title: string
  detail: string
  deliverables: string[]
}

export type CaseStudy = {
  name: string
  sector: string
  story: {
    challenge: string
    move: string
    result: string
  }
}

export type StudioPrinciple = {
  title: string
  text: string
}

export type CommunityProgram = {
  name: string
  detail: string
}

export const hero = {
  label: "Creative Product Studio",
  title: "Pantom designs, builds, and scales digital products with cinematic clarity.",
  narrative:
    "We partner with founders and product teams from zero to traction. Strategy, identity, UX systems, and engineering move in one connected rhythm.",
  partnerNote: "Built for long-term collaboration, not one-off handoffs.",
}

export const services: StudioService[] = [
  {
    title: "Product Design + UX Systems",
    detail: "Research-backed flows, reusable UI patterns, and decision-ready prototypes.",
    deliverables: ["User journeys", "Design system", "Prototype narrative"],
  },
  {
    title: "Web Development + MVP Delivery",
    detail: "Fast production builds for launches, onboarding, and high-signal analytics.",
    deliverables: ["Next.js build", "CMS architecture", "Performance budgets"],
  },
  {
    title: "Brand Identity + Storytelling",
    detail: "Positioning and verbal/visual language that carries across product and marketing.",
    deliverables: ["Tone framework", "Identity kit", "Launch narrative"],
  },
  {
    title: "Growth Redesign Experiments",
    detail: "Conversion-focused redesigns with measurable tests and weekly learning loops.",
    deliverables: ["Experiment backlog", "A/B test scopes", "Insight reporting"],
  },
]

export const caseStudies: CaseStudy[] = [
  {
    name: "Northline",
    sector: "B2B platform",
    story: {
      challenge: "Retention fell after onboarding; founders had fragmented messaging.",
      move: "We rebuilt the product narrative and shipped a guided setup flow in six weeks.",
      result: "Activation rose by 38% and support tickets dropped by 29%.",
    },
  },
  {
    name: "Marrow Labs",
    sector: "AI workflow tool",
    story: {
      challenge: "The MVP worked technically but lacked trust signals for enterprise buyers.",
      move: "Pantom introduced an editorial website, proof architecture, and a refined UI system.",
      result: "Sales-qualified leads doubled in the first two launch cycles.",
    },
  },
  {
    name: "Relay Club",
    sector: "Community SaaS",
    story: {
      challenge: "Growth stalled due to weak community loops and unclear value articulation.",
      move: "We designed member rituals, restructured the IA, and shipped social proof modules.",
      result: "Weekly active communities increased by 52%.",
    },
  },
]

export const philosophy: StudioPrinciple[] = [
  {
    title: "One team across strategy, design, and code",
    text: "No handoff gaps. Product decisions move directly into polished implementation.",
  },
  {
    title: "Story drives interface",
    text: "Every screen is part of a narrative arc: why this exists, why now, why trust it.",
  },
  {
    title: "Momentum over theatrics",
    text: "We keep expression distinctive while protecting speed, reliability, and maintainability.",
  },
]

export const communityPrograms: CommunityProgram[] = [
  {
    name: "Open Build Reviews",
    detail: "Monthly critiques for early-stage teams navigating launch decisions.",
  },
  {
    name: "Founder Narrative Sessions",
    detail: "Small-group workshops focused on product storytelling and brand voice.",
  },
  {
    name: "Operator Dispatch",
    detail: "A shared field report on growth experiments and UX benchmarks.",
  },
]

export const onboardingSteps = [
  "Share product stage, goals, and constraints.",
  "Join a 45-minute studio call for scope and fit.",
  "Receive a phased partnership plan with milestones.",
]
