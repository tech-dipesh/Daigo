import { Receiver } from "@upstash/qstash"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"

export async function verifyQstash(request: Request, body: string) {
  if (!env.QTASH_CURRENT || !env.QTASH_NEXT) throw new AppError("Queue signing keys are not set", 500)
  const receiver = new Receiver({ currentSigningKey: env.QTASH_CURRENT, nextSigningKey: env.QTASH_NEXT })
  const signature = request.headers.get("upstash-signature") ?? ""
  try {
    return await receiver.verify({ signature, body })
  } catch {
    return false
  }
}
