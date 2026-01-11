import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control for new multi-tenant structure
    if (path.startsWith('/lab-admin') && token?.role !== Role.LAB_ADMIN) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/lab-collaborator') && token?.role !== Role.LAB_COLLABORATOR) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/clinic-admin') && token?.role !== Role.CLINIC_ADMIN) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/doctor') && token?.role !== Role.DOCTOR) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Redirect doctors without active clinic to clinic selection page
    if (
      token?.role === Role.DOCTOR &&
      !token?.activeClinicId &&
      path.startsWith('/doctor') &&
      path !== '/doctor/select-clinic'
    ) {
      return NextResponse.redirect(new URL('/doctor/select-clinic', req.url));
    }

    // Redirect doctors with active clinic away from clinic selection page
    if (token?.role === Role.DOCTOR && token?.activeClinicId && path === '/doctor/select-clinic') {
      return NextResponse.redirect(new URL('/doctor', req.url));
    }

    if (path.startsWith('/assistant') && token?.role !== Role.CLINIC_ASSISTANT) {
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
