import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as userAdminService from "@/lib/services/admin/user-admin-service"
import { userSearchSchema } from "@/lib/validation/admin/user-search-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const query = userSearchSchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const users = await userAdminService.searchUsers(query)
  return successResponse(users)
})
