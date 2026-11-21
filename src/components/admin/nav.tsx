"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

const items = [
  { href: "/admin/dashboard", key: "dashboard" },
  { href: "/admin/verifications", key: "verifications" },
  { href: "/admin/emergencies", key: "emergencies" },
  { href: "/admin/complaints", key: "complaints" },
  { href: "/admin/appeals", key: "appeals" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/zones", key: "zones" },
  { href: "/admin/fares", key: "fares" },
  { href: "/admin/staff", key: "staff", super: true },
  { href: "/admin/exports", key: "exports", super: true },
  { href: "/admin/demo", key: "demo", super: true },
]

export function AdminNav({ isSuper }: { isSuper: boolean }) {
  const t = useTranslations("admin")
  const path = usePathname()
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto bg-surface px-2 py-2 lg:sticky lg:top-0 lg:h-dvh lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:px-3 lg:pt-16">
      {items.filter((i) => !i.super || isSuper).map((i) => {
        const on = path.startsWith(i.href)
        return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={`shrink-0 rounded-xl px-3 py-2 text-sm ${on ? "bg-tint font-medium text-primary" : "text-muted"}`}>{t(`nav_${i.key}`)}</Link>
      })}
    </nav>
  )
}
