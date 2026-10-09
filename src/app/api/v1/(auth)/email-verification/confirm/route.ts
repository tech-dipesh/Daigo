import { z } from "zod"
import { NextResponse } from "next/server"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { consumeVerificationToken } from "@/lib/infra/verification-token"

const confirmSchema = z.object({
  token: z.string().min(1),
})
const htmlPage = (message: string) =>
  new NextResponse(`<!doctype html><body style="font-family: sans-serif; padding: 40px;">${message}</body>`, {
    headers: { "content-type": "text/html" },
  })

export const GET = withErrorHandling(async (request) => {
  const token = request.nextUrl.searchParams.get("token") ?? ""
  const userId = await consumeVerificationToken(token, "EMAIL_VERIFICATION")
  if (!userId) {
    return htmlPage("This verification link is invalid or has expired.")
  }
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } })
  return htmlPage("Your email is verified. You can close this tab.")
})

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { token } = confirmSchema.parse(await parseJsonBody(request))
  const verifiedUserId = await consumeVerificationToken(token, "EMAIL_VERIFICATION")
  if (!verifiedUserId || verifiedUserId !== userId) {
    throw new AppError("This verification code is invalid or has expired", 400)
  }
  const user = await db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, email: true, emailVerifiedAt: true },
  })
  return successResponse(user)
})
