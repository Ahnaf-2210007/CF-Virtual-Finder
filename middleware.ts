import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    // Refresh session if expired
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.log("[v0] Session error:", error.message)
      // If refresh token is invalid, clear cookies and redirect to login
      if (error.message.includes("Invalid Refresh Token") || error.message.includes("Refresh Token Not Found")) {
        const response = NextResponse.redirect(new URL("/auth/login", request.url))
        // Clear all auth-related cookies
        response.cookies.delete("sb-access-token")
        response.cookies.delete("sb-refresh-token")
        return response
      }
    }

    // Protected routes - redirect to login if not authenticated
    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/auth/login") ||
      request.nextUrl.pathname.startsWith("/auth/sign-up") ||
      request.nextUrl.pathname === "/auth/callback"

    if (!isAuthRoute && !session) {
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.log("[v0] Middleware error:", error)
    // On any auth error, redirect to login
    const redirectUrl = new URL("/auth/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
