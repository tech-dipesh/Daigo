import { redirect } from "next/navigation"
import { getSession, landing } from "@/lib/session"

export default async function Home() {
  const s = await getSession()
  redirect(s ? landing(s) : "/login")
}
