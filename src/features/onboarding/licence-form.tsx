"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { PhotoField, photoIssue } from "@/components/ui/photo"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { usePhotoUpload } from "@/features/upload/api"
import { useSubmitLicenceMutation } from "@/features/onboarding/api"
import { licenceOk } from "@/features/onboarding/rules"

export function LicenceForm() {
  const t = useTranslations("onb")
  const router = useRouter()
  const upload = usePhotoUpload()
  const [submit] = useSubmitLicenceMutation()
  const [number, setNumber] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [fail, setFail] = useState("")
  const issue = photoIssue(photo)
  const go = async () => {
    if (!photo) return
    setFail("")
    try {
      const licenseUploadId = await upload("LICENCE", photo)
      await submit({ licenseNumber: number.trim(), licenseUploadId }).unwrap()
      router.push("/onboarding/driver/review")
    } catch (err) { setFail(errText(err) || t("uploadFailed")) }
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("licTitle")}</h1>
      <Input label={t("licNo")} value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} error={licenceOk(number) ? undefined : t("licBad")} />
      <PhotoField label={t("licPhoto")} hint={t("choosePhoto")} file={photo} onFileAction={setPhoto} error={photo && issue ? t(issue) : undefined} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideLicence")} lockedLabel={t("locked")} locked={!licenceOk(number) || Boolean(issue)} onDoneAction={go} />
    </div>
  )
}
