"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { StarIcon } from "@/components/icons"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"
import { useRateMutation } from "@/features/trips/api"

const tags = ["GOOD_CONVERSATION", "DRIVING_SKILL", "PUNCTUAL", "CLEAN_VEHICLE"]

export function Rate({ id }: { id: string }) {
  const t = useTranslations("trips")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [rate] = useRateMutation()
  const [score, setScore] = useState(0)
  const [tag, setTag] = useState("")
  const [review, setReview] = useState("")
  const [fail, setFail] = useState("")
  const go = async () => {
    setFail("")
    try {
      await rate({ id, score, review: review.trim() || undefined, recommendTag: score >= 4 && tag ? tag : undefined }).unwrap()
      dispatch(pushToast({ key: "trips.thanks", kind: "success" }))
      router.push("/trips")
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-title font-semibold">{t("rateTitle")}</h1>
      <div role="radiogroup" aria-label={t("stars")} className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={score === n} aria-label={`${n}`} title={`${n}`} onClick={() => setScore(n)} className={`flex h-16 flex-1 items-center justify-center rounded-2xl outline-hidden ${n <= score ? "bg-primary text-on-primary" : "bg-surface text-muted"}`}><StarIcon size={28} className={n <= score ? "fill-current" : ""} /></button>)}
      </div>
      {score >= 4 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{t("tagHelp")}</p>
          <div className="flex flex-wrap gap-2">{tags.map((x) => <button key={x} type="button" aria-pressed={tag === x} onClick={() => setTag(tag === x ? "" : x)} className={`h-11 rounded-2xl px-4 text-sm outline-hidden ${tag === x ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}>{t(`tag_${x}`)}</button>)}</div>
        </div>
      )}
      <textarea value={review} maxLength={300} onChange={(e) => setReview(e.target.value)} placeholder={t("review")} aria-label={t("review")} className="min-h-24 rounded-2xl bg-surface p-4 text-base text-ink outline-hidden placeholder:text-muted" />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideRate")} lockedLabel={t("lockedRate")} locked={!score} onDoneAction={go} />
    </div>
  )
}
