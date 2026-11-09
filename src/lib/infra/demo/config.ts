import { env } from "@/lib/infra/clients/env"

export const demoDomain = "@dipsharma.me"
export const demoPassword = "Daigo#666"

export const demoOn = () => env.DEMO_MODE === "true"
export const isDemoMailbox = (email: string) => email.toLowerCase().endsWith(demoDomain)

/*
 live account gets will be a real emails but is still wiped by reset
 */
export const isDemoAccount = (email: string) => isDemoMailbox(email) || email.toLowerCase() === env.DEMO_LIVE_EMAIL?.toLowerCase()
