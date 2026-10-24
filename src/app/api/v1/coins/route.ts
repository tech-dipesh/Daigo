import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { coinsRequiredToRedeem, redemptionDiscountRupees } from "@/lib/infra/economy/coins"
import * as userRepo from "@/lib/repository/user-repo"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const user = await userRepo.getById(userId)
  const eligible = user.coinBalance >= coinsRequiredToRedeem
  return successResponse({
    coinBalance: user.coinBalance,
    eligibleForDiscount: eligible,
    discountRupees: eligible ? redemptionDiscountRupees : 0,
    coinsNeeded: eligible ? 0 : coinsRequiredToRedeem - user.coinBalance,
  })
})
