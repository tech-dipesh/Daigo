import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { sendEmailBestEffort } from "@/lib/infra/email"

const emergencySchema = z.object({
  tripId: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
})

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { tripId, lat, lng } = emergencySchema.parse(await parseJsonBody(request))
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { emergencyContacts: { where: { isPrimary: true }, take: 1 } },
  })
  const event = await db.emergencyEvent.create({
    data: { userId, tripId, lat, lng },
  })
  /*
  two sep people get a alert with a admin and the emregency contact
*/
  const superAdmins = await db.user.findMany({ where: { staffRole: "SUPER_ADMIN" } })
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`
  for (const admin of superAdmins) {
    await sendEmailBestEffort({
      to: admin.email,
      subject: "HIGH ALERT: DaiGo emergency triggered",
      text: `${user.email} triggered an emergency. Location: ${mapsLink}`,
    })
  }
  const contactEmail = user.emergencyContacts[0]?.email
  if (contactEmail) {
    await sendEmailBestEffort({
      to: contactEmail,
      subject: "DaiGo emergency alert",
      text: `${user.name ?? user.email} may need help. Last known location: ${mapsLink}`,
    })
  }
  return successResponse(event, 201)
})
