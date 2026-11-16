import { baseApi } from "@/store/api"
import type { Trip } from "@/features/rider/api"

export type TripFull = Trip & { riderId: string; driverId: string; arrivedAt: string | null; pickupOtp: string | null; relayLeg: "FIRST" | "SECOND" | null; noShowReason: string | null; shareToken: string | null }
export type Counterpart = { name: string; trustScore: number; vehicle?: string; email?: string; profilePhotoUrl?: string | null }
export type Live = { available: false } | { available: true; lastLat: number; lastLng: number; remainingKm: number; etaMinutes: number; isDeviated: boolean }
export type Chat = { id: string; senderId: string; text: string; at: string }
export type Pay = { id: string; amount: number; method: "ONLINE" | "CASH"; status: string; shares: { id: string; amount?: number; status: string; overdue: boolean }[] }
export type Coins = { coinBalance: number; eligibleForDiscount: boolean; discountRupees: number; coinsNeeded: number }
type PayBody = { method: "ONLINE" | "CASH"; redeemCoins: boolean; splitWith: string[] }
type RateBody = { score: number; review?: string; recommendTag?: string }

export const tripApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTrip: b.query<TripFull, string>({ query: (id) => ({ url: `/trips/${id}` }), providesTags: ["Trip"] }),
    counterpart: b.query<Counterpart, string>({ query: (id) => ({ url: `/trips/${id}/counterpart` }) }),
    live: b.query<Live, string>({ query: (id) => ({ url: `/trips/${id}/location` }) }),
    messages: b.query<Chat[], string>({ query: (id) => ({ url: `/trips/${id}/messages` }), providesTags: ["Chat"] }),
    sendMessage: b.mutation<Chat, { id: string; text: string }>({ query: ({ id, text }) => ({ url: `/trips/${id}/messages`, method: "post", body: { text } }), invalidatesTags: ["Chat"] }),
    cancelTrip: b.mutation<TripFull, { id: string; reason?: string }>({ query: ({ id, reason }) => ({ url: `/trips/${id}/cancel`, method: "post", body: { reason } }), invalidatesTags: ["Trip"] }),
    shareTrip: b.mutation<{ shareToken: string; link: string; sentTo: number }, { id: string; emails: string[] }>({ query: ({ id, emails }) => ({ url: `/trips/${id}/share`, method: "post", body: { emails } }), invalidatesTags: ["Trip"] }),
    stopShare: b.mutation<{ stopped: boolean }, string>({ query: (id) => ({ url: `/trips/${id}/share`, method: "delete" }), invalidatesTags: ["Trip"] }),
    explainNoShow: b.mutation<TripFull, { id: string; reason: string }>({ query: ({ id, reason }) => ({ url: `/trips/${id}/no-show-reason`, method: "post", body: { reason } }), invalidatesTags: ["Trip"] }),
    getPayment: b.query<Pay, string>({ query: (id) => ({ url: `/trips/${id}/payment` }), providesTags: ["Payment"] }),
    pay: b.mutation<Pay, { id: string } & PayBody>({ query: ({ id, ...body }) => ({ url: `/trips/${id}/payment`, method: "post", body }), invalidatesTags: ["Payment", "Me"] }),
    coins: b.query<Coins, void>({ query: () => ({ url: "/coins" }), providesTags: ["Me"] }),
    rate: b.mutation<{ id: string }, { id: string } & RateBody>({ query: ({ id, ...body }) => ({ url: `/trips/${id}/rating`, method: "post", body }), invalidatesTags: ["Chat"] }),
    report: b.mutation<{ id: string }, { tripId: string; type: string; text: string }>({ query: (body) => ({ url: "/complaints", method: "post", body }) }),
  }),
})

export const { useGetTripQuery, useCounterpartQuery, useLiveQuery, useMessagesQuery, useSendMessageMutation, useCancelTripMutation, useShareTripMutation, useStopShareMutation, useExplainNoShowMutation, useGetPaymentQuery, usePayMutation, useCoinsQuery, useRateMutation, useReportMutation } = tripApi
