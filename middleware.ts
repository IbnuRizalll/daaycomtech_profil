import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

type RateLimitRule = {
    id: string;
    windowMs: number;
    max: number;
    retryAfterSeconds: number;
    message: string;
    appliesTo: (request: NextRequest, pathname: string) => boolean;
};

const getClientIp = (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || request.ip || 'unknown';
};

const isRateLimited = (key: string, windowMs: number, max: number) => {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetAt <= now) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    entry.count += 1;
    rateLimitMap.set(key, entry);
    return entry.count > max;
};

const rateLimitRules: RateLimitRule[] = [
    {
        id: 'login',
        windowMs: 60_000,
        max: 5,
        retryAfterSeconds: 60,
        message: 'Terlalu banyak percobaan login. Coba lagi nanti.',
        appliesTo: (request, pathname) =>
            request.method === 'POST' &&
            (pathname.startsWith('/api/auth/callback/credentials') ||
                pathname.startsWith('/api/auth/signin/credentials')),
    },
    {
        id: 'contact-message',
        windowMs: 60_000,
        max: 8,
        retryAfterSeconds: 60,
        message: 'Terlalu banyak kiriman pesan. Coba lagi sebentar.',
        appliesTo: (request, pathname) => request.method === 'POST' && pathname === '/api/messages',
    },
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const matchedRateLimitRule = rateLimitRules.find((rule) => rule.appliesTo(request, pathname));
    if (matchedRateLimitRule) {
        const key = `${matchedRateLimitRule.id}:${getClientIp(request)}:${pathname}`;
        if (isRateLimited(key, matchedRateLimitRule.windowMs, matchedRateLimitRule.max)) {
            if (matchedRateLimitRule.id === 'login') {
                const loginUrl = new URL('/auth/login', request.url);
                loginUrl.searchParams.set('error', 'RateLimited');
                return NextResponse.json(
                    { url: loginUrl.toString(), error: matchedRateLimitRule.message },
                    {
                        status: 429,
                        headers: { 'Retry-After': String(matchedRateLimitRule.retryAfterSeconds) },
                    }
                );
            }

            return NextResponse.json(
                { error: matchedRateLimitRule.message },
                {
                    status: 429,
                    headers: { 'Retry-After': String(matchedRateLimitRule.retryAfterSeconds) },
                }
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
    matcher: ['/admin/:path*', '/api/auth/:path*', '/api/messages'],
};
