import { NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as photoService from "@/lib/services/account/photo-service"

export const GET = withErrorHandling<RouteParams>(async (_request, { params }) => {
  const userId = await idFrom(params)
  const link = await photoService.photoLink(userId)
  return NextResponse.redirect(link, { status: 302, headers: { "Cache-Control": "private, max-age=60" } })
})
