import { db } from "@/lib/infra/clients/db"

export type Plan = {
  users: NonNullable<Parameters<typeof db.user.createMany>[0]>["data"]
  vehicles: NonNullable<Parameters<typeof db.vehicle.createMany>[0]>["data"]
  documents: NonNullable<Parameters<typeof db.driverDocument.createMany>[0]>["data"]
  routes: NonNullable<Parameters<typeof db.route.createMany>[0]>["data"]
  requests: NonNullable<Parameters<typeof db.rideRequest.createMany>[0]>["data"]
  trips: NonNullable<Parameters<typeof db.trip.createMany>[0]>["data"]
  ratings: NonNullable<Parameters<typeof db.rating.createMany>[0]>["data"]
  payments: NonNullable<Parameters<typeof db.payment.createMany>[0]>["data"]
}

/* parents first, one batch so a half made demo never stays behind */
export const insertPlan = (plan: Plan) =>
  db.$transaction([
    db.user.createMany({ data: plan.users }),
    db.vehicle.createMany({ data: plan.vehicles }),
    db.driverDocument.createMany({ data: plan.documents }),
    db.route.createMany({ data: plan.routes }),
    db.rideRequest.createMany({ data: plan.requests }),
    db.trip.createMany({ data: plan.trips }),
    db.rating.createMany({ data: plan.ratings }),
    db.payment.createMany({ data: plan.payments }),
  ])
