import { AppError } from "@/lib/infra/http/response"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import type { Staff } from "@/lib/infra/auth/admin-access"
import { notify } from "@/lib/infra/realtime/notify"
import { deleteUpload } from "@/lib/infra/storage/uploads"
import * as analyticsRepo from "@/lib/repository/analytics-repo"
import * as driverDocumentRepo from "@/lib/repository/driver-document-repo"
import * as pricingConfigRepo from "@/lib/repository/pricing-config-repo"
import * as userRepo from "@/lib/repository/user-repo"
import * as vehicleRepo from "@/lib/repository/vehicle-repo"
import type { DocumentReviewInput, FareRatePatchInput, StaffRoleInput, VehicleReviewInput, VerificationQueryInput, ZonePatchInput } from "@/lib/validation/admin-schema"

export const listZones = () => pricingConfigRepo.listZones()
export const updateZone = (id: string, data: ZonePatchInput) => pricingConfigRepo.updateZone(id, data)
export const listFareRates = () => pricingConfigRepo.listRates()
export const setFareRate = (type: "BIKE" | "SCOOTER" | "CAR" | "AUTO" | "CAB", { perKm }: FareRatePatchInput) => pricingConfigRepo.setRate(type, perKm)

export async function getStats() {
  const [[users, tripsByStatus, paid], pendingVehicles, pendingDocuments] = await Promise.all([analyticsRepo.platformCounts(), vehicleRepo.countPending(), driverDocumentRepo.countPending()])
  return {
    users,
    trips: Object.fromEntries(tripsByStatus.map(({ status, _count }) => [status, _count._all])),
    payments: { count: paid._count._all, total: paid._sum.amount ?? 0 },
    pendingVerifications: { vehicles: pendingVehicles, documents: pendingDocuments },
  }
}

export async function listVerifications({ status }: VerificationQueryInput) {
  const [vehicles, documents] = await Promise.all([vehicleRepo.listByStatus(status), driverDocumentRepo.listByStatus(status)])
  return { vehicles, documents }
}

export async function reviewVehicle(id: string, { status, reason }: VehicleReviewInput) {
  const vehicle = await vehicleRepo.review(id, status, reason)
  await sendEmailBestEffort({
    to: vehicle.owner.email,
    subject: status === "APPROVED" ? "Your vehicle has been approved" : "Your vehicle was not approved",
    text:
      status === "APPROVED"
        ? `Your vehicle (${vehicle.plateNumber}) is approved. You can now create routes.`
        : `Your vehicle (${vehicle.plateNumber}) was rejected.${reason ? ` Reason: ${reason}` : ""}`,
  })
  await deleteUpload(vehicle.rcUploadId)
  await notify(vehicle.owner.id, "VERIFICATION", status === "APPROVED" ? "Vehicle approved" : "Vehicle rejected", `Your vehicle ${vehicle.plateNumber} was ${status.toLowerCase()}`, { vehicleId: vehicle.id })
  return vehicle
}

export async function reviewDocument(id: string, { status, reason }: DocumentReviewInput) {
  const document = await driverDocumentRepo.review(id, status, reason)
  await sendEmailBestEffort({
    to: document.user.email,
    subject: status === "APPROVED" ? "Your licence has been approved" : "Your licence was not approved",
    text: status === "APPROVED"
        ? "Your licence is approved. You can now create routes."
        : `Your licence was rejected.${reason ? ` Reason: ${reason}` : ""}`,
  })
  await deleteUpload(document.licenseUploadId)
  await notify(document.user.id, "VERIFICATION", status === "APPROVED" ? "Licence approved" : "Licence rejected", `Your licence was ${status.toLowerCase()}`, { documentId: document.id })
  return document
}

export async function changeStaffRole(admin: Staff, id: string, { staffRole }: StaffRoleInput) {
  if (id === admin.id) throw new AppError("You can't change your own staff role", 409)
  return userRepo.setStaffRole(id, staffRole)
}
