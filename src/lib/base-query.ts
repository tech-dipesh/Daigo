import { isAxiosError, isCancel } from "axios"
import type { AxiosRequestConfig } from "axios"
import type { BaseQueryFn } from "@reduxjs/toolkit/query"
import { api } from "@/lib/api"
import type { Envelope } from "@/lib/api"
import { handleError } from "@/lib/errors"
import type { ApiError } from "@/lib/errors"

type Args = { url: string; method?: AxiosRequestConfig["method"]; body?: unknown; params?: unknown }

export const axiosBaseQuery: BaseQueryFn<Args, unknown, ApiError> = async ({ url, method = "get", body, params }, { signal, dispatch }) => {
  const headers = method === "get" ? undefined : { "Idempotency-Key": crypto.randomUUID() }
  try {
    const res = await api.request<Envelope<unknown>>({ url, method, data: body, params, signal, headers })
    if (res.data.success) return { data: res.data.data }
    return { error: { status: res.status, ...res.data.error } }
  } catch (err) {
    const fail: ApiError = isCancel(err) ? { status: 0, message: "cancelled", cancelled: true } : isAxiosError<Envelope<null>>(err) ? { status: err.response?.status ?? 0, message: err.response?.data?.error?.message ?? err.message, code: err.response?.data?.error?.code, fields: err.response?.data?.error?.fields, timeout: err.code === "ECONNABORTED" } : { status: 0, message: "unknown" }
    handleError(fail, dispatch)
    return { error: fail }
  }
}
