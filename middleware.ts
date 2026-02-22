import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const getClientIp = (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || request.ip || 'unknown';
};

const isRateLimited = (key: string) => {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetAt <= now) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count += 1;
    rateLimitMap.set(key, entry);
    return entry.count > RATE_LIMIT_MAX;
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        request.method === 'POST' &&
        (pathname.startsWith('/api/auth/callback/credentials') ||
            pathname.startsWith('/api/auth/signin/credentials'))
    ) {
        const key = `${getClientIp(request)}:${pathname}`;
        if (isRateLimited(key)) {
            return NextResponse.json(
                { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }
    }

    if (pathname.startsWith('/admin')) {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        const response = NextResponse.next();
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/auth/:path*'],
};
