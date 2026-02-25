import { getCmsPublicData, saveCmsPublicData } from "@/lib/cms-server"

export async function getFoundersSlots(): Promise<number> {
  try {
    const data = await getCmsPublicData()
    const n = data.foundersSlotsLeft
    return typeof n === "number" && n >= 0 ? n : 3
  } catch {
    return 3
  }
}

export async function decrementFoundersSlots(): Promise<number> {
  try {
    const data = await getCmsPublicData()
    const next = Math.max(0, data.foundersSlotsLeft - 1)
    await saveCmsPublicData({ ...data, foundersSlotsLeft: next })
    return next
  } catch {
    return 3
  }
}
