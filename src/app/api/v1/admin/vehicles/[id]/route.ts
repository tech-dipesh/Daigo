import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { notify } from "@/lib/infra/realtime/notify"
import { deleteUpload } from "@/lib/infra/storage/uploads"
import type { RouteParams } from "@/types/api"

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(300).optional(),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const { status, reason } = reviewSchema.parse(await parseJsonBody(request))
  const vehicle = await db.vehicle.update({
    where: { id },
    data: {
      verificationStatus: status,
      rejectionReason: status === "REJECTED" ? reason : null,
      reviewedAt: new Date(),
    },
    include: { owner: true },
  })
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
  return successResponse(vehicle)
})
