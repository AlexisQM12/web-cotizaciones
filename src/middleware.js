import { NextResponse } from 'next/server';

export function middleware(req) {
  // Authentication disabled - allow all access
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
