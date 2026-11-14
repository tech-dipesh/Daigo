import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Hind } from "next/font/google"
import { cookies } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"
import { StoreProvider } from "@/store/provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const hind = Hind({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600"], variable: "--font-hind", display: "swap" })

export const metadata: Metadata = { title: "DaiGo", description: "Share the road, split the cost." }

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies()
  const locale = await getLocale()
  const theme = jar.get("theme")?.value === "dark" ? "dark" : "light"
  return (
    <html lang={locale} data-theme={theme} className={hind.variable}>
      <body className="min-h-dvh bg-page font-sans text-base text-ink antialiased">
        <NextIntlClientProvider>
          <StoreProvider>
            {children}
            <Toaster />
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
