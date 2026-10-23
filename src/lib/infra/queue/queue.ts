import { Client } from "@upstash/qstash"
import { env } from "@/lib/infra/clients/env"
import type { Job } from "@/lib/infra/queue/types"

export const queueClient = env.QTASH_TOKEN ? new Client({ token: env.QTASH_TOKEN }) : null
export const jobUrl = `${env.APP_URL}/api/v1/jobs/run`
/* qstash cant reach localhost so dev runs jobs inline */
export const queueEnabled = queueClient !== null && !env.APP_URL.includes("localhost")

export async function enqueue(job: Job) {
  try {
    if (queueClient && queueEnabled) {
      await queueClient.publishJSON({ url: jobUrl, body: job, retries: 3 })
      return
    }
    const { runJob } = await import("@/lib/infra/queue/jobs")
    await runJob(job)
  } catch (error) {
    console.error("enqueue failed", job.name, error)
  }
}
