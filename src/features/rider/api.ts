import { baseApi } from "@/store/api"

export type Quote = { vehicleType: string; price: number; low: number; high: number; breakdown: { km: number; minutes: number; baseRate: number; zone: number; time: number; weather: number; demand: number; group: number } }
export type Estimate = { distanceKm: number; minutes: number; zones: { pickup: string; drop: string }; quotes: Quote[] }
export type EstimateArgs = { fromLat: number; fromLng: number; toLat: number; toLng: number; groupSize: number; when?: string }
export type RideRequest = { id: string; status: string; fromLabel: string; toLabel: string; fromLat: number; fromLng: number; toLat: number; toLng: number; groupSize: number; expiresAt: string | null; createdAt: string }
export type Trip = { id: string; status: string; rideRequestId: string; priceEstimate: number; distanceKm: number; createdAt: string }
export type Dashboard = { completedTrips: number; totalSpent: number; moneySaved: number; activeTrip: Trip | null; recentTrips: Trip[] }
export type Matches = { direct: unknown[]; relay: unknown[]; autoAccepted?: { tripId: string } }
export type NewRequest = { fromLabel: string; fromLat: number; fromLng: number; toLabel: string; toLat: number; toLng: number; windowStart: string; windowEnd: string; groupSize: number; hasLuggage: boolean; isVulnerable: boolean; womenOnly: boolean; acOnly: boolean; allowShared: boolean; notes?: string; vehiclePreference?: string }

export const riderApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    estimate: b.query<Estimate, EstimateArgs>({ query: (params) => ({ url: "/pricing/estimate", params }) }),
    listRequests: b.query<RideRequest[], void>({ query: () => ({ url: "/requests" }), providesTags: ["Request"] }),
    createRequest: b.mutation<RideRequest, NewRequest>({ query: (body) => ({ url: "/requests", method: "post", body }), invalidatesTags: ["Request"] }),
    findMatches: b.query<Matches, string>({ query: (id) => ({ url: `/requests/${id}/matches` }) }),
    retryRequest: b.mutation<RideRequest, string>({ query: (id) => ({ url: `/requests/${id}/retry`, method: "post" }), invalidatesTags: ["Request"] }),
    joinWaitlist: b.mutation<{ id: string }, string>({ query: (id) => ({ url: `/requests/${id}/waitlist`, method: "post" }), invalidatesTags: ["Request"] }),
    listTrips: b.query<Trip[], void>({ query: () => ({ url: "/trips" }), providesTags: ["Trip"] }),
    riderDashboard: b.query<Dashboard, void>({ query: () => ({ url: "/dashboard/rider" }), providesTags: ["Trip", "Request"] }),
  }),
})

export const { useEstimateQuery, useListRequestsQuery, useCreateRequestMutation, useFindMatchesQuery, useRetryRequestMutation, useJoinWaitlistMutation, useListTripsQuery, useRiderDashboardQuery } = riderApi
