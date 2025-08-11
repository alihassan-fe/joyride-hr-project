import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Protect all dashboard routes
    if (pathname.startsWith("/dashboard") || 
        pathname.startsWith("/applicants") || 
        pathname.startsWith("/employees") || 
        pathname.startsWith("/calendar") || 
        pathname.startsWith("/admin")) {
      
      // If no token (not authenticated), redirect to login
      if (!token) {
        const url = new URL("/login", req.url)
        url.searchParams.set("callbackUrl", req.url)
        return NextResponse.redirect(url)
      }

      // Additional check for admin routes
      if (pathname.startsWith("/admin")) {
        const userRole = token.role as string
        if (userRole !== "Admin") {
          // Redirect non-admin users away from admin routes
          return NextResponse.redirect(new URL("/dashboard", req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages and home page
        if (pathname.startsWith("/login") || 
            pathname.startsWith("/api/auth") || 
            pathname === "/") {
          return true
        }

        // For all other routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
