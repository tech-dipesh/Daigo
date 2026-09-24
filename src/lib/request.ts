import { NextRequest } from "next/server";

export async function getSafeJson<T>(req: NextRequest): Promise<Partial<T>> {
  try {
    const copyjson = req.clone();
    return await copyjson.json();
  } catch {
    return {} as Partial<T>;
  }
}