import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError } from "@/lib/infra/http/response"
import { assertApart } from "@/lib/infra/matching/too-close"
import * as permanentRepo from "@/lib/repository/ride/permanent-manage-repo"
import type { PermanentInput } from "@/lib/validation/ride/permanent-schema"

const limit = 5
const at = (hm: string) => new Date(`1970-01-01T${hm}:00Z`)

export const listPermanent = (riderId: string) => permanentRepo.listActive(riderId)

export async function createPermanent(riderId: string, { windowStart, windowEnd, ...data }: PermanentInput) {
  await requireMember(riderId)
  assertApart(data)
  if (windowEnd <= windowStart) throw new AppError("The window end must be after the start", 400)
  if ((await permanentRepo.countActive(riderId)) >= limit) throw new AppError(`You can keep ${limit} weekday rides at a time`, 409)
  return permanentRepo.create({ riderId, ...data, windowStartTime: at(windowStart), windowEndTime: at(windowEnd) })
}

export async function cancelPermanent(riderId: string, id: string) {
  const { count } = await permanentRepo.deactivate(id, riderId)
  if (!count) throw new AppError("Weekday ride not found", 404)
  return { cancelled: true }
}
