import { baseApi } from "@/store/api"
import type { TripFull } from "@/features/trips/api"

export type DriverTrip = TripFull & { routeId: string; completedAt: string | null }

export const driverTripApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    driverTrip: b.query<DriverTrip, string>({ query: (id) => ({ url: `/trips/${id}` }), providesTags: ["Trip"] }),
    driverTrips: b.query<DriverTrip[], void>({ query: () => ({ url: "/trips" }), providesTags: ["Trip"] }),
    arrived: b.mutation<DriverTrip, string>({ query: (id) => ({ url: `/trips/${id}/arrived`, method: "post" }), invalidatesTags: ["Trip"] }),
    verifyPickup: b.mutation<DriverTrip, { id: string; otp: string }>({ query: ({ id, otp }) => ({ url: `/trips/${id}/verify-pickup`, method: "post", body: { otp } }), invalidatesTags: ["Trip"] }),
    completeTrip: b.mutation<DriverTrip, string>({ query: (id) => ({ url: `/trips/${id}/complete`, method: "post" }), invalidatesTags: ["Trip", "Payment"] }),
    noShow: b.mutation<DriverTrip, string>({ query: (id) => ({ url: `/trips/${id}/no-show`, method: "post" }), invalidatesTags: ["Trip"] }),
    firstLegLate: b.mutation<{ id: string }, string>({ query: (id) => ({ url: `/trips/${id}/report-first-leg-late`, method: "post" }), invalidatesTags: ["Trip"] }),
    sendLocation: b.mutation<{ ok: boolean }, { id: string; lat: number; lng: number }>({ query: ({ id, ...body }) => ({ url: `/trips/${id}/location`, method: "post", body }) }),
  }),
})

export const { useDriverTripQuery, useDriverTripsQuery, useArrivedMutation, useVerifyPickupMutation, useCompleteTripMutation, useNoShowMutation, useFirstLegLateMutation, useSendLocationMutation } = driverTripApi
