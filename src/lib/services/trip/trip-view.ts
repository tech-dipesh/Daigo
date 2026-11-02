import type { Trip } from "@/generated/prisma/client"

type ViewedTrip = Omit<Trip, "pickupOtp"> & { pickupOtp: string | null }

/* only the rider ever sees the pickup code, the driver has to be told it in person */
export const forViewer = (trip: Trip, userId: string): ViewedTrip => (trip.riderId === userId ? trip : { ...trip, pickupOtp: null })
