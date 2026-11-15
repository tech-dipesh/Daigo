import { ArrowRight, Bell, Bike, Camera, Car, CarTaxiFront, Check, ChevronDown, ChevronRight, ChevronUp, Clock, Eye, EyeOff, House, Loader2, LocateFixed, Luggage, MapPin, Minus, Moon, Plus, Route, ShieldCheck, Sun, Truck, UserRound, Users, X } from "lucide-react"
import type { LucideIcon, LucideProps } from "lucide-react"

const stroke = 1.75
const wrap = (I: LucideIcon) => (p: LucideProps) => <I strokeWidth={stroke} aria-hidden="true" {...p} />

export const ArrowIcon = wrap(ArrowRight)
export const CheckIcon = wrap(Check)
export const CrossIcon = wrap(X)
export const ChevronIcon = wrap(ChevronRight)
export const DownIcon = wrap(ChevronDown)
export const UpIcon = wrap(ChevronUp)
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
export const HomeIcon = wrap(House)
export const TripsIcon = wrap(Route)
export const BellIcon = wrap(Bell)
export const UserIcon = wrap(UserRound)
export const PinIcon = wrap(MapPin)
export const LocateIcon = wrap(LocateFixed)
export const ClockIcon = wrap(Clock)
export const PeopleIcon = wrap(Users)
export const LuggageIcon = wrap(Luggage)
