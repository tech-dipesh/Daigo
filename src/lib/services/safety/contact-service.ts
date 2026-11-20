import { AppError } from "@/lib/infra/http/response"
import * as contactRepo from "@/lib/repository/safety/contact-manage-repo"
import type { ContactUpdateInput } from "@/lib/validation/safety/contact-update-schema"

export async function updateContact(userId: string, id: string, data: ContactUpdateInput) {
  const contact = await contactRepo.findOwned(id, userId)
  if (!contact) throw new AppError("Contact not found", 404)
  if (data.isPrimary === false && contact.isPrimary) throw new AppError("Pick another contact as primary instead", 409)
  return contactRepo.update(id, userId, data)
}

export async function removeContact(userId: string, id: string) {
  const contact = await contactRepo.findOwned(id, userId)
  if (!contact) throw new AppError("Contact not found", 404)
  if ((await contactRepo.countFor(userId)) <= 1) throw new AppError("You need at least one emergency contact", 409)
  await contactRepo.remove(id, userId, contact.isPrimary)
  return { removed: true }
}
