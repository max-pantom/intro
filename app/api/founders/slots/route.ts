import { NextResponse } from "next/server"

import { getFoundersSlots } from "@/lib/founders-slots"

export const dynamic = "force-dynamic"

export async function GET() {
  const slotsLeft = await getFoundersSlots()
  return NextResponse.json({ slotsLeft })
}
