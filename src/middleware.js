import { NextResponse } from 'next/server';

export function middleware(req) {
  // Authentication disabled - allow all access
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)'],
};
