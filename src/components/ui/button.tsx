import type { ButtonHTMLAttributes } from "react"

const looks = {
  primary: "bg-primary text-on-primary hover:brightness-110",
  quiet: "bg-tint text-ink hover:brightness-95",
  danger: "bg-danger text-on-primary hover:brightness-110",
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { look?: keyof typeof looks }

export function Button({ look = "primary", className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={`h-12 rounded-2xl px-5 text-base font-medium outline-hidden transition-[filter] focus-visible:brightness-90 disabled:opacity-50 ${looks[look]} ${className}`} {...rest} />
}
