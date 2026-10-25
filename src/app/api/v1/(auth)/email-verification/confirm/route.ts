import { NextResponse } from "next/server"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as emailVerificationService from "@/lib/services/email-verification-service"
import { emailConfirmSchema } from "@/lib/validation/auth-schema"

const htmlPage = (message: string) =>
  new NextResponse(`<!doctype html><body style="font-family: sans-serif; padding: 40px;">${message}</body>`, {
    headers: { "content-type": "text/html" },
  })

export const GET = withErrorHandling(async (request) => {
  const token = request.nextUrl.searchParams.get("token") ?? ""
  const verified = await emailVerificationService.verifyEmailLink(token)
  return htmlPage(verified ? "Your email is verified. You can close this tab." : "This verification link is invalid or has expired.")
})

export const POST = withErrorHandling(async (request) => {
  const input = emailConfirmSchema.parse(await parseJsonBody(request))
  const user = await emailVerificationService.verifyEmailToken(input)
  return successResponse(user)
})
