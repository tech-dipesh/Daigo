import { baseApi } from "@/store/api"

export type Me = { id: string; email: string; name: string | null; trustScore: number; activeRole: "RIDER" | "DRIVER" }

export const meApi = baseApi.injectEndpoints({
  endpoints: (b) => ({ me: b.query<Me, void>({ query: () => ({ url: "/me" }), providesTags: ["Me"] }) }),
})

export const { useMeQuery } = meApi
