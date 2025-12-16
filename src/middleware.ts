import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    if (path.startsWith('/admin') && token?.role !== Role.ADMIN) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/doctor') && token?.role !== Role.DENTIST) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/lab') && token?.role !== Role.LAB) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - / (home page - public)
     * - /auth (authentication pages)
     * - /api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!^/$|auth|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
