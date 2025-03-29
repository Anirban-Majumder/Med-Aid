import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const url = new URL(request.url, `http://${request.headers.get('host')}`)
  
  let res = NextResponse.next({
    request,
  })

  // initialize supabase client for session check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookie on the request for potential backward usage if needed
            request.cookies.set(name, value)
            // Set cookie on the response for use by the client
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // refreshing the auth token
  await supabase.auth.getUser()

  const { data: { session } } = await supabase.auth.getSession()

  // define routes that require authentication
  const protectedRoutes = ['/Dashboard', '/Profile', '/Medicine', '/Labs', '/SetUp']
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
  
  // If the user is not logged in and is trying to access a protected route, redirect them.
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/SignIn', url))
  }
  
  // update user's auth session and return the response
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}