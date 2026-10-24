import { z } from "zod"

export const driverDocumentSchema = z.object({
  licenseNumber: z.string().regex(/^[A-Za-z0-9-]{8,20}$/),
  licenseUploadId: z.uuid(),
})

export const routeSchema = z.object({
  vehicleId: z.string(),
  routeType: z.enum(["REGULAR", "ADVANCE"]),
  fromLabel: z.string().min(1),
  fromLat: z.number(),
  fromLng: z.number(),
  toLabel: z.string().min(1),
  toLat: z.number(),
  toLng: z.number(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  departureDate: z.coerce.date().optional(),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  detourLimitKm: z.number().min(0).max(20),
  seatsAvailable: z.number().int().min(1).max(5),
})

export const vehicleSchema = z.object({
  type: z.enum(["BIKE", "SCOOTER", "CAR", "AUTO", "CAB"]),
  make: z.string().min(1),
  model: z.string().min(1),
  plateNumber: z.string().min(4).max(15),
  seatCapacity: z.number().int().min(1).max(5),
  rcNumber: z.string().min(6).max(20),
  rcUploadId: z.uuid(),
})
