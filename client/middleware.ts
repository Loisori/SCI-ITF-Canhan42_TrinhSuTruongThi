import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that require admin authentication
  const isAdminPath = pathname.startsWith('/admin-dashboard') || pathname.startsWith('/(admin)');

  if (isAdminPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = decodeJwt(token) as { role?: string };
      
      if (payload.role?.toLowerCase() !== 'admin') {
        console.log(`[Middleware] Unauthorized admin access, redirecting to /dashboard`);
        const url = new URL('/dashboard', request.url);
        url.searchParams.set('error', 'unauthorized_admin');
        return NextResponse.redirect(url);
      }
    } catch (e) {
      console.log(`[Middleware] Error decoding admin token:`, e);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // General dashboard protection
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin-dashboard/:path*',
  ],
};
