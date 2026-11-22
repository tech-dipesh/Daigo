"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { BellIcon, HomeIcon, TripsIcon, UserIcon } from "@/components/icons"
import { useNotesQuery } from "@/features/alerts/api"

const items = {
  rider: [{ href: "/home", key: "home", icon: HomeIcon }, { href: "/trips", key: "trips", icon: TripsIcon }, { href: "/alerts", key: "alerts", icon: BellIcon }, { href: "/me", key: "me", icon: UserIcon }],
  driver: [{ href: "/driver", key: "home", icon: HomeIcon }, { href: "/driver/trips", key: "trips", icon: TripsIcon }, { href: "/alerts", key: "alerts", icon: BellIcon }, { href: "/me", key: "me", icon: UserIcon }],
}

export function Nav({ role }: { role: keyof typeof items }) {
  const t = useTranslations("nav")
  const path = usePathname()
  const notes = useNotesQuery(20)
  const unread = notes.data?.unreadCount ?? 0
  return (
    <nav aria-label={t("main")} className="fixed inset-x-0 bottom-0 z-40 flex justify-around bg-surface px-2 py-2 lg:sticky lg:top-0 lg:h-dvh lg:w-56 lg:shrink-0 lg:flex-col lg:justify-start lg:gap-1 lg:px-3 lg:pt-20">
      {items[role].map((i) => {
        const on = path === i.href || (i.href !== "/home" && i.href !== "/driver" && path.startsWith(i.href))
        const dot = i.key === "alerts" && unread > 0
        return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} aria-label={dot ? `${t(i.key)}, ${t("unread", { count: unread })}` : undefined} className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs lg:flex-none lg:flex-row lg:gap-3 lg:text-base ${on ? "bg-tint text-primary" : "text-muted"}`}><span className="relative"><i.icon size={22} />{dot && <span aria-hidden="true" className="absolute -top-1 -right-1 size-2.5 rounded-full bg-danger" />}</span>{t(i.key)}</Link>
      })}
    </nav>
  )
}
