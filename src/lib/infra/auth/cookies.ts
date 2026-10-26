import { NextResponse } from "next/server"

const accessTokenMaxAge = 60 * 15
const refreshTokenMaxAge = 60 * 60 * 24 * 30

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: accessTokenMaxAge,
  })

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: refreshTokenMaxAge,
  })

  return response
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("access_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  response.cookies.set("refresh_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  return response
}
