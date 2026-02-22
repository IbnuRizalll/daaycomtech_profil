import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const invites = await prisma.adminInvite.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
        invitedByEmail: true,
      },
    });

    const now = Date.now();
    const result = invites.map((invite) => ({
      ...invite,
      status: invite.usedAt ? 'USED' : invite.expiresAt.getTime() < now ? 'EXPIRED' : 'PENDING',
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}
