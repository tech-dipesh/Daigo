import { baseApi } from "@/store/api"
import type { Checkout } from "@/features/payments/checkout"

export type Shared = { status: string; vehicle: string; lastLat: number | null; lastLng: number | null; lastLocationAt: string | null; isDeviated: boolean; etaMinutes: number | null }
export type Share = { amount: number; status: "PENDING" | "PAID"; expiresAt: string }

export const sharedApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    shared: b.query<Shared, string>({ query: (token) => ({ url: `/trips/shared/${token}` }) }),
    share: b.query<Share, string>({ query: (id) => ({ url: `/payment-shares/${id}` }), providesTags: ["Payment"] }),
    payShare: b.mutation<{ paid: boolean; paymentComplete: boolean; checkout?: Checkout }, string>({ query: (id) => ({ url: `/payment-shares/${id}/pay`, method: "post" }), invalidatesTags: ["Payment"] }),
  }),
})

export const { useSharedQuery, useShareQuery, usePayShareMutation } = sharedApi
