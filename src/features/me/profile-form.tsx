"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhotoField, photoIssue } from "@/components/ui/photo"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"
import { emailOk } from "@/features/auth/rules"
import { useMeQuery, usePatchMeMutation, useResetLinkMutation, useSetPhotoMutation } from "@/features/me/api"
import { between } from "@/features/onboarding/rules"
import { usePhotoUpload } from "@/features/upload/api"

export function ProfileForm() {
  const t = useTranslations("me")
  const to = useTranslations("onb")
  const dispatch = useAppDispatch()
  const me = useMeQuery()
  const upload = usePhotoUpload()
  const [patch] = usePatchMeMutation()
  const [setPhoto] = useSetPhotoMutation()
  const [reset, resetting] = useResetLinkMutation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [photo, setPicked] = useState<File | null>(null)
  const [bust, setBust] = useState("")
  const [fail, setFail] = useState("")
  const d = me.data
  useEffect(() => {
    if (!d) return
    setName(d.name ?? "")
    setEmail(d.email)
  }, [d?.name, d?.email])
  const emailChanged = Boolean(d) && email !== d?.email
  const issue = photoIssue(photo)
  const nameChanged = Boolean(d) && name.trim() !== (d?.name ?? "")
  const ok = (nameChanged ? between(name, 3, 15) : true) && (emailChanged ? emailOk(email) && password.length > 0 : true) && (nameChanged || emailChanged)
  const run = async (job: () => Promise<unknown>) => {
    setFail("")
    try { await job() } catch (err) { setFail(errText(err) || to("uploadFailed")) }
  }
  const save = () => run(async () => {
    await patch({ name: nameChanged ? name.trim() : undefined, email: emailChanged ? email : undefined, currentPassword: emailChanged ? password : undefined }).unwrap()
    setPassword("")
    dispatch(pushToast({ key: "me.saved", kind: "success" }))
  })
  const savePhoto = () => run(async () => {
    if (!photo) return
    const id = await upload("PROFILE_PHOTO", photo)
    await setPhoto(id).unwrap()
    setPicked(null)
    setBust(String(Date.now()))
  })
  const sendReset = () => run(async () => {
    if (!d) return
    await reset(d.email).unwrap()
    dispatch(pushToast({ key: "me.resetSent", kind: "success" }))
  })
  if (!d) return null
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-title font-semibold">{t("editProfile")}</h1>
      <div className="flex items-center gap-4"><Avatar id={d.id} size={72} bust={bust} /><div className="flex-1"><PhotoField label={t("photo")} hint={to("choosePhoto")} file={photo} onFileAction={setPicked} error={photo && issue ? to(issue) : undefined} /></div></div>
      {photo && !issue && <Slide label={t("slidePhoto")} lockedLabel={t("slidePhoto")} locked={false} onDoneAction={savePhoto} />}
      <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} error={between(name, 3, 15) ? undefined : to("nameBad")} />
      <Input label={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailOk(email) ? undefined : to("emailBad")} />
      {emailChanged && <><p className="text-sm text-muted">{t("emailHelp")}</p><Input label={t("currentPassword")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></>}
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideSave")} lockedLabel={t("lockedSave")} locked={!ok} onDoneAction={save} />
      <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4"><p className="text-base text-ink">{t("password")}</p><p className="text-sm text-muted">{t("passwordHelp")}</p><Button look="quiet" onClick={sendReset} disabled={resetting.isLoading}>{t("sendReset")}</Button></div>
    </div>
  )
}
