import { baseApi } from "@/store/api"

export type Note = { id: string; type: string; title: string; body: string; data: Record<string, unknown> | null; readAt: string | null; createdAt: string }
export type NotePage = { items: Note[]; nextCursor: string | null; unreadCount: number }

export const alertsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    notes: b.query<NotePage, number>({ query: (limit) => ({ url: "/notifications", params: { limit } }), providesTags: ["Notification"] }),
    readNote: b.mutation<Note, string>({ query: (id) => ({ url: `/notifications/${id}`, method: "patch" }), invalidatesTags: ["Notification"] }),
    readAll: b.mutation<{ updated: number }, void>({ query: () => ({ url: "/notifications/read-all", method: "post" }), invalidatesTags: ["Notification"] }),
  }),
})

export const { useNotesQuery, useReadNoteMutation, useReadAllMutation } = alertsApi
