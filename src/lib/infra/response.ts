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

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = error.meta?.target

    const fields = Array.isArray(target)
      ? target.map((field) => String(field).replace(/_/g, " ")).join(" and ")
      : "value"

    return NextResponse.json(
      { success: false, data: null, error: { message: `This ${fields} is already in use` } },
      { status: 409 },
    )
  }
  console.log("Error ", error);
  return NextResponse.json(
    { success: false, data: null, error: { message: "Something went wrong. Please try again." } },
    { status: 500 },
  )
}
