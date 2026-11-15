"use client"
import dynamic from "next/dynamic"

export const LazyMap = dynamic(async () => (await import("@/features/map/map")).RouteMap, { ssr: false, loading: () => <div aria-busy="true" className="size-full min-h-64 rounded-3xl bg-tint" /> })
