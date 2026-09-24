
import { prisma } from "@/lib/prisma";
import { getSafeJson } from "@/lib/request";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // const {email, password}=await <{email: String, password: String}>getSafeJson(req.json())
    const {email, password} = await getSafeJson<{ email: string; password: string }>(req);
    if (!email || !password) {
      return NextResponse.json(
        { message: "Please Enter an Email & Password" }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Successfully Logged In" });
  } 
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: `Error occurred: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}
