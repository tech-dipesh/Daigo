import { NextResponse } from "next/server"
import { z } from "zod"

export class AppError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, data: null, error: { message: error.message } },
      { status: error.status },
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, data: null, error: z.flattenError(error) },
      { status: 400 },
    )
  }

  return NextResponse.json(
    { success: false, data: null, error: { message: "Something went wrong. Please try again." } },
    { status: 500 },
  )
}
