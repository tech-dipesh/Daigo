import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken, rotateRefreshToken } from "@/lib/infra/auth"
import { setAuthCookies } from "@/lib/infra/cookies"
import { rateLimit } from "@/lib/infra/rate-limit"

const publicPaths = ["/api/v1/signup", "/api/v1/login", "/api/v1/refresh"]

function unauthenticated() {
  return NextResponse.json(
    { success: false, data: null, error: { message: "Not authenticated" } },
    { status: 401 },
  )
}

export async function proxy(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const { success: withinLimit } = await rateLimit.limit(clientIp)

  if (!withinLimit) {
    return NextResponse.json(
      { success: false, data: null, error: { message: "Too many requests. Please slow down." } },
      { status: 429 },
    )
  }

  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const accessTokenCookie = request.cookies.get("access_token")?.value
  const accessPayload = accessTokenCookie ? await verifyAccessToken(accessTokenCookie) : null

  if (accessPayload) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", accessPayload.userId)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

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
  matcher: "/api/v1/:path*",
}
