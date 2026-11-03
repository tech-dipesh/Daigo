import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as supportService from "@/lib/services/safety/support-service"
import { complaintSchema } from "@/lib/validation/safety/support-schema"

export const GET = withErrorHandling(async (request) => {
  const complaints = await supportService.listMyComplaints(getUserId(request))
  return successResponse(complaints)
})

export const POST = withErrorHandling(async (request) => {
  const input = complaintSchema.parse(await parseJsonBody(request))
  const complaint = await supportService.fileComplaint(getUserId(request), input)
  return successResponse(complaint, 201)
})
