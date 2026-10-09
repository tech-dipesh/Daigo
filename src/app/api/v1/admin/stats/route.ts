import { db } from "@/lib/infra/db"
import { requireStaff } from "@/lib/infra/admin-access"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const [users, tripsByStatus, paid, pendingVehicles, pendingDocuments] = await Promise.all([
    db.user.count(),
    db.trip.groupBy({ by: ["status"], _count: { _all: true } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: { _all: true } }),
    db.vehicle.count({ where: { verificationStatus: "PENDING" } }),
    db.driverDocument.count({ where: { verificationStatus: "PENDING" } }),
  ])
  return successResponse({
    users,
    trips: Object.fromEntries(tripsByStatus.map(({ status, _count }) => [status, _count._all])),
    payments: { count: paid._count._all, total: paid._sum.amount ?? 0 },
    pendingVerifications: { vehicles: pendingVehicles, documents: pendingDocuments },
  })
})
