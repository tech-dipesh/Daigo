"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errText } from "@/lib/errors"
import { emailOk } from "@/features/auth/rules"
import { useContactsQuery, useRemoveContactMutation, useUpdateContactMutation } from "@/features/me/api"
import type { Contact } from "@/features/me/api"
import { useAddContactMutation } from "@/features/onboarding/api"
import { between, digits, phoneOk } from "@/features/onboarding/rules"

function Editor({ c, only }: { c: Contact; only: boolean }) {
  const t = useTranslations("me")
  const to = useTranslations("onb")
  const [update, updating] = useUpdateContactMutation()
  const [remove, removing] = useRemoveContactMutation()
  const [name, setName] = useState(c.name)
  const [phone, setPhone] = useState(c.phone)
  const [email, setEmail] = useState(c.email ?? "")
  const [fail, setFail] = useState("")
  const changed = name !== c.name || phone !== c.phone || email !== (c.email ?? "")
  const ok = between(name, 3, 15) && phoneOk(phone) && (!email || emailOk(email))
  const run = async (job: () => Promise<unknown>) => {
    setFail("")
    try { await job() } catch (err) { setFail(errText(err)) }
  }
  return (
    <li className="flex flex-col gap-2 rounded-3xl bg-surface p-4">
      {c.isPrimary && <span className="self-start rounded-full bg-tint px-3 py-1 text-xs text-ink">{t("primary")}</span>}
      <Input label={to("contactName")} value={name} onChange={(e) => setName(e.target.value)} error={between(name, 3, 15) ? undefined : to("nameBad")} />
      <Input label={to("phone")} type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(digits(e.target.value))} error={phoneOk(phone) ? undefined : to("phoneBad")} />
      <Input label={to("contactEmail")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailOk(email) ? undefined : to("emailBad")} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => run(() => update({ id: c.id, name: name.trim(), phone, email: email || null }).unwrap())} disabled={!changed || !ok || updating.isLoading}>{t("save")}</Button>
        {!c.isPrimary ? <Button look="quiet" onClick={() => run(() => update({ id: c.id, isPrimary: true }).unwrap())} disabled={updating.isLoading}>{t("makePrimary")}</Button> : <span />}
      </div>
      <Button look="danger" onClick={() => run(() => remove(c.id).unwrap())} disabled={only || removing.isLoading}>{only ? t("lastContact") : t("remove")}</Button>
    </li>
  )
}

export function Contacts() {
  const t = useTranslations("me")
  const to = useTranslations("onb")
  const list = useContactsQuery()
  const total = list.data?.length ?? 0
  const [add, adding] = useAddContactMutation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [fail, setFail] = useState("")
  const ready = between(name, 3, 15) && phoneOk(phone) && (!email || emailOk(email))
  const save = async () => {
    setFail("")
    try {
      await add({ name: name.trim(), phone, email: email || undefined, isPrimary: !list.data?.length }).unwrap()
      await list.refetch()
      setOpen(false)
      setName("")
      setPhone("")
      setEmail("")
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-title font-semibold">{t("contacts")}</h1>
      <p className="text-muted">{t("contactsHelp")}</p>
      {list.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {list.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      <ul className="flex flex-col gap-3">{list.data?.map((c) => <Editor key={c.id} c={c} only={total <= 1} />)}</ul>
      <Button look="quiet" onClick={() => setOpen(!open)} aria-expanded={open}>{t("addContact")}</Button>
      {open && (
        <div className="flex flex-col gap-2 rounded-3xl bg-tint p-4">
          <Input label={to("contactName")} value={name} onChange={(e) => setName(e.target.value)} error={between(name, 3, 15) ? undefined : to("nameBad")} />
          <Input label={to("phone")} type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(digits(e.target.value))} error={phoneOk(phone) ? undefined : to("phoneBad")} />
          <Input label={to("contactEmail")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailOk(email) ? undefined : to("emailBad")} />
          <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
          <Button onClick={save} disabled={!ready || adding.isLoading}>{t("save")}</Button>
        </div>
      )}
    </div>
  )
}
