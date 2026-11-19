import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export type Away = { until: number | null } | null

const slice = createSlice({
  name: "away",
  initialState: { away: null as Away, loaded: false },
  reducers: {
    restore: (s, a: PayloadAction<Away>) => void Object.assign(s, { away: a.payload, loaded: true }),
    goAway: (s, a: PayloadAction<number | null>) => void (s.away = { until: a.payload }),
    comeBack: (s) => void (s.away = null),
  },
})

export const { restore, goAway, comeBack } = slice.actions
export default slice.reducer
