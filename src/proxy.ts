import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/infra/auth"

const publicPaths = ["/api/v1/signup", "/api/v1/login", "/api/v1/refresh"]

export async function middleware(request: NextRequest) {
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const accessTokenCookie = request.cookies.get("access_token")?.value

  if (!accessTokenCookie) {
    return NextResponse.json(
      { success: false, data: null, error: { message: "Not authenticated" } },
      { status: 401 },
    )
  }

  const payload = await verifyAccessToken(accessTokenCookie)

  if (!payload) {
    return NextResponse.json(
      { success: false, data: null, error: { message: "Not authenticated" } },
      { status: 401 },
    )
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", payload.userId)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: "/api/v1/:path*",
}
