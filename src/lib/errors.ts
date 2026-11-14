import { pushToast } from "@/store/ui"

export type ApiError = { status: number; message: string; code?: string; fields?: Record<string, string[]>; timeout?: boolean; cancelled?: boolean }
type Dispatch = (a: ReturnType<typeof pushToast>) => unknown

export function handleError(err: ApiError, dispatch: Dispatch) {
  if (err.cancelled) return
  if (err.timeout) return void dispatch(pushToast({ key: "errors.timeout", kind: "error" }))
  if (err.status === 0) return void dispatch(pushToast({ key: "errors.network", kind: "error" }))
  if (err.status === 429) return void dispatch(pushToast({ key: "errors.slowDown", kind: "error" }))
  if (err.status === 401) return void window.location.replace("/login")
  // This is for the suspend code name on the guess form
  if (err.status === 403 && err.code === "SUSPENDED") return void window.location.replace("/me/standing")
  if (err.status >= 500) dispatch(pushToast({ key: "errors.unknown", kind: "error" }))
}
