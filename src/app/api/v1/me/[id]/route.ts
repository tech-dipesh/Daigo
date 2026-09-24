import { getSafeJson } from "@/lib/request";
import { NextRequest } from "next/server";

export  async function GET(req: NextRequest){
  const { id } = <{ id: string }>getSafeJson(req);
}