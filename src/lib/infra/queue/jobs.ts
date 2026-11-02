import { sendEmail } from "@/lib/infra/clients/email"
import { autopostToday } from "@/lib/infra/matching/permanent"
import { buildExport } from "@/lib/infra/storage/exports"
import type { Job } from "@/lib/infra/queue/types"
import * as notificationRepo from "@/lib/repository/account/notification-repo"

export async function runJob(job: Job) {
  switch (job.name) {
    case "email.send":
      return sendEmail(job.payload)
    case "notification.save": {
      await notificationRepo.save(job.payload)
      return
    }
    case "permanent.autopost":
      return autopostToday()
    case "export.csv":
      return buildExport(job.payload)
  }
}
