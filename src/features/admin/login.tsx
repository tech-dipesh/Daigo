"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { useLoginMutation, useLoginVerifyMutation } from "@/features/auth/api"
import { CodeBoxes } from "@/features/auth/code-boxes"
import { emailOk } from "@/features/auth/rules"

export function AdminLogin() {
  const t = useTranslations("admin")
  const ta = useTranslations("auth")
  const router = useRouter()
  const [login] = useLoginMutation()
  const [verify] = useLoginVerifyMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [challenge, setChallenge] = useState("")
  const [code, setCode] = useState("")
  const [fail, setFail] = useState("")
  const done = () => {
    router.replace("/")
    router.refresh()
  }
  const run = async (job: () => Promise<void>) => {
    setFail("")
    try { await job() } catch (err) { setFail(errText(err)) }
  }
  const first = () => run(async () => {
    const res = await login({ email, password }).unwrap()
    if ("requiresCode" in res) return setChallenge(res.challengeId)
    done()
  })
  const second = () => run(async () => {
    await verify({ challengeId: challenge, code }).unwrap()
    done()
  })
  if (challenge) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-title font-semibold">{ta("adminCode")}</h1>
        <p className="text-muted">{ta("adminCodeSub", { email })}</p>
        <CodeBoxes value={code} onChangeAction={setCode} label={ta("codeLabel")} />
        <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
        <Slide label={ta("slideVerify")} lockedLabel={ta("locked")} locked={code.length < 6} onDoneAction={second} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("loginTitle")}</h1>
      <Input label={ta("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailOk(email) ? undefined : ta("emailBad")} />
      <Input label={ta("password")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={ta("slideLogin")} lockedLabel={ta("locked")} locked={!emailOk(email) || !password} onDoneAction={first} />
    </div>
  )
}
