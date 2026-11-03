import { requireStaff } from "@/lib/infra/auth/admin-access"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { enqueue, jobUrl, queueClient, queueEnabled } from "@/lib/infra/queue/queue"
import { adminJobSchema } from "@/lib/validation/admin/admin-schema"

/*
  schedule uses scheduleId so running it twice just updates it
  cron_tz keeps it 6am ist, not utc. not 100 percent sure on scheduleId, check once
*/
export const POST = withErrorHandling(async (request) => {
  await requireStaff(request, "SUPER_ADMIN")
  const { action } = adminJobSchema.parse(await parseJsonBody(request))
  if (action === "run-autopost") {
    await enqueue({ name: "permanent.autopost", payload: {} })
    return successResponse({ queued: true })
  }
  if (!queueClient || !queueEnabled) throw new AppError("Queue needs QTASH_TOKEN and a public APP_URL", 409)
  const schedule = await queueClient.schedules.create({
    scheduleId: "daigo-autopost",
    destination: jobUrl,
    cron: "CRON_TZ=Asia/Kolkata 0 6 * * *",
    body: JSON.stringify({ name: "permanent.autopost", payload: {} }),
    headers: { "Content-Type": "application/json" },
  })
  return successResponse(schedule, 201)
})
