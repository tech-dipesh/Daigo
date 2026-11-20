import { baseApi } from "@/store/api"

export type BoardItem = { matchId: string; price: number; detourKm: number; vehicle: { type: string; make: string; model: string }; driver: { name: string | null; trustScore: number; photo: string | null; ratingAvg: number | null; ratingCount: number }; lastOffer: { by: "RIDER" | "DRIVER"; price: number; round: number; expiresAt: string } | null }
export type Board = { status: string; expiresAt: string | null; items: BoardItem[] }
export type OfferInfo = { offers: { id: string; round: number; by: "RIDER" | "DRIVER"; price: number; expiresAt: string }[]; nextRound: number | null; bounds: { low: number; high: number; hardCap: number } }

export const offersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    board: b.query<Board, string>({ query: (id) => ({ url: `/requests/${id}/board` }), providesTags: ["Offer", "Request"] }),
    offers: b.query<OfferInfo, string>({ query: (id) => ({ url: `/matches/${id}/offers` }), providesTags: ["Offer"] }),
    makeOffer: b.mutation<{ id: string }, { id: string; price: number }>({ query: ({ id, price }) => ({ url: `/matches/${id}/offers`, method: "post", body: { price } }), invalidatesTags: ["Offer", "Match"] }),
    acceptOffer: b.mutation<{ tripId: string; price: number }, string>({ query: (id) => ({ url: `/matches/${id}/offers/accept`, method: "post" }), invalidatesTags: ["Offer", "Trip", "Request", "Match"] }),
  }),
})

export const { useBoardQuery, useOffersQuery, useMakeOfferMutation, useAcceptOfferMutation } = offersApi
