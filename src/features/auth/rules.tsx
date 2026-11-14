import { useTranslations } from "next-intl"
import { z } from "zod"
import { CheckIcon, CrossIcon } from "@/components/icons"

export const emailOk = (v: string) => z.email().safeParse(v).success

const checks = [
  { key: "ruleLen", ok: (v: string) => v.length >= 8 },
  { key: "ruleLetter", ok: (v: string) => /[A-Za-z]/.test(v) },
  { key: "ruleNum", ok: (v: string) => /\d/.test(v) },
]

export const passOk = (v: string) => checks.every((c) => c.ok(v))

export function PasswordRules({ value }: { value: string }) {
  const t = useTranslations("auth")
  return (
    <ul className="flex flex-col gap-1 px-1 text-sm">
      {checks.map((c) => {
        const met = c.ok(value)
        const tone = met ? "text-success" : value ? "text-danger" : "text-muted"
        return <li key={c.key} className={`flex items-center gap-2 ${tone}`}>{met ? <CheckIcon size={16} /> : <CrossIcon size={16} />}{t(c.key)}</li>
      })}
    </ul>
  )
}
