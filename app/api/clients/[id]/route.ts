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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

        const client = await prisma.client.update({
            where: { id: params.id },
            data: { name, logoUrl, isShow },
        });
        return NextResponse.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.client.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
