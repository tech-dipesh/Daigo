import axios from "axios"
import { API } from "@/lib/env"

export type ApiFail = { message: string; code?: string; fields?: Record<string, string[]> }
export type Envelope<T> = { success: true; data: T; error: null } | { success: false; data: null; error: ApiFail }
export const api = axios.create({ baseURL: API, withCredentials: true, timeout: 15000 })
