import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@/generated/prisma/client"
import "@/lib/infra/validation"

export class AppError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status })
}

