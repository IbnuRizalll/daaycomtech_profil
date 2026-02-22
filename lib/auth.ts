import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { validateAdminEmail } from '@/lib/email-deliverability';
import { writeAuditLog } from '@/lib/audit-log';

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttemptMap = new Map<string, { count: number; resetAt: number }>();

const bumpRate = (key: string) => {
    const now = Date.now();
    const entry = loginAttemptMap.get(key);
    if (!entry || entry.resetAt <= now) {
        const next = { count: 1, resetAt: now + LOGIN_WINDOW_MS };
        loginAttemptMap.set(key, next);
        return next.count;
    }
    entry.count += 1;
    loginAttemptMap.set(key, entry);
    return entry.count;
};

const isRateLimited = (key: string) => bumpRate(key) > LOGIN_MAX_ATTEMPTS;

const clearRateLimit = (key: string) => {
    loginAttemptMap.delete(key);
};

const getHeaderValue = (req: any, name: string) => {
    if (!req) return undefined;
    const headers = req.headers;
    if (!headers) return undefined;
    if (typeof headers.get === 'function') {
        return headers.get(name);
    }
    return headers[name];
};

const getClientIp = (req: any) => {
    const forwarded = getHeaderValue(req, 'x-forwarded-for');
    const ip =
        forwarded?.split(',')[0]?.trim() ||
        getHeaderValue(req, 'x-real-ip') ||
        getHeaderValue(req, 'cf-connecting-ip') ||
        'unknown';
    return ip;
};

// Dummy hash to equalize timing when user not found (prevents account enumeration by timing).
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZo5i.ej7ZL6pmjQe7YQDdyCjTiMQuuLHcE3C';

export const authOptions: any = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any, req: any) {
                const emailInput = String(credentials?.email || '').trim();
                const password = String(credentials?.password || '');
                const ip = getClientIp(req);
                const ipKey = `ip:${ip}`;

                if (isRateLimited(ipKey)) {
                    return null;
                }

                const parsed = loginSchema.safeParse({ email: emailInput, password });
                if (!parsed.success) {
                    return null;
                }

                const data = parsed.data;
                const emailValidation = await validateAdminEmail(data.email);
                if (!emailValidation.ok) {
                    return null;
                }
                const normalizedEmail = emailValidation.normalizedEmail;

                const pairKey = `pair:${ip}:${normalizedEmail.toLowerCase()}`;
                if (isRateLimited(pairKey)) {
                    return null;
                }
                const user = await prisma.admin.findFirst({
                    where: {
                        email: normalizedEmail,
                    },
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        password: true,
                        role: true,
                    }
                });

                const isValid = await bcrypt.compare(data.password, user?.password || DUMMY_HASH);
                if (!user || !isValid) {
                    return null;
                }

                clearRateLimit(ipKey);
                clearRateLimit(pairKey);

                await writeAuditLog({
                    action: 'ADMIN_LOGIN_SUCCESS',
                    entity: 'Admin',
                    entityId: user.id,
                    actorId: user.id,
                    actorEmail: user.email,
                    actorRole: user.role,
                    metadata: { ip },
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.username,
                    role: user.role,
                };
            }
        })
    ],
    pages: {
        signIn: '/auth/login'
    },
    secret: process.env.NEXTAUTH_SECRET,
    useSecureCookies: process.env.NODE_ENV === 'production',
    session: {
        strategy: 'jwt' as const,
        maxAge: 60 * 60 * 8,
        updateAge: 60 * 15,
    },
    jwt: {
        maxAge: 60 * 60 * 8,
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session?.user) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.role = token.role;
            }
            return session;
        }
    }
};
