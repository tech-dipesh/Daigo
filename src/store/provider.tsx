"use client"
import { useState } from "react"
import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { makeStore } from "@/store"

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore)
  return <Provider store={store}>{children}</Provider>
}
