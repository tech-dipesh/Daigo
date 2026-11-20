import { useTranslations } from "next-intl"
import { trustWord } from "@/lib/trust"

const radius = 54
const round = 2 * Math.PI * radius

export function TrustRing({ score }: { score: number }) {
  const t = useTranslations("trips")
  const share = Math.max(0, Math.min(100, score)) / 100
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`${score}, ${t(`trust_${trustWord(score)}`)}`}>
      <svg width="136" height="136" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={radius} fill="none" strokeWidth="12" className="stroke-tint" />
        <circle cx="68" cy="68" r={radius} fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={round} strokeDashoffset={round * (1 - share)} transform="rotate(-90 68 68)" className="stroke-primary" />
        <text x="68" y="78" textAnchor="middle" fontSize="34" fontWeight="600" className="fill-ink">{score}</text>
      </svg>
      <span className="text-lg font-medium text-ink">{t(`trust_${trustWord(score)}`)}</span>
    </div>
  )
}
