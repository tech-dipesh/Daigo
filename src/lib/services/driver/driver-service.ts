import { AppError } from "@/lib/infra/http/response"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { notifyWaitlist } from "@/lib/infra/matching/waitlist"
import { assertOwnUpload } from "@/lib/infra/storage/uploads"
import * as driverDocumentRepo from "@/lib/repository/driver/driver-document-repo"
import * as routeRepo from "@/lib/repository/driver/route-repo"
import * as userRepo from "@/lib/repository/account/user-repo"
import * as vehicleRepo from "@/lib/repository/driver/vehicle-repo"
import type { AutoAcceptInput } from "@/lib/validation/ride/match-schema"
import type { DriverDocumentInput, RouteInput, VehicleInput } from "@/lib/validation/driver/driver-schema"

async function requireDriverMode(userId: string, message: string) {
  await requireMember(userId)
  const user = await userRepo.findById(userId)
  if (user?.activeRole !== "DRIVER") throw new AppError(message, 403)
}

export const listVehicles = (ownerId: string) => vehicleRepo.listByOwner(ownerId)
export const listLicences = (userId: string) => driverDocumentRepo.listByUser(userId)
export const listRoutes = (driverId: string) => routeRepo.listByDriver(driverId)

export async function addVehicle(ownerId: string, data: VehicleInput) {
  await requireDriverMode(ownerId, "Switch to driver mode to add a vehicle")
  await assertOwnUpload(data.rcUploadId, ownerId, "RC")
  return vehicleRepo.create({ ...data, ownerId })
}

export async function submitLicence(userId: string, data: DriverDocumentInput) {
  await requireDriverMode(userId, "Switch to driver mode to submit a licence")
  await assertOwnUpload(data.licenseUploadId, userId, "LICENCE")
  return driverDocumentRepo.create({ ...data, userId })
}

export async function createRoute(driverId: string, data: RouteInput) {
  await requireDriverMode(driverId, "Switch to driver mode to create a route")
  const [vehicle, licence] = await Promise.all([vehicleRepo.findOwned(data.vehicleId, driverId), driverDocumentRepo.findApproved(driverId)])
  if (!vehicle) {
    throw new AppError("Vehicle not found", 404)
  }
  if (vehicle.verificationStatus !== "APPROVED") {
    throw new AppError("This vehicle hasn't been approved yet", 403)
  }
  if (!licence) {
    throw new AppError("Your licence hasn't been approved yet", 403)
  }
  const route = await routeRepo.create({ ...data, departureTime: new Date(`1970-01-01T${data.departureTime}:00Z`), driverId })
  await notifyWaitlist(route)
  return route
}

export async function setAutoAccept(driverId: string, id: string, { enabled, minPrice, minPerKm, minTrust }: AutoAcceptInput) {
  const route = await routeRepo.findOwned(id, driverId)
  if (!route) throw new AppError("Route not found", 404)
  return routeRepo.setAutoAccept(id, { autoAccept: enabled, autoMinPrice: minPrice, autoMinPerKm: minPerKm, autoMinTrust: minTrust })
}
