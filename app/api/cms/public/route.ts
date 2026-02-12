import { NextResponse } from "next/server"

import { getCmsPublicData } from "@/lib/cms-server"

export async function GET() {
  const data = await getCmsPublicData()
  return NextResponse.json(data)
}
