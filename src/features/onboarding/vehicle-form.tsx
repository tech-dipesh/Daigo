"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { AutoIcon, BikeIcon, CabIcon, CarIcon, MinusIcon, PlusIcon } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { PhotoField, photoIssue } from "@/components/ui/photo"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { usePhotoUpload } from "@/features/upload/api"
import { useAddVehicleMutation } from "@/features/onboarding/api"
import { between } from "@/features/onboarding/rules"

const kinds = [
  { id: "BIKE", icon: BikeIcon, seats: 1 },
  { id: "SCOOTER", icon: BikeIcon, seats: 1 },
  { id: "AUTO", icon: AutoIcon, seats: 3 },
  { id: "CAR", icon: CarIcon, seats: 4 },
  { id: "CAB", icon: CabIcon, seats: 4 },
]

export function VehicleForm() {
  const t = useTranslations("onb")
  const router = useRouter()
  const upload = usePhotoUpload()
  const [addVehicle] = useAddVehicleMutation()
  const [type, setType] = useState("CAR")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [plate, setPlate] = useState("")
  const [seats, setSeats] = useState(4)
  const [rc, setRc] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [fail, setFail] = useState("")
  const issue = photoIssue(photo)
  const ready = between(make, 1, 30) && between(model, 1, 30) && between(plate, 4, 15) && between(rc, 6, 20) && !issue
  const pick = (id: string, n: number) => {
    setType(id)
    setSeats(n)
  }
  const go = async () => {
    if (!photo) return
    setFail("")
    try {
      const rcUploadId = await upload("RC", photo)
      await addVehicle({ type, make: make.trim(), model: model.trim(), plateNumber: plate.trim(), seatCapacity: seats, rcNumber: rc.trim(), rcUploadId }).unwrap()
      router.push("/onboarding/driver/licence")
    } catch (err) { setFail(errText(err) || t("uploadFailed")) }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-semibold">{t("vehicleTitle")}</h1>
        <p className="text-muted">{t("vehicleSub")}</p>
      </div>
      <div role="radiogroup" aria-label={t("vType")} className="grid grid-cols-5 gap-2">
        {kinds.map((k) => <button key={k.id} type="button" role="radio" aria-checked={type === k.id} onClick={() => pick(k.id, k.seats)} className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl text-xs outline-hidden ${type === k.id ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}><k.icon size={24} />{t(k.id)}</button>)}
      </div>
      <Input label={t("make")} value={make} onChange={(e) => setMake(e.target.value)} error={between(make, 1, 30) ? undefined : t("makeBad")} />
      <Input label={t("model")} value={model} onChange={(e) => setModel(e.target.value)} error={between(model, 1, 30) ? undefined : t("modelBad")} />
      <Input label={t("plate")} value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} error={between(plate, 4, 15) ? undefined : t("plateBad")} />
      <div className="flex h-16 items-center justify-between rounded-2xl bg-surface px-4">
        <span className="flex flex-col"><span className="text-xs text-muted">{t("seats")}</span><span className="text-base text-ink">{seats}</span></span>
        <span className="flex gap-2">
          <button type="button" disabled={seats <= 1} onClick={() => setSeats(seats - 1)} aria-label={t("fewer")} title={t("fewer")} className="flex size-10 items-center justify-center rounded-xl bg-tint text-ink outline-hidden disabled:opacity-50"><MinusIcon size={18} /></button>
          <button type="button" disabled={seats >= 5} onClick={() => setSeats(seats + 1)} aria-label={t("more")} title={t("more")} className="flex size-10 items-center justify-center rounded-xl bg-tint text-ink outline-hidden disabled:opacity-50"><PlusIcon size={18} /></button>
        </span>
      </div>
      <Input label={t("rc")} value={rc} onChange={(e) => setRc(e.target.value)} error={between(rc, 6, 20) ? undefined : t("rcBad")} />
      <PhotoField label={t("rcPhoto")} hint={t("choosePhoto")} file={photo} onFile={setPhoto} error={photo && issue ? t(issue) : undefined} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideVehicle")} lockedLabel={t("locked")} locked={!ready} onDone={go} />
    </div>
  )
}
