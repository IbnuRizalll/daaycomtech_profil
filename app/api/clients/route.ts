import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const name = String(body?.name || '').trim();
        const logoUrl = String(body?.logoUrl || '').trim();
        const isShow = typeof body?.isShow === 'boolean' ? body.isShow : true;

        if (!name || !logoUrl) {
            return NextResponse.json({ error: 'Nama dan logo wajib diisi' }, { status: 400 });
        }

        const client = await prisma.client.create({
            data: { name, logoUrl, isShow },
        });
        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}
