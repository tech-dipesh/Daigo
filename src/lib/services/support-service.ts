import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import type { Staff } from "@/lib/infra/auth/admin-access"
import { notify } from "@/lib/infra/realtime/notify"
import * as appealRepo from "@/lib/repository/appeal-repo"
import * as complaintRepo from "@/lib/repository/complaint-repo"
import * as userRepo from "@/lib/repository/user-repo"
import * as warningRepo from "@/lib/repository/warning-repo"
import type { AppealDecisionInput, ComplaintDecisionInput } from "@/lib/validation/admin-schema"
import type { AppealInput, ComplaintInput } from "@/lib/validation/support-schema"

export const listMyAppeals = (userId: string) => appealRepo.listByUser(userId)
export const listMyComplaints = (userId: string) => complaintRepo.listByUser(userId)

export async function fileAppeal(userId: string, { kind, warningId, text }: AppealInput) {
  if (kind === "WARNING") {
    if (!warningId) throw new AppError("Send the warningId you want to appeal", 400)
    const warning = await warningRepo.findActiveOwned(warningId, userId)
    if (!warning) throw new AppError("Warning not found", 404)
  } else {
    const user = await userRepo.getById(userId)
    if (!user.isBanned) throw new AppError("Your account is not banned", 409)
  }
  const target = kind === "WARNING" ? (warningId ?? null) : null
  const open = await appealRepo.findOpen(userId, kind, target)
  if (open) throw new AppError("You already have an open appeal for this", 409)
  return appealRepo.create({ userId, kind, warningId: target, text })
}

export async function fileComplaint(userId: string, { tripId, type, text }: ComplaintInput) {
  const trip = await getTripForUser(tripId, userId)
  const againstId = trip.riderId === userId ? trip.driverId : trip.riderId
  const open = await complaintRepo.findOpen(tripId, userId, type)
  if (open) throw new AppError("You already have an open complaint of this type for this trip", 409)
  return complaintRepo.create({ tripId, filedById: userId, againstId, type, text })
}

export const listAppeals = (status: "OPEN" | "APPROVED" | "REJECTED") => appealRepo.listByStatus(status)
export const listComplaints = (status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED") => complaintRepo.listByStatus(status)

export async function decideAppeal(staff: Staff, id: string, { status, note }: AppealDecisionInput) {
  const appeal = await appealRepo.findById(id)
  if (!appeal) throw new AppError("Appeal not found", 404)
  if (appeal.status !== "OPEN") throw new AppError("This appeal was already decided", 409)
  if (appeal.kind === "ACCOUNT" && staff.staffRole !== "SUPER_ADMIN") throw new AppError("Only a super admin decides account appeals", 403)
  const decided = await appealRepo.decide(appeal, status, note, staff.id)
  await notify(appeal.userId, "APPEAL", status === "APPROVED" ? "Appeal approved" : "Appeal rejected", note ?? `Your appeal was ${status.toLowerCase()}`, { appealId: id })
  return decided
}

export async function decideComplaint(staff: Staff, id: string, { status, note }: ComplaintDecisionInput) {
  const current = await complaintRepo.findById(id)
  if (!current) throw new AppError("Complaint not found", 404)
  if (current.status === "RESOLVED" || current.status === "REJECTED") throw new AppError("This complaint is already closed", 409)
  const complaint = await complaintRepo.update(id, { status, adminNote: note, handledById: staff.id })
  await notify(complaint.filedById, "COMPLAINT", "Complaint update", `Your complaint is now ${status.replace("_", " ").toLowerCase()}`, { complaintId: id })
  return complaint
}
