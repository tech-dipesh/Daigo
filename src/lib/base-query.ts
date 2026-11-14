import { isAxiosError, isCancel } from "axios"
import type { AxiosRequestConfig } from "axios"
import type { BaseQueryFn } from "@reduxjs/toolkit/query"
import { api } from "@/lib/api"
import type { ApiFail, Envelope } from "@/lib/api"
import { handleError } from "@/lib/errors"
import type { ApiError } from "@/lib/errors"

type Args = { url: string; method?: AxiosRequestConfig["method"]; body?: unknown; params?: unknown }

const firstField = (f?: Record<string, string[]>) => (f ? Object.values(f)[0]?.[0] : undefined)
const failOf = (status: number, e: ApiFail | null | undefined, fallback: string): ApiError => ({ status, message: e?.message ?? e?.formErrors?.[0] ?? firstField(e?.fieldErrors) ?? fallback, fieldErrors: e?.fieldErrors })

export const axiosBaseQuery: BaseQueryFn<Args, unknown, ApiError> = async ({ url, method = "get", body, params }, { signal, dispatch }) => {
  const headers = method === "get" ? undefined : { "Idempotency-Key": crypto.randomUUID() }
  try {
    const res = await api.request<Envelope<unknown>>({ url, method, data: body, params, signal, headers })
    if (res.data.success) return { data: res.data.data }
    return { error: failOf(res.status, res.data.error, "unknown") }
  } catch (err) {
    const fail: ApiError = isCancel(err) ? { status: 0, message: "cancelled", cancelled: true } : isAxiosError<Envelope<null>>(err) ? { ...failOf(err.response?.status ?? 0, err.response?.data?.error, err.message), timeout: err.code === "ECONNABORTED" } : { status: 0, message: "unknown" }
    handleError(fail, dispatch)
    return { error: fail }
  }
}
