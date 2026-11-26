
import { baseApi } from "@/store/api"
import type { Proof } from "@/features/payments/checkout"

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    verifyPayment: b.mutation<{ paid: boolean; waiting: boolean }, Proof>({ query: (body) => ({ url: "/payments/verify", method: "post", body }), invalidatesTags: ["Payment", "Me"] }),
  }),
})

export const { useVerifyPaymentMutation } = paymentsApi
