"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { LogoutButton } from "@/features/auth/logout-button"
import { emailOk } from "@/features/auth/rules"
import { useAddContactMutation } from "@/features/onboarding/api"
import { between, digits, phoneOk } from "@/features/onboarding/rules"

export function ContactForm() {
  const t = useTranslations("onb")
  const router = useRouter()
  const [add] = useAddContactMutation()
  const [hurry, setHurry] = useState(false)
  const [yourName, setYourName] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [fail, setFail] = useState("")
  const extras = hurry || ((!yourName || between(yourName, 3, 15)) && (!email || emailOk(email)))
  const ready = between(name, 3, 15) && phoneOk(phone) && extras
  const go = async () => {
    setFail("")
    const more = hurry ? {} : { email: email || undefined, yourName: yourName.trim() || undefined }
    try {
      await add({ name: name.trim(), phone, isPrimary: true, ...more }).unwrap()
      router.replace("/")
      router.refresh()
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-semibold">{t("contactTitle")}</h1>
        <p className="text-muted">{t("contactSub")}</p>
      </div>
      {!hurry && <Input label={t("yourName")} autoComplete="name" value={yourName} onChange={(e) => setYourName(e.target.value)} error={between(yourName, 3, 15) ? undefined : t("nameBad")} />}
      <Input label={t("contactName")} value={name} onChange={(e) => setName(e.target.value)} error={between(name, 3, 15) ? undefined : t("nameBad")} />
      <Input label={t("phone")} type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(digits(e.target.value))} error={phoneOk(phone) ? undefined : t("phoneBad")} />
      {!hurry && <Input label={t("contactEmail")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailOk(email) ? undefined : t("emailBad")} />}
      <button type="button" onClick={() => setHurry(!hurry)} className="self-start text-sm text-primary outline-hidden">{hurry ? t("full") : t("hurry")}</button>
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideContact")} lockedLabel={t("locked")} locked={!ready} onDone={go} />
      <LogoutButton />
    </div>
  )
}
