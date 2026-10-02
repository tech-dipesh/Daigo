import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireStaff } from "@/lib/infra/admin-access"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { idFrom } from "@/lib/infra/route-params"
import { sendEmailBestEffort } from "@/lib/infra/email"

type RouteParams = { params: Promise<{ id: string }> }

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
