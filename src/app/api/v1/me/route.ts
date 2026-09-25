import { NextResponse } from "next/server"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { AppError } from "@/lib/infra/errors"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, activeRole: true, createdAt: true },
  })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  return NextResponse.json({ success: true, data: user, error: null }, { status: 200 })
})
