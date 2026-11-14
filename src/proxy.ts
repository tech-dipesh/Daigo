import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAccessToken, rotateRefreshToken } from "@/lib/infra/auth/token"
import { setAuthCookies, clearAuthCookies } from "@/lib/infra/auth/cookies"
import { rateLimit } from "@/lib/infra/clients/rate-limit"

const publicPaths = [
  "/api/v1/signup",
  "/api/v1/login",
  "/api/v1/login/verify",
  "/api/v1/jobs/run",
  "/api/v1/refresh",
  "/api/v1/password-reset/request",
  "/api/v1/password-reset/confirm",
  "/api/v1/email-verification/confirm",
]

const guestPages = ["/login", "/signup", "/forgot-password"]
const openPages = ["/reset-password", "/verify-email/confirm", "/emergency", "/terms", "/tutorial", "/suspended", "/offline"]
const openPrefixes = ["/trips/shared/", "/pay/"]

function unauthenticated() {
  return NextResponse.json(
    { success: false, data: null, error: { message: "Not authenticated" } },
    { status: 401 },
  )
}

// pages never get a 401, they get sent to /login. same silent refresh as the api below
async function pageProxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const access = request.cookies.get("access_token")?.value
  const refresh = request.cookies.get("refresh_token")?.value
  const payload = access ? await verifyAccessToken(access) : null
  const rotated = !payload && refresh ? await rotateRefreshToken(refresh) : null
  const userId = payload?.userId ?? rotated?.userId
  const stale = !userId && Boolean(access || refresh)
  const isGuest = guestPages.includes(pathname)
  const isOpen = isGuest || openPages.includes(pathname) || openPrefixes.some((p) => pathname.startsWith(p))
  const headers = new Headers(request.headers)
  // never trust an x-user-id coming from the browser
  headers.delete("x-user-id")
  if (userId) headers.set("x-user-id", userId)
  const target = !userId && !isOpen ? "/login" : userId && isGuest ? "/" : null
  const response = target ? NextResponse.redirect(new URL(target, request.url)) : NextResponse.next({ request: { headers } })
  if (rotated) setAuthCookies(response, rotated.accessToken, rotated.refreshToken)
  return stale ? clearAuthCookies(response) : response
}

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return pageProxy(request)

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const { success } = await rateLimit.limit(clientIp)

  if (!success) {
    return NextResponse.json(
      { success: false, data: null, error: { message: "Too many requests. Please slow down." } },
      { status: 429 },
    )
  }

  const isPublic = publicPaths.includes(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith("/api/v1/trips/shared/")
  if (isPublic) {
    return NextResponse.next()
  }

  const accessTokenCookie = request.cookies.get("access_token")?.value
  const accessPayload = accessTokenCookie ? await verifyAccessToken(accessTokenCookie) : null

  if (accessPayload) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", accessPayload.userId)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  // when acc tok is missing we make a sildent refresh
  const refreshTokenCookie = request.cookies.get("refresh_token")?.value

  if (!refreshTokenCookie) {
    return unauthenticated()
  }

  const rotated = await rotateRefreshToken(refreshTokenCookie)

  if (!rotated) {
    return unauthenticated()
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", rotated.userId)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  return setAuthCookies(response, rotated.accessToken, rotated.refreshToken)
}

export const config = {
  matcher: "/((?!_next/static|_next/image|.*\\..*).*)",
}
