import { AppError } from "@/lib/infra/http/response"
import * as paymentRepo from "@/lib/repository/payment/payment-repo"
import * as userRepo from "@/lib/repository/account/user-repo"

export async function shareView(userId: string, shareId: string) {
  const user = await userRepo.getById(userId)
  const share = await paymentRepo.findShare(shareId)
  if (!share || share.email !== user.email.toLowerCase()) throw new AppError("Payment share not found", 404)
  return { amount: share.amount, status: share.status, expiresAt: share.expiresAt }
}
