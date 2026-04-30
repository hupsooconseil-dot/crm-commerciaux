import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/app/lib/auth'

const publicPaths = ['/login', '/api/auth/login', '/api/seed']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.userId)
    requestHeaders.set('x-user-role', session.role)
    requestHeaders.set('x-commercial-id', session.commercialId || '')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin')) {
    const isAdminOrManager = session.role === 'ADMIN' || session.role === 'MANAGER'
    const isChefRole = session.role === 'CHEF_RESEAU' || session.role === 'CHEF_EQUIPE'
    if (!isAdminOrManager && !(isChefRole && pathname.startsWith('/admin/equipes'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
