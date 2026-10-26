import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { publishAdmin } from "@/lib/infra/realtime/publish"
import * as emergencyRepo from "@/lib/repository/emergency-repo"
import * as userRepo from "@/lib/repository/user-repo"
import type { EmergencyContactInput, EmergencyInput } from "@/lib/validation/emergency-schema"
import { enforceLimit } from "@/lib/infra/clients/action-limit"

export const listContacts = (userId: string) => emergencyRepo.listContacts(userId)

export async function addContact(userId: string, { yourName, ...data }: EmergencyContactInput) {
  const contact = await emergencyRepo.createContact({ ...data, userId })
  if (yourName) await userRepo.rename(userId, yourName)
  return contact
}

export async function triggerEmergency(userId: string, { tripId, lat, lng }: EmergencyInput) {
  await enforceLimit("emergency", userId)
  const user = await userRepo.withPrimaryContact(userId)
  const event = await emergencyRepo.createEvent({ userId, tripId, lat, lng })
  await publishAdmin("emergency.new", { eventId: event.id, userId, tripId, lat, lng })
  /*
  two sep people get a alert with a admin and the emregency contact
*/
  const superAdmins = await userRepo.superAdmins()
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
  return event
}

export const resolveEmergency = (id: string) => emergencyRepo.resolve(id)
export const listOpenEmergencies = () => emergencyRepo.listOpen()
