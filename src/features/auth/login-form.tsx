"use client"
import { useState } from "react"
import type { SubmitEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowIcon } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { useLoginMutation, useLoginVerifyMutation, useSetRoleMutation } from "@/features/auth/api"
import { CodeBoxes } from "@/features/auth/code-boxes"
import { emailOk } from "@/features/auth/rules"

type Role = "RIDER" | "DRIVER"

export function LoginForm({ start = "" }: { start?: string }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const [login] = useLoginMutation()
  const [verify] = useLoginVerifyMutation()
  const [setRole] = useSetRoleMutation()
  const [email, setEmail] = useState(start)
  const [step, setStep] = useState<"email" | "password" | "code">(emailOk(start) ? "password" : "email")
  const [password, setPassword] = useState("")
  const [role, setPicked] = useState<Role>("RIDER")
  const [challenge, setChallenge] = useState("")
  const [code, setCode] = useState("")
  const [fail, setFail] = useState("")
  const valid = emailOk(email)
  const next = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (valid) setStep("password")
  }
  const finish = async () => {
    if (role === "DRIVER") await setRole({ role })
    router.replace("/")
    router.refresh()
  }
  const run = async (job: () => Promise<void>) => {
    setFail("")
    try { await job() } catch (err) { setFail(errText(err)) }
  }
  const doLogin = () => run(async () => {
    const res = await login({ email, password }).unwrap()
    if ("requiresCode" in res) {
      setChallenge(res.challengeId)
      return setStep("code")
    }
    await finish()
  })
  const doCode = () => run(async () => {
    await verify({ challengeId: challenge, code }).unwrap()
    await finish()
  })
  if (step === "email") {
    return (
      <form onSubmit={next} className="flex flex-col gap-4">
        <h1 className="text-display font-semibold leading-tight">{t("start")}</h1>
        <div className="flex items-start gap-2">
          <div className="flex-1"><Input label={t("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={valid ? undefined : t("emailBad")} /></div>
          <button type="submit" disabled={!valid} aria-label={t("next")} title={t("next")} className="flex size-16 items-center justify-center rounded-2xl bg-primary text-on-primary outline-hidden disabled:opacity-50"><ArrowIcon size={24} /></button>
        </div>
        <p className="text-sm text-muted">{t("newHere")} <Link href={`/signup?email=${encodeURIComponent(email)}`} className="text-primary">{t("createAccount")}</Link></p>
      </form>
    )
  }
  if (step === "code") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-title font-semibold">{t("adminCode")}</h1>
        <p className="text-muted">{t("adminCodeSub", { email })}</p>
        <CodeBoxes value={code} onChangeAction={setCode} label={t("codeLabel")} />
        <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
        <Slide label={t("slideVerify")} lockedLabel={t("locked")} locked={code.length < 6} onDoneAction={doCode} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("welcome")}</h1>
      <div className="flex items-center justify-between rounded-2xl bg-tint px-4 py-3">
        <span className="truncate text-ink">{email}</span>
        <button type="button" onClick={() => setStep("email")} className="text-sm text-primary outline-hidden">{t("change")}</button>
      </div>
      <div role="tablist" aria-label={t("loginAs")} className="grid grid-cols-2 gap-1 rounded-2xl bg-tint p-1">
        {(["RIDER", "DRIVER"] as const).map((r) => <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setPicked(r)} className={`h-11 rounded-xl text-base font-medium outline-hidden ${role === r ? "bg-primary text-on-primary" : "text-ink"}`}>{t(r === "RIDER" ? "rider" : "driver")}</button>)}
      </div>
      <Input label={t("password")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideLogin")} lockedLabel={t("locked")} locked={!password} onDoneAction={doLogin} />
      <p className="text-center text-sm text-muted">{t("forgot")} <Link href="/forgot-password" className="text-primary">{t("resetIt")}</Link></p>
    </div>
  )
}
