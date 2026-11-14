import { pushToast } from "@/store/ui"

export type ApiError = { status: number; message: string; fieldErrors?: Record<string, string[]>; timeout?: boolean; cancelled?: boolean }
type Dispatch = (a: ReturnType<typeof pushToast>) => unknown

const authPages = ["/login", "/signup", "/forgot-password", "/reset-password"]

export const isApiError = (e: unknown): e is ApiError => typeof e === "object" && e !== null && "status" in e && "message" in e
export const errText = (e: unknown) => (isApiError(e) && !e.cancelled ? e.message : "")

export function handleError(err: ApiError, dispatch: Dispatch) {
  if (err.cancelled) return
  if (err.timeout) return void dispatch(pushToast({ key: "errors.timeout", kind: "error" }))
  if (err.status === 0) return void dispatch(pushToast({ key: "errors.network", kind: "error" }))
  if (err.status === 429) return void dispatch(pushToast({ key: "errors.slowDown", kind: "error" }))
  // This is for the suspend code name on the guess form
  if (err.status === 401 && !authPages.includes(window.location.pathname)) return void window.location.replace("/login")
  if (err.status >= 500) dispatch(pushToast({ key: "errors.unknown", kind: "error" }))
}
