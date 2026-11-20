import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import { getBoard } from "@/lib/services/ride/board-service"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const board = await getBoard(getUserId(request), id)
  return successResponse(board)
})
