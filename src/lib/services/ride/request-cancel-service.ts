import { AppError } from "@/lib/infra/http/response"
import * as requestCancelRepo from "@/lib/repository/ride/request-cancel-repo"

export async function cancelRequest(riderId: string, id: string) {
  const count = await requestCancelRepo.cancelPending(id, riderId)
  if (!count) throw new AppError("Only a pending request can be cancelled", 409)
  return { cancelled: true }
}
