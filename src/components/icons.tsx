import { ArrowRight, Bike, Camera, Car, CarTaxiFront, Check, ChevronRight, Eye, EyeOff, Loader2, Minus, Moon, Plus, ShieldCheck, Sun, Truck, X } from "lucide-react"
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
export const CameraIcon = wrap(Camera)
export const PlusIcon = wrap(Plus)
export const MinusIcon = wrap(Minus)
export const BikeIcon = wrap(Bike)
export const CarIcon = wrap(Car)
export const CabIcon = wrap(CarTaxiFront)
export const AutoIcon = wrap(Truck)
