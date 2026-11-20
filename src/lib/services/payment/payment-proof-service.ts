import { AppError } from "@/lib/infra/http/response"
import * as uploadRepo from "@/lib/repository/driver/upload-repo"
import { confirmCash } from "@/lib/services/payment/payment-service"
import type { ProofInput } from "@/lib/validation/trip/proof-schema"

export async function confirmCashWithProof(driverId: string, id: string, { proofUploadId }: ProofInput) {
  const upload = await uploadRepo.findOwned(proofUploadId, driverId)
  if (!upload || upload.kind !== "PAYMENT_PROOF" || upload.status !== "UPLOADED") throw new AppError("Upload the cash photo first", 422)
  return confirmCash(driverId, id, { proofPhotoUrl: `upload:${upload.id}` })
}
