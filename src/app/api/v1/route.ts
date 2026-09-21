import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  const Users=["Dip", "Sharma", "Ji"]
  return NextResponse.json(Users, {status: 200})
}