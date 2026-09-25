import { NextResponse } from "next/server"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
export const GET = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)
  const documents = await db.driverDocument.findMany({ where: { userId } })

  return NextResponse.json({ success: true, data: documents, error: null }, { status: 200 })
})
