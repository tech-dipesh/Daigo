import { baseApi } from "@/store/api"

type Creds = { email: string; password: string }
type LoginRes = { userId: string; email: string } | { requiresCode: true; challengeId: string }

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<LoginRes, Creds>({ query: (body) => ({ url: "/login", method: "post", body }) }),
    loginVerify: b.mutation<{ userId: string; email: string }, { challengeId: string; code: string }>({ query: (body) => ({ url: "/login/verify", method: "post", body }) }),
    signup: b.mutation<{ userId: string; email: string }, Creds>({ query: (body) => ({ url: "/signup", method: "post", body }) }),
    verifyCode: b.mutation<{ id: string; email: string }, { code: string }>({ query: (body) => ({ url: "/email-verification/verify-code", method: "post", body }) }),
    resendCode: b.mutation<{ message: string }, void>({ query: () => ({ url: "/email-verification/request", method: "post" }) }),
    confirmEmail: b.mutation<{ id: string; email: string }, { token: string }>({ query: (body) => ({ url: "/email-verification/confirm", method: "post", body }) }),
    resetRequest: b.mutation<{ message: string }, { email: string }>({ query: (body) => ({ url: "/password-reset/request", method: "post", body }) }),
    resetConfirm: b.mutation<{ message: string }, { token: string; newPassword: string }>({ query: (body) => ({ url: "/password-reset/confirm", method: "post", body }) }),
    setRole: b.mutation<{ id: string }, { role: "RIDER" | "DRIVER" }>({ query: (body) => ({ url: "/me", method: "patch", body }) }),
  }),
})

export const { useLoginMutation, useLoginVerifyMutation, useSignupMutation, useVerifyCodeMutation, useResendCodeMutation, useConfirmEmailMutation, useResetRequestMutation, useResetConfirmMutation, useSetRoleMutation } = authApi
