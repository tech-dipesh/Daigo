"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { stamp } from "@/lib/time"
import { useAdminUserQuery, useAdminUsersQuery } from "@/features/admin/api"
import { State, Title, cell, field } from "@/features/admin/ui"

const trustWord = (n: number) => (n >= 90 ? "trust_exceptional" : n >= 75 ? "trust_dependable" : n >= 60 ? "trust_steady" : n >= 40 ? "trust_cautious" : "trust_limited")

export function Users() {
  const t = useTranslations("admin")
  const tt = useTranslations("trips")
  const [text, setText] = useState("")
  const [q, setQ] = useState("")
  const [pick, setPick] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 350)
    return () => clearTimeout(timer)
  }, [text])
  const list = useAdminUsersQuery({ q, staff: false })
  const one = useAdminUserQuery(pick, { skip: !pick })
  const d = one.data
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-3">
        <Title>{t("nav_users")}</Title>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("searchUsers")} aria-label={t("searchUsers")} className={`${field} h-11`} />
        <State loading={list.isLoading} error={list.isError} empty={Boolean(list.data) && !list.data?.length} emptyText={t("nothing")} errorText={t("loadFail")} />
        {list.data && list.data.length > 0 && (
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full"><thead><tr className="text-muted"><th className={cell}>{t("email")}</th><th className={cell}>{t("role")}</th><th className={cell}>{t("trust")}</th><th className={cell}>{t("joined")}</th></tr></thead>
              <tbody>{list.data.map((u) => <tr key={u.id} onClick={() => setPick(u.id)} aria-selected={pick === u.id} className={`cursor-pointer ${pick === u.id ? "bg-tint" : "odd:bg-surface"}`}><td className={cell}>{u.email}{u.isBanned ? <span className="ml-2 text-danger">{t("banned")}</span> : null}</td><td className={cell}>{u.staffRole ?? u.activeRole}</td><td className={cell}>{u.trustScore}</td><td className={`${cell} text-muted`}>{stamp(u.createdAt)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
      <aside className="flex flex-col gap-2 rounded-2xl bg-surface p-4 lg:sticky lg:top-4 lg:self-start" aria-label={t("detail")}>
        {!pick && <p className="text-muted">{t("pickUser")}</p>}
        {pick && one.isLoading && <p className="text-muted">{t("loading")}</p>}
        {d && (
          <>
            <p className="text-lg font-semibold text-ink">{d.name ?? d.email}</p>
            <p className="text-muted">{d.email}</p>
            <dl className="mt-2 grid grid-cols-2 gap-y-1">
              <dt className="text-muted">{t("role")}</dt><dd>{d.staffRole ?? d.activeRole}</dd>
              <dt className="text-muted">{t("trust")}</dt><dd>{d.trustScore} · {tt(trustWord(d.trustScore))}</dd>
              <dt className="text-muted">{t("tripsTotal")}</dt><dd>{d.trips}</dd>
              <dt className="text-muted">{t("warnings")}</dt><dd>{d.warnings}</dd>
              <dt className="text-muted">{t("complaintsAgainst")}</dt><dd>{d.complaints}</dd>
              <dt className="text-muted">{t("verified")}</dt><dd>{d.emailVerifiedAt ? t("yes") : t("no")}</dd>
              <dt className="text-muted">{t("joined")}</dt><dd>{stamp(d.createdAt)}</dd>
            </dl>
          </>
        )}
      </aside>
    </div>
  )
}
