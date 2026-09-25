import { NextResponse } from "next/server"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
export const GET = withErrorHandling(async (request) => {
  const ownerId = await requireUserId(request)
  const vehicles = await db.vehicle.findMany({ where: { ownerId } })

  return NextResponse.json({ success: true, data: vehicles, error: null }, { status: 200 })
})
