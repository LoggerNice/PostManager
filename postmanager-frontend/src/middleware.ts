import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { url, cookies } = request;
    const token = cookies.get('accessToken')?.value;
    const userRole = cookies.get('userRole')?.value;
    const isAuthPage = url.includes('/auth');
    const isAdminPage = url.includes('/admin');
    const isAnalysisPage = url.includes('/analysis');
    const isMyDepartmentPage = url.includes('/my-department');

    // Если нет токена и не на странице авторизации - редирект на авторизацию
    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Если есть токен и на странице авторизации - редирект на главную
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Проверка доступа к админ панели - для администраторов и начальников отделов
    if (isAdminPage && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Проверка доступа к странице анализа - для администраторов и начальников отделов
    if (isAnalysisPage && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Проверка доступа к странице "Мой отдел" - для администраторов и начальников отделов
    if (isMyDepartmentPage && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
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