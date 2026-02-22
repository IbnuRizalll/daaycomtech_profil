import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { contactSchema } from '@/lib/validation';
import { validateContactEmail } from '@/lib/email-deliverability';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MessageStatus } from '@prisma/client';

async function requireAdmin() {
  const session = (await getServerSession(authOptions as any)) as any;
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body?.id);
    const replyContent = String(body?.replyContent || '').trim();

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    if (replyContent.length < 5) {
      return NextResponse.json({ error: 'Balasan minimal 5 karakter' }, { status: 400 });
    }

    const message = await prisma.message.update({
      where: { id },
      data: {
        replyContent,
        status: MessageStatus.REPLIED,
      },
    });
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const payload = parsed.data;
    const emailValidation = await validateContactEmail(payload.email);
    if (!emailValidation.ok) {
      return NextResponse.json(
        { error: emailValidation.reason || 'Email tidak valid.' },
        { status: 400 },
      );
    }

    const message = await prisma.message.create({
      data: {
        name: payload.name,
        email: emailValidation.normalizedEmail,
        phone: payload.phone,
        subject: payload.subject,
        content: payload.content,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 },
    );
  }
}

