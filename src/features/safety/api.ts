import { baseApi } from "@/store/api"

type Spot = { lat: number; lng: number; tripId?: string }

export const safetyApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    sos: b.mutation<{ id: string }, Spot>({ query: (body) => ({ url: "/emergency", method: "post", body }) }),
  }),
})

export const { useSosMutation } = safetyApi
