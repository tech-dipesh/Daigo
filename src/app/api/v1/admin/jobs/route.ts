import { z } from "zod"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { enqueue, jobUrl, queueClient, queueEnabled } from "@/lib/infra/queue/queue"

const jobSchema = z.object({ action: z.enum(["schedule-autopost", "run-autopost"]) })

/*
  I'm making a scheudle use of the running twice on the updates it.
  with it make a 6 am for now let's see.
*/
export const POST = withErrorHandling(async (request) => {
  await requireStaff(request, "SUPER_ADMIN")
  const { action } = jobSchema.parse(await parseJsonBody(request))
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
