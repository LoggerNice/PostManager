import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { url, cookies } = request;
    const token = cookies.get('accessToken')?.value;
    const isAuthPage = url.includes('/auth');

    // Если нет токена и не на странице авторизации - редирект на авторизацию
    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Если есть токен и на странице авторизации - редирект на главную
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}; 