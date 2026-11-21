import { AppError } from "@/lib/infra/http/response"
import * as userAdminRepo from "@/lib/repository/admin/user-admin-repo"
import type { UserSearchInput } from "@/lib/validation/admin/user-search-schema"

export const searchUsers = ({ q, staff }: UserSearchInput) => userAdminRepo.search(q || undefined, staff === "true")

export async function userDetail(id: string) {
  const user = await userAdminRepo.detail(id)
  if (!user) throw new AppError("User not found", 404)
  return user
}
