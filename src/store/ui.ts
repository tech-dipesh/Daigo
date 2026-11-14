import { createSlice, nanoid } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export type Toast = { id: string; key: string; kind: "error" | "success" | "info" }

const slice = createSlice({
  name: "ui",
  initialState: { toasts: [] as Toast[] },
  reducers: {
    pushToast: { reducer: (s, a: PayloadAction<Toast>) => void s.toasts.push(a.payload), prepare: (t: Omit<Toast, "id">) => ({ payload: { ...t, id: nanoid() } }) },
    dropToast: (s, a: PayloadAction<string>) => void (s.toasts = s.toasts.filter((t) => t.id !== a.payload)),
  },
})

export const { pushToast, dropToast } = slice.actions
export default slice.reducer
