import { baseApi } from "@/store/api"

export type RouteLine = { km: number; minutes: number; line: [number, number][]; road: boolean }
type Ends = { fromLat: number; fromLng: number; toLat: number; toLng: number }

export const mapApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    routeLine: b.query<RouteLine, Ends>({ query: (params) => ({ url: "/route-line", params }) }),
  }),
})

export const { useRouteLineQuery } = mapApi
