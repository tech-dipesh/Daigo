import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { errorResponse } from "@/lib/infra/errors"
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId(request)
    const contacts = await db.emergencyContact.findMany({ where: { userId } })

    return NextResponse.json({ success: true, data: contacts, error: null }, { status: 200 })
  } catch (error) {
    return errorResponse(error)
  }
}
