import { randomUUID } from "node:crypto"
import { db } from "@/lib/infra/clients/db"
import { notify } from "@/lib/infra/realtime/notify"
import { putObject, signRead } from "@/lib/infra/storage/s3"

type Cell = string | number | boolean | Date | null
type ExportJob = { type: "trips" | "users" | "complaints"; from: string; to: string; requestedById: string }

const linkSeconds = 24 * 60 * 60
const esc = (cell: Cell) => {
  const text = cell instanceof Date ? cell.toISOString() : String(cell ?? "")
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
const toCsv = (rows: Cell[][]) => rows.map((row) => row.map(esc).join(",")).join("\n")

async function tripRows(range: { gte: Date; lte: Date }) {
  const trips = await db.trip.findMany({ where: { createdAt: range }, orderBy: { createdAt: "asc" } })
  const body = trips.map((t): Cell[] => [t.id, t.status, t.priceEstimate, t.distanceKm, t.riderId, t.driverId, t.createdAt, t.completedAt])
  const total = trips.reduce((sum, t) => sum + t.priceEstimate, 0)
  const average = trips.length ? Math.round(total / trips.length) : 0
  return [["id", "status", "price", "distance_km", "rider_id", "driver_id", "created_at", "completed_at"], ...body, [], ["TOTAL trips", trips.length], ["TOTAL price", total], ["AVERAGE price", average]]
}

async function userRows(range: { gte: Date; lte: Date }) {
  const users = await db.user.findMany({ where: { createdAt: range }, orderBy: { createdAt: "asc" } })
  const body = users.map((u): Cell[] => [u.id, u.email, u.activeRole, u.trustScore, u.isBanned, u.createdAt])
  const trust = users.reduce((sum, u) => sum + u.trustScore, 0)
  const average = users.length ? Math.round(trust / users.length) : 0
  return [["id", "email", "role", "trust", "banned", "created_at"], ...body, [], ["TOTAL users", users.length], ["AVERAGE trust", average]]
}

async function complaintRows(range: { gte: Date; lte: Date }) {
  const complaints = await db.complaint.findMany({ where: { createdAt: range }, orderBy: { createdAt: "asc" } })
  const body = complaints.map((c): Cell[] => [c.id, c.type, c.status, c.tripId, c.createdAt])
  return [["id", "type", "status", "trip_id", "created_at"], ...body, [], ["TOTAL complaints", complaints.length]]
}

/* builds the csv, parks it in the private bucket and sends the admin a link that dies in 24h */
export async function buildExport(job: ExportJob) {
  const range = { gte: new Date(job.from), lte: new Date(job.to) }
  const rows = job.type === "trips" ? await tripRows(range) : job.type === "users" ? await userRows(range) : await complaintRows(range)
  const key = `exports/${job.type}-${randomUUID()}.csv`
  await putObject(key, toCsv(rows), "text/csv")
  const url = await signRead(key, linkSeconds)
  await notify(job.requestedById, "EXPORT", "Your export is ready", `The ${job.type} export is ready. The link works for 24 hours.`, { url, type: job.type })
}
