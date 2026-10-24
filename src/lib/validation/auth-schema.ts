import { z } from "zod"

export const emailConfirmSchema = z.object({
  token: z.string().min(1),
})

export const emailCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/) })

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const loginVerifySchema = z.object({
  challengeId: z.uuid(),
  code: z.string().regex(/^\d{6}$/),
})

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

export const passwordResetRequestSchema = z.object({
  email: z.email(),
})

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})
