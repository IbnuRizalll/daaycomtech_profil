import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { MessageStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
  const session = (await getServerSession(authOptions as any)) as Session | null;
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
    return null;
  }
  return session;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    const body = await request.json();
    if (body?.status !== MessageStatus.READ) {
      return NextResponse.json({ error: 'Unsupported status update' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.status !== MessageStatus.UNREAD) {
      return NextResponse.json(message);
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { status: MessageStatus.READ },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json({ error: 'Failed to update message status' }, { status: 500 });
  }
}
