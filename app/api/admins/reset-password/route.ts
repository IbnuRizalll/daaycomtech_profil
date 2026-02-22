import bcrypt from 'bcrypt';
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

export async function POST(request: NextRequest) {
    const session = await requireSuperAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const adminId = String(body?.adminId || '').trim();
        const password = String(body?.password || '');
        const confirmPassword = String(body?.confirmPassword || '');

        if (!adminId || !password) {
            return NextResponse.json({ error: 'Admin dan password wajib diisi' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
        }

        if (confirmPassword && confirmPassword !== password) {
            return NextResponse.json({ error: 'Konfirmasi password tidak sama' }, { status: 400 });
        }

        const admin = await prisma.admin.findUnique({ where: { id: adminId } });
        if (!admin) {
            return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.admin.update({
            where: { id: adminId },
            data: { password: hashedPassword },
        });

        const sessionUser = session?.user as any;
        await writeAuditLog({
            action: 'ADMIN_PASSWORD_RESET',
            entity: 'Admin',
            entityId: admin.id,
            actorId: String(sessionUser?.id || ''),
            actorEmail: String(sessionUser?.email || ''),
            actorRole: String(sessionUser?.role || ''),
            metadata: {
                resetAdminId: admin.id,
                resetAdminEmail: admin.email,
            },
        });

        return NextResponse.json({ message: 'Password berhasil direset' }, { status: 200 });
    } catch (error) {
        console.error('Error resetting admin password:', error);
        return NextResponse.json({ error: 'Gagal mereset password' }, { status: 500 });
    }
}
