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

export type EmailConfirmInput = z.infer<typeof emailConfirmSchema>
export type EmailCodeInput = z.infer<typeof emailCodeSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type LoginVerifyInput = z.infer<typeof loginVerifySchema>
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type SignupInput = z.infer<typeof signupSchema>
