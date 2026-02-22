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

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
    const session = await requireSuperAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = String(context?.params?.id || '').trim();
    if (!adminId) {
        return NextResponse.json({ error: 'Admin id tidak valid' }, { status: 400 });
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: { id: true, role: true },
        });

        if (!admin) {
            return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
        }

        const sessionUserId = (session.user as any)?.id;
        if (sessionUserId && admin.id === sessionUserId) {
            return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
        }

        if (admin.role === 'SUPERADMIN') {
            return NextResponse.json({ error: 'Tidak boleh menghapus SUPERADMIN' }, { status: 403 });
        }

        await prisma.admin.delete({ where: { id: adminId } });

        const sessionUser = session?.user as any;
        await writeAuditLog({
            action: 'ADMIN_DELETED',
            entity: 'Admin',
            entityId: admin.id,
            actorId: String(sessionUser?.id || ''),
            actorEmail: String(sessionUser?.email || ''),
            actorRole: String(sessionUser?.role || ''),
            metadata: {
                deletedAdminId: admin.id,
                deletedAdminRole: admin.role,
            },
        });

        return NextResponse.json({ message: 'Admin berhasil dihapus' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json({ error: 'Gagal menghapus admin' }, { status: 500 });
    }
}
