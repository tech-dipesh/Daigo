import { ArrowRight, Check, ChevronRight, Eye, EyeOff, Loader2, Moon, ShieldCheck, Sun, X } from "lucide-react"
import type { LucideIcon, LucideProps } from "lucide-react"

const stroke = 1.75
const wrap = (I: LucideIcon) => (p: LucideProps) => <I strokeWidth={stroke} aria-hidden="true" {...p} />

export const ArrowIcon = wrap(ArrowRight)
export const CheckIcon = wrap(Check)
export const CrossIcon = wrap(X)
export const ChevronIcon = wrap(ChevronRight)
export const EyeIcon = wrap(Eye)
export const EyeOffIcon = wrap(EyeOff)
export const SpinnerIcon = wrap(Loader2)
export const MoonIcon = wrap(Moon)
export const SunIcon = wrap(Sun)
export const SosIcon = wrap(ShieldCheck)
