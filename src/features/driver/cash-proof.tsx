"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { PhotoField, photoIssue } from "@/components/ui/photo"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { useConfirmProofMutation } from "@/features/driver/trip-api"
import { usePhotoUpload } from "@/features/upload/api"

export function CashProof({ id }: { id: string }) {
  const t = useTranslations("dtrip")
  const to = useTranslations("onb")
  const upload = usePhotoUpload()
  const [confirm] = useConfirmProofMutation()
  const [photo, setPhoto] = useState<File | null>(null)
  const [fail, setFail] = useState("")
  const issue = photoIssue(photo)
  const go = async () => {
    if (!photo) return
    setFail("")
    try {
      const proofUploadId = await upload("PAYMENT_PROOF", photo)
      await confirm({ id, proofUploadId }).unwrap()
    } catch (err) { setFail(errText(err) || to("uploadFailed")) }
  }
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5">
      <p className="text-base text-ink">{t("proofHelp")}</p>
      <PhotoField label={t("proofPhoto")} hint={to("choosePhoto")} file={photo} onFileAction={setPhoto} error={photo && issue ? to(issue) : undefined} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideCash")} lockedLabel={t("lockedCash")} locked={!photo || Boolean(issue)} onDoneAction={go} />
    </div>
  )
}
