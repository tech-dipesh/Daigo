"use client"
import dynamic from "next/dynamic"

export const LazyBars = dynamic(async () => (await import("@/features/admin/charts")).DayBars, { ssr: false, loading: () => <div aria-busy="true" className="h-45 rounded-2xl bg-tint" /> })
