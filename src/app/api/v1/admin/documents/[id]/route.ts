import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import type { RouteParams } from "@/types/api"

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(300).optional(),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const { status, reason } = reviewSchema.parse(await parseJsonBody(request))
  const document = await db.driverDocument.update({
    where: { id },
    data: {
      verificationStatus: status,
      rejectionReason: status === "REJECTED" ? reason : null,
      reviewedAt: new Date(),
    },
    include: { user: true },
  })
  await sendEmailBestEffort({
    to: document.user.email,
    subject: status === "APPROVED" ? "Your licence has been approved" : "Your licence was not approved",
    text: status === "APPROVED"
        ? "Your licence is approved. You can now create routes."
        : `Your licence was rejected.${reason ? ` Reason: ${reason}` : ""}`,
  })
  return successResponse(document)
})
