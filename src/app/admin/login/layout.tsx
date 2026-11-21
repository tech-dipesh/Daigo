import type { ReactNode } from "react"
import { Frame } from "@/components/frame"

export default function Layout({ children }: { children: ReactNode }) {
  return <Frame>{children}</Frame>
}
