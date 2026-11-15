import { requireUser } from "@/lib/session"
import { Review } from "@/features/onboarding/review"

export default async function ReviewPage() {
  await requireUser({ role: "DRIVER", setup: true })
  return <Review />
}
