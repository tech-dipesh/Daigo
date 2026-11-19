import { createApi } from "@reduxjs/toolkit/query/react"
import { axiosBaseQuery } from "@/lib/base-query"

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Me", "Request", "Trip", "Notification", "Route", "Vehicle", "Licence", "Chat", "Payment", "Match", "Offer"],
  endpoints: () => ({}),
})
