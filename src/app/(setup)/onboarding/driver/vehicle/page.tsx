import { requireUser } from "@/lib/session"
import { VehicleForm } from "@/features/onboarding/vehicle-form"

export default async function VehiclePage() {
  await requireUser({ role: "DRIVER", setup: true })
  return <VehicleForm />
}
