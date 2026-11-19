import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export type RealtimeEvent = { id: string; type: string; data: Record<string, unknown>; at: string }

const slice = createSlice({
  name: "realtime",
  initialState: { events: [] as RealtimeEvent[], live: false, fallback: false },
  reducers: {
    received: (s, a: PayloadAction<RealtimeEvent>) => {
      if (!s.events.some((e) => e.id === a.payload.id)) s.events = [a.payload, ...s.events].slice(0, 30)
    },
    consumed: (s, a: PayloadAction<string>) => void (s.events = s.events.filter((e) => e.id !== a.payload)),
    status: (s, a: PayloadAction<{ live: boolean; fallback: boolean }>) => void Object.assign(s, a.payload),
  },
})

export const { received, consumed, status } = slice.actions
export default slice.reducer
