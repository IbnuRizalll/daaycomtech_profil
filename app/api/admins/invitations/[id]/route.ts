import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit-log';

async function requireSuperAdmin() {
  const session = (await getServerSession(authOptions as any)) as any;
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== 'SUPERADMIN') {
    return null;
  }
  return session;
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } },
) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const inviteId = String(context?.params?.id || '').trim();
  if (!inviteId) {
    return NextResponse.json({ error: 'Invitation id tidak valid' }, { status: 400 });
  }

  try {
    const invite = await prisma.adminInvite.findUnique({
      where: { id: inviteId },
      select: { id: true, email: true, username: true, usedAt: true },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Undangan sudah digunakan' }, { status: 400 });
    }

    await prisma.adminInvite.delete({ where: { id: inviteId } });

    const sessionUser = session?.user as any;
    await writeAuditLog({
      action: 'ADMIN_INVITE_REVOKED',
      entity: 'AdminInvite',
      entityId: invite.id,
      actorId: String(sessionUser?.id || ''),
      actorEmail: String(sessionUser?.email || ''),
      actorRole: String(sessionUser?.role || ''),
      metadata: {
        email: invite.email,
        username: invite.username,
      },
    });

    return NextResponse.json({ message: 'Undangan berhasil dibatalkan' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json({ error: 'Gagal membatalkan undangan' }, { status: 500 });
  }
}
