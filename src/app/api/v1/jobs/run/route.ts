import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { runJob } from "@/lib/infra/queue/jobs"
import { jobSchema } from "@/lib/infra/queue/types"
import { verifyQstash } from "@/lib/infra/queue/verify"

export const POST = withErrorHandling(async (request) => {
  const raw = await request.text()
  if (!(await verifyQstash(request, raw))) throw new AppError("Invalid signature", 401)
  const job = jobSchema.parse(JSON.parse(raw))
  await runJob(job)
  return successResponse({ ok: true })
})
