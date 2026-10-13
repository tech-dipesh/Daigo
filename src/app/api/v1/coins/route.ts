import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { coinsRequiredToRedeem, redemptionDiscountRupees } from "@/lib/infra/economy/coins"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
  const eligible = user.coinBalance >= coinsRequiredToRedeem
  return successResponse({
    coinBalance: user.coinBalance,
    eligibleForDiscount: eligible,
    discountRupees: eligible ? redemptionDiscountRupees : 0,
    coinsNeeded: eligible ? 0 : coinsRequiredToRedeem - user.coinBalance,
  })
})
