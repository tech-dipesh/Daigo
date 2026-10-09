import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { coinsRequiredToRedeem, redemptionDiscountRupees } from "@/lib/infra/coins"

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
