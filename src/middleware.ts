import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('seguros_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  const { pathname } = request.nextUrl

  // Rutas que no requieren intervención del middleware
  const publicRoutes = ['/login', '/api/auth/login', '/']
  
  console.log(`Middleware: ${pathname}, Token: ${token ? 'EXISTS' : 'NONE'}`)
  
  // Si está en una ruta pública, permitir que pase
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    // Excepción: Si tiene token y va específicamente a login, redirigir al dashboard
    if (token && pathname === '/login') {
      console.log('Redirect: Login -> Dashboard (tiene token)')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
  }

  // Para todas las demás rutas protegidas
  if (!token) {
    console.log('Redirect: Protected route -> Login (sin token)')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Permitir acceso a rutas protegidas si tiene token
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