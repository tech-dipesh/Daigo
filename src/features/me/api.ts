import { baseApi } from "@/store/api"

export type Warning = { id: string; reason: string; note: string | null; revokedAt: string | null; createdAt: string }
export type Me = { id: string; email: string; name: string | null; language: "EN" | "NE" | "HI"; emailVerifiedAt: string | null; trustScore: number; activeRole: "RIDER" | "DRIVER"; isBanned: boolean; warnings: { active: number; limit: number; cycleEndsAt: string | null; items: Warning[] } }
export type Reviews = { average: number | null; count: number; items: { score: number; review: string | null; recommendTag: string | null; createdAt: string; route: string | null }[] }
export type Contact = { id: string; name: string; phone: string; email: string | null; isPrimary: boolean }
export type Appeal = { id: string; kind: "WARNING" | "ACCOUNT"; warningId: string | null; text: string; status: "OPEN" | "APPROVED" | "REJECTED"; decisionNote: string | null; createdAt: string }
type Patch = { role?: "RIDER" | "DRIVER"; name?: string; email?: string; language?: "EN" | "NE" | "HI"; currentPassword?: string }
type ContactPatch = { name?: string; phone?: string; email?: string | null; isPrimary?: boolean }

export const meApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    me: b.query<Me, void>({ query: () => ({ url: "/me" }), providesTags: ["Me"] }),
    warningHistory: b.query<{ items: Warning[] }, void>({ query: () => ({ url: "/warnings", params: { scope: "all" } }), providesTags: ["Me"] }),
    reviews: b.query<Reviews, void>({ query: () => ({ url: "/me/reviews" }), providesTags: ["Me"] }),
    patchMe: b.mutation<{ id: string }, Patch>({ query: (body) => ({ url: "/me", method: "patch", body }), invalidatesTags: ["Me"] }),
    setPhoto: b.mutation<{ id: string }, string>({ query: (uploadId) => ({ url: "/me/photo", method: "patch", body: { uploadId } }), invalidatesTags: ["Me"] }),
    deleteMe: b.mutation<{ deleted: boolean }, string>({ query: (currentPassword) => ({ url: "/me", method: "delete", body: { currentPassword } }) }),
    contacts: b.query<Contact[], void>({ query: () => ({ url: "/emergency-contact" }), providesTags: ["Contact"] }),
    updateContact: b.mutation<Contact, { id: string } & ContactPatch>({ query: ({ id, ...body }) => ({ url: `/emergency-contact/${id}`, method: "patch", body }), invalidatesTags: ["Contact"] }),
    removeContact: b.mutation<{ removed: boolean }, string>({ query: (id) => ({ url: `/emergency-contact/${id}`, method: "delete" }), invalidatesTags: ["Contact"] }),
    appeals: b.query<Appeal[], void>({ query: () => ({ url: "/appeals" }), providesTags: ["Appeal"] }),
    fileAppeal: b.mutation<Appeal, { kind: "WARNING" | "ACCOUNT"; warningId?: string; text: string }>({ query: (body) => ({ url: "/appeals", method: "post", body }), invalidatesTags: ["Appeal"] }),
    resetLink: b.mutation<{ message: string }, string>({ query: (email) => ({ url: "/password-reset/request", method: "post", body: { email } }) }),
  }),
})

export const { useMeQuery, useWarningHistoryQuery, useReviewsQuery, usePatchMeMutation, useSetPhotoMutation, useDeleteMeMutation, useContactsQuery, useUpdateContactMutation, useRemoveContactMutation, useAppealsQuery, useFileAppealMutation, useResetLinkMutation } = meApi
