"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { errText } from "@/lib/errors"
import { useAdminUsersQuery, useSetStaffMutation } from "@/features/admin/api"
import type { AdminUser } from "@/features/admin/api"
import { State, Title, cell, field } from "@/features/admin/ui"

type Role = "MODERATOR" | "SUPER_ADMIN" | null

function Row({ u }: { u: AdminUser }) {
  const t = useTranslations("admin")
  const [set, busy] = useSetStaffMutation()
  const [fail, setFail] = useState("")
  const change = async (value: string) => {
    setFail("")
    try { await set({ id: u.id, staffRole: (value || null) as Role }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  return (
    <tr className="odd:bg-surface">
      <td className={cell}>{u.email}</td>
      <td className={cell}>
        <select value={u.staffRole ?? ""} disabled={busy.isLoading} onChange={(e) => change(e.target.value)} aria-label={t("staffRole")} className={`${field} bg-tint`}>
          <option value="">{t("noStaff")}</option>
          <option value="MODERATOR">{t("moderator")}</option>
          <option value="SUPER_ADMIN">{t("superAdmin")}</option>
        </select>
        {fail && <span role="alert" className="ml-2 text-danger">{fail}</span>}
      </td>
    </tr>
  )
}

export function Staff() {
  const t = useTranslations("admin")
  const [text, setText] = useState("")
  const [q, setQ] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 350)
    return () => clearTimeout(timer)
  }, [text])
  const staff = useAdminUsersQuery({ q: "", staff: true })
  const found = useAdminUsersQuery({ q, staff: false }, { skip: q.length < 3 })
  return (
    <div className="flex flex-col gap-4">
      <Title>{t("nav_staff")}</Title>
      <p className="text-muted">{t("staffHelp")}</p>
      <State loading={staff.isLoading} error={staff.isError} empty={Boolean(staff.data) && !staff.data?.length} emptyText={t("nothing")} errorText={t("loadFail")} />
      {staff.data && staff.data.length > 0 && <div className="overflow-x-auto rounded-2xl"><table className="w-full"><tbody>{staff.data.map((u) => <Row key={u.id} u={u} />)}</tbody></table></div>}
      <h2 className="font-semibold">{t("addStaff")}</h2>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("searchUsers")} aria-label={t("searchUsers")} className={`${field} h-11`} />
      {found.data && <div className="overflow-x-auto rounded-2xl"><table className="w-full"><tbody>{found.data.filter((u) => !u.staffRole).map((u) => <Row key={u.id} u={u} />)}</tbody></table></div>}
    </div>
  )
}
