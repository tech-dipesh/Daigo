import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { RouteParams } from "@/types/api"


export const DELETE = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)

  const permanentRequest = await db.permanentRideRequest.findFirst({ where: { id, riderId } })

  if (!permanentRequest) throw new AppError("Permanent request not found", 404)

  const cancelled = await db.permanentRideRequest.update({
    where: { id },
    data: { isActive: false },
  })

  return successResponse(cancelled)
})
