import { enqueue } from "@/lib/infra/queue/queue"
import { signRead } from "@/lib/infra/storage/s3"
import * as exportRepo from "@/lib/repository/admin/export-repo"
import type { ExportInput } from "@/lib/validation/admin/admin-schema"

const dayMs = 24 * 60 * 60 * 1000
const linkSeconds = 60 * 60
const shown = 20

export async function queueExport({ type, from, to }: ExportInput, requestedById: string) {
  const end = to ?? new Date()
  const start = from ?? new Date(end.getTime() - 30 * dayMs)
  const row = await exportRepo.create({ type, rangeFrom: start, rangeTo: end, requestedById })
  await enqueue({ name: "export.csv", payload: { exportId: row.id, type, from: start.toISOString(), to: end.toISOString(), requestedById } })
  return { queued: true, id: row.id, from: start, to: end }
}

/* download links are signed fresh each time so an old row never holds a dead link */
export async function listExports() {
  const rows = await exportRepo.recent(shown)
  const withLinks = rows.map(async ({ fileKey, ...row }) => ({ ...row, url: row.status === "READY" && fileKey ? await signRead(fileKey, linkSeconds) : null }))
  return Promise.all(withLinks)
}
