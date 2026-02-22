import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { validateAdminEmail } from '@/lib/email-deliverability';
import { writeAuditLog } from '@/lib/audit-log';

const BCRYPT_ROUNDS = 12;

const normalizeToken = (value: unknown) => String(value || '').trim();

const getInviteByToken = async (token: string) => {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return await prisma.adminInvite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      expiresAt: true,
      usedAt: true,
    },
  });
};

export async function GET(request: NextRequest) {
  const token = normalizeToken(request.nextUrl.searchParams.get('token'));
  if (!token) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 });
  }

  try {
    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Token undangan tidak ditemukan' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Undangan sudah digunakan' }, { status: 400 });
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Undangan sudah kedaluwarsa' }, { status: 400 });
    }

    return NextResponse.json({
      id: invite.id,
      username: invite.username,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Error validating admin invite token:', error);
    return NextResponse.json({ error: 'Gagal memvalidasi token undangan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = normalizeToken(body?.token);
    const password = String(body?.password || '');
    const confirmPassword = String(body?.confirmPassword || '');

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, password, dan konfirmasi password wajib diisi' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Konfirmasi password tidak sama' }, { status: 400 });
    }

    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Token undangan tidak ditemukan' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Undangan sudah digunakan' }, { status: 400 });
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Undangan sudah kedaluwarsa' }, { status: 400 });
    }

    const emailValidation = await validateAdminEmail(invite.email);
    if (!emailValidation.ok) {
      return NextResponse.json(
        { error: emailValidation.reason || 'Email admin tidak valid' },
        { status: 400 },
      );
    }

    const existing = await prisma.admin.findFirst({
      where: {
        OR: [{ email: invite.email }, { username: invite.username }],
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Akun admin sudah ada' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const createdAdmin = await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          username: invite.username,
          email: invite.email,
          password: hashedPassword,
          role: invite.role,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      });

      await tx.adminInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return admin;
    });

    await writeAuditLog({
      action: 'ADMIN_ACTIVATED',
      entity: 'Admin',
      entityId: createdAdmin.id,
      actorId: createdAdmin.id,
      actorEmail: createdAdmin.email,
      actorRole: createdAdmin.role,
      metadata: {
        inviteId: invite.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Aktivasi admin berhasil. Silakan login menggunakan email Anda.',
        admin: createdAdmin,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error activating admin account:', error);
    return NextResponse.json({ error: 'Gagal mengaktifkan akun admin' }, { status: 500 });
  }
}
