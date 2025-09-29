import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('seguros_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  const { pathname } = request.nextUrl
  const publicRoutes = ['/login', '/api/auth/login', '/']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}