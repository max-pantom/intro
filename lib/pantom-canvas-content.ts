export type ZoneKey = "philosophy" | "work" | "services" | "contact"

export type BlockType = "manifesto" | "case" | "service" | "system" | "note" | "cta"

export type CanvasBlock = {
  id: string
  zone: ZoneKey
  type: BlockType
  x: number
  y: number
  w: number
  h: number
  title: string
  body: string
  detail: string
}

export const CANVAS_WIDTH = 2600
export const CANVAS_HEIGHT = 1700
export const GRID_SIZE = 24

export const zoneAnchors: Record<ZoneKey, { x: number; y: number; label: string }> = {
  philosophy: { x: 340, y: 330, label: "Philosophy" },
  work: { x: 1160, y: 420, label: "Work" },
  services: { x: 1980, y: 420, label: "Services" },
  contact: { x: 1240, y: 1290, label: "Start" },
}

export const canvasBlocks: CanvasBlock[] = [
  {
    id: "manifesto-1",
    zone: "philosophy",
    type: "manifesto",
    x: 140,
    y: 140,
    w: 360,
    h: 230,
    title: "Pantom Manifesto",
    body: "We build products that feel inevitable. Not trendy. Not rushed. Designed to last.",
    detail:
      "Pantom is a thinking system where strategy, narrative, design, and engineering are one continuous craft.",
  },
  {
    id: "manifesto-2",
    zone: "philosophy",
    type: "note",
    x: 540,
    y: 240,
    w: 280,
    h: 170,
    title: "Why We Reject Templates",
    body: "Templates optimize speed for vendors. We optimize clarity for founders.",
    detail: "Every block is custom-scoped to product stage, team reality, and market context.",
  },
  {
    id: "system-loop",
    zone: "philosophy",
    type: "system",
    x: 250,
    y: 450,
    w: 500,
    h: 180,
    title: "Our Loop",
    body: "Research -> Design -> Ship -> Learn -> Repeat",
    detail: "Each cycle is short, measurable, and tied to one strategic question.",
  },
  {
    id: "case-rewyre",
    zone: "work",
    type: "case",
    x: 950,
    y: 180,
    w: 380,
    h: 230,
    title: "Pantom x Rewyre",
    body: "ADHD habit platform repositioned from app utility to behavior system.",
    detail: "Activation +41%, 30-day retention +26%, and a cleaner founder narrative for fundraising.",
  },
  {
    id: "case-marrow",
    zone: "work",
    type: "case",
    x: 1380,
    y: 260,
    w: 350,
    h: 220,
    title: "Marrow Labs",
    body: "AI workflow tool rebuilt with trust-first onboarding and proof-led storytelling.",
    detail: "Doubled SQL conversion from website to product demo in two release cycles.",
  },
  {
    id: "experiments",
    zone: "work",
    type: "note",
    x: 1020,
    y: 500,
    w: 320,
    h: 180,
    title: "Failed Experiments",
    body: "We keep a public archive of experiments that did not work and why.",
    detail: "Transparency builds trust and improves the quality of future decisions.",
  },
  {
    id: "service-design",
    zone: "services",
    type: "service",
    x: 1840,
    y: 160,
    w: 340,
    h: 210,
    title: "Product Design + UX Systems",
    body: "Journey design, reusable UI kits, and decision-ready prototypes.",
    detail: "Output includes flows, systems, and tested interaction patterns.",
  },
  {
    id: "service-dev",
    zone: "services",
    type: "service",
    x: 2190,
    y: 320,
    w: 320,
    h: 210,
    title: "MVP + Web Engineering",
    body: "Next.js builds focused on launch velocity and performance integrity.",
    detail: "Includes instrumentation, CMS architecture, and technical growth hooks.",
  },
  {
    id: "service-brand",
    zone: "services",
    type: "service",
    x: 1800,
    y: 480,
    w: 360,
    h: 210,
    title: "Brand Story Systems",
    body: "Positioning, language, and visual voice that move across product and marketing.",
    detail: "From manifesto and messaging to launch pages and growth assets.",
  },
  {
    id: "pricing-note",
    zone: "services",
    type: "note",
    x: 2170,
    y: 590,
    w: 300,
    h: 150,
    title: "How We Price",
    body: "Phased partnerships with clear checkpoints, never vague retainers.",
    detail: "Scope is shaped collaboratively after fit call and constraints mapping.",
  },
  {
    id: "cta-project",
    zone: "contact",
    type: "cta",
    x: 1060,
    y: 1100,
    w: 460,
    h: 230,
    title: "Start a Project",
    body: "Share stage, team, timeline, and what is currently blocking momentum.",
    detail: "We respond with fit, proposed path, and expected milestones within 48 hours.",
  },
  {
    id: "community",
    zone: "contact",
    type: "note",
    x: 1620,
    y: 1180,
    w: 340,
    h: 210,
    title: "Community Studio",
    body: "Open build reviews, founder narrative sessions, and operator dispatches.",
    detail: "Pantom grows with community feedback loops, not isolated agency cycles.",
  },
]
