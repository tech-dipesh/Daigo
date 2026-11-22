import { setOffline, setOnline } from "@/lib/infra/realtime/presence"
import * as userRepo from "@/lib/repository/account/user-repo"

export async function reportPresence(userId: string, online: boolean) {
  const user = await userRepo.getById(userId)
  const live = online && user.activeRole === "DRIVER"
  if (live) await setOnline(userId)
  else await setOffline(userId)
  return { online: live }
}
