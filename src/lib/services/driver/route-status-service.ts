import { AppError } from "@/lib/infra/http/response"
import * as routeRepo from "@/lib/repository/driver/route-repo"
import * as routeStatusRepo from "@/lib/repository/driver/route-status-repo"
import type { RouteStatusInput } from "@/lib/validation/driver/route-status-schema"

export async function setRouteStatus(driverId: string, id: string, { status }: RouteStatusInput) {
  const route = await routeRepo.findOwned(id, driverId)
  if (!route) throw new AppError("Route not found", 404)
  return routeStatusRepo.setStatus(id, status)
}
