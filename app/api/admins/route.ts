import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateAdminEmail } from '@/lib/email-deliverability';
import { randomBytes, createHash } from 'node:crypto';
import { writeAuditLog } from '@/lib/audit-log';

const INVITE_TTL_HOURS = Number(process.env.ADMIN_INVITE_TTL_HOURS || 24);

async function requireSuperAdmin() {
  const session = (await getServerSession(authOptions as any)) as any;
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== 'SUPERADMIN') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admins = await prisma.admin.findMany({
      orderBy: { email: 'asc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const emailInput = String(body.email || '').trim();
    const role = 'ADMIN';
    const sessionUser = session?.user as any;
    const invitedById = String(sessionUser?.id || '').trim() || null;
    const invitedByEmail = String(sessionUser?.email || '').trim() || null;

    if (!username || !emailInput) {
      return NextResponse.json({ error: 'Username dan email wajib diisi' }, { status: 400 });
    }

    const emailValidation = await validateAdminEmail(emailInput);
    if (!emailValidation.ok) {
      return NextResponse.json(
        { error: emailValidation.reason || 'Email admin tidak valid' },
        { status: 400 },
      );
    }
    const email = emailValidation.normalizedEmail;

    const existing = await prisma.admin.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Email atau username sudah digunakan' }, { status: 409 });
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + Math.max(1, INVITE_TTL_HOURS) * 60 * 60 * 1000);

    const invite = await prisma.adminInvite.upsert({
      where: { email },
      update: {
        username,
        role,
        tokenHash,
        expiresAt,
        usedAt: null,
        invitedById,
        invitedByEmail,
      },
      create: {
        username,
        email,
        role,
        tokenHash,
        expiresAt,
        invitedById,
        invitedByEmail,
      },
    });

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const activationUrl = `${origin.replace(/\/$/, '')}/auth/activate?token=${encodeURIComponent(token)}`;

    await writeAuditLog({
      action: 'ADMIN_INVITE_CREATED',
      entity: 'AdminInvite',
      entityId: invite.id,
      actorId: invitedById || undefined,
      actorEmail: invitedByEmail || undefined,
      actorRole: String(sessionUser?.role || ''),
      metadata: {
        email,
        username,
        role,
        expiresAt: invite.expiresAt.toISOString(),
      },
    });

    return NextResponse.json(
      {
        id: invite.id,
        username: invite.username,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        activationUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating admin invite:', error);
    return NextResponse.json({ error: 'Gagal membuat undangan admin' }, { status: 500 });
  }
}
