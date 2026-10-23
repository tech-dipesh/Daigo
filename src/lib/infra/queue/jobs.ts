import { db } from "@/lib/infra/clients/db"
import { sendEmail } from "@/lib/infra/clients/email"
import { autopostToday } from "@/lib/infra/matching/permanent"
import { buildExport } from "@/lib/infra/storage/exports"
import type { Job } from "@/lib/infra/queue/types"

export async function runJob(job: Job) {
  switch (job.name) {
    case "email.send":
      return sendEmail(job.payload)
    case "notification.save": {
      const { id, userId, type, title, body, data } = job.payload
      await db.notification.upsert({ where: { id }, create: { id, userId, type, title, body, data }, update: {} })
      return
    }
    case "permanent.autopost":
      return autopostToday()
    case "export.csv":
      return buildExport(job.payload)
  }
}
