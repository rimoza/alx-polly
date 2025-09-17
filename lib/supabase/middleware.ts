import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  if (bypassAuth) {
    console.info('Auth bypass enabled - skipping Supabase middleware')
    return supabaseResponse
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return early if Supabase is not configured
    console.warn(
      'Supabase environment variables not configured. Skipping authentication middleware.'
    )
    return supabaseResponse
  }

  let supabase
  try {
    supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return supabaseResponse
  }

  // Get current user - this refreshes the session
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Auth error in middleware:', error.message)
    } else {
      user = data?.user
    }
  } catch (error) {
    console.error('Failed to fetch user in middleware:', error)
    // Continue without user data rather than crashing
  }

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/polls/create']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users from protected routes
  if (
    !user &&
    isProtectedPath &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') || 
     request.nextUrl.pathname.startsWith('/register'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}