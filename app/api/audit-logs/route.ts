import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limitRaw = Number(request.nextUrl.searchParams.get('limit') || 100);
    const limit = Math.min(Math.max(limitRaw, 1), 200);
    const action = String(request.nextUrl.searchParams.get('action') || '').trim();
    const entity = String(request.nextUrl.searchParams.get('entity') || '').trim();

    const where: { action?: string; entity?: string } = {};
    if (action) {
      where.action = action;
    }
    if (entity) {
      where.entity = entity;
    }

    const logs = await prisma.auditLog.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        actorId: true,
        actorEmail: true,
        actorRole: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
