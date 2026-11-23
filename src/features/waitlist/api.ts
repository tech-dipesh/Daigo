import { baseApi } from "@/store/api"

export type Entry = { id: string; requestId: string; status: string; expiresAt: string | null; notifiedAt: string | null; createdAt: string }

export const waitlistApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    waitlist: b.query<Entry[], void>({ query: () => ({ url: "/waitlist" }), providesTags: ["Request"] }),
    leaveWaitlist: b.mutation<{ left: boolean }, string>({ query: (id) => ({ url: `/requests/${id}/waitlist`, method: "delete" }), invalidatesTags: ["Request"] }),
  }),
})

export const { useWaitlistQuery, useLeaveWaitlistMutation } = waitlistApi
