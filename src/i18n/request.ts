import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

const langs = ["en", "ne", "hi"]

export default getRequestConfig(async () => {
  const jar = await cookies()
  const saved = jar.get("lang")?.value ?? "en"
  const locale = langs.includes(saved) ? saved : "en"
  const messages = (await import(`@/messages/${locale}.json`)).default
  return { locale, messages }
})
