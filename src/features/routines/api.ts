import { baseApi } from "@/store/api"
import type { RideRequest } from "@/features/rider/api"

export type Saved = { id: string; label: string; fromLabel: string; toLabel: string; groupSize: number }
export type Weekday = { id: string; fromLabel: string; toLabel: string; daysOfWeek: number[]; windowStartTime: string; windowEndTime: string; groupSize: number }
type Place = { fromLabel: string; fromLat: number; fromLng: number; toLabel: string; toLat: number; toLng: number; groupSize: number }
type NewSaved = Place & { label: string }
type NewWeekday = Place & { daysOfWeek: number[]; windowStart: string; windowEnd: string }

export const routinesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    saved: b.query<Saved[], void>({ query: () => ({ url: "/saved-routes" }), providesTags: ["Route"] }),
    addSaved: b.mutation<Saved, NewSaved>({ query: (body) => ({ url: "/saved-routes", method: "post", body }), invalidatesTags: ["Route"] }),
    removeSaved: b.mutation<{ removed: boolean }, string>({ query: (id) => ({ url: `/saved-routes/${id}`, method: "delete" }), invalidatesTags: ["Route"] }),
    requestSaved: b.mutation<RideRequest, string>({ query: (id) => ({ url: `/saved-routes/${id}/request`, method: "post", body: {} }), invalidatesTags: ["Request"] }),
    weekday: b.query<Weekday[], void>({ query: () => ({ url: "/permanent-requests" }), providesTags: ["Route"] }),
    addWeekday: b.mutation<Weekday, NewWeekday>({ query: (body) => ({ url: "/permanent-requests", method: "post", body }), invalidatesTags: ["Route"] }),
    cancelWeekday: b.mutation<{ cancelled: boolean }, string>({ query: (id) => ({ url: `/permanent-requests/${id}`, method: "delete" }), invalidatesTags: ["Route"] }),
    postToday: b.mutation<RideRequest, string>({ query: (id) => ({ url: `/permanent-requests/${id}/generate-today`, method: "post" }), invalidatesTags: ["Request"] }),
  }),
})

export const { useSavedQuery, useAddSavedMutation, useRemoveSavedMutation, useRequestSavedMutation, useWeekdayQuery, useAddWeekdayMutation, useCancelWeekdayMutation, usePostTodayMutation } = routinesApi
