import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('seguros_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/api/auth/login']
  
  console.log(`Middleware: ${pathname}, Token: ${token ? 'EXISTS' : 'NONE'}`)
  
  // Si está en una ruta pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Si tiene token y va a login, redirigir al dashboard
    if (token && pathname === '/login') {
      console.log('Redirect: Login -> Dashboard (tiene token)')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Si no tiene token y no está en ruta pública, redirigir a login
  if (!token) {
    console.log('Redirect: Dashboard -> Login (sin token)')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Permitir acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}