import { baseApi } from "@/store/api"

export type DriverDash = { completedTrips: number; totalEarned: number; upcomingTrips: number; rating: { average: number | null; count: number } }
export type Incoming = { id: string; price: number; detourKm: number; requestId: string; from: string; to: string; groupSize: number; isVulnerable: boolean; expiresAt: string; routeId: string }
export type DriverRoute = { id: string; vehicleId: string; routeType: "REGULAR" | "ADVANCE"; fromLabel: string; fromLat: number; fromLng: number; toLabel: string; toLat: number; toLng: number; daysOfWeek: number[]; departureDate: string | null; departureTime: string; detourLimitKm: number; seatsAvailable: number; autoAccept: boolean; autoMinPrice: number | null; autoMinPerKm: number | null; autoMinTrust: number | null; status: "ACTIVE" | "PAUSED" }
export type NewRoute = { vehicleId: string; routeType: "REGULAR" | "ADVANCE"; fromLabel: string; fromLat: number; fromLng: number; toLabel: string; toLat: number; toLng: number; daysOfWeek: number[]; departureDate?: string; departureTime: string; detourLimitKm: number; seatsAvailable: number }
type Auto = { enabled: boolean; minPrice?: number; minPerKm?: number; minTrust?: number }

export const driverApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    driverDashboard: b.query<DriverDash, void>({ query: () => ({ url: "/dashboard/driver" }), providesTags: ["Trip"] }),
    incoming: b.query<Incoming[], void>({ query: () => ({ url: "/matches" }), providesTags: ["Match"] }),
    decideMatch: b.mutation<{ id: string }, { id: string; status: "ACCEPTED" | "REJECTED" }>({ query: ({ id, status }) => ({ url: `/matches/${id}`, method: "patch", body: { status } }), invalidatesTags: ["Match", "Trip"] }),
    listRoutes: b.query<DriverRoute[], void>({ query: () => ({ url: "/routes" }), providesTags: ["Route"] }),
    createRoute: b.mutation<DriverRoute, NewRoute>({ query: (body) => ({ url: "/routes", method: "post", body }), invalidatesTags: ["Route"] }),
    routeStatus: b.mutation<DriverRoute, { id: string; status: "ACTIVE" | "PAUSED" }>({ query: ({ id, status }) => ({ url: `/routes/${id}`, method: "patch", body: { status } }), invalidatesTags: ["Route"] }),
    autoAccept: b.mutation<DriverRoute, { id: string } & Auto>({ query: ({ id, ...body }) => ({ url: `/routes/${id}/auto-accept`, method: "patch", body }), invalidatesTags: ["Route"] }),
  }),
})

export const { useDriverDashboardQuery, useIncomingQuery, useDecideMatchMutation, useListRoutesQuery, useCreateRouteMutation, useRouteStatusMutation, useAutoAcceptMutation } = driverApi
