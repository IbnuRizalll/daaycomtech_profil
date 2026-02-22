import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { processImageUpload } from '@/lib/security';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type UploadDriver = 'local' | 'blob';

async function requireAdmin() {
    const session = (await getServerSession(authOptions as any)) as any;
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
        return null;
    }
    return session;
}

const resolveUploadDriver = (): UploadDriver => {
    const configured = String(process.env.UPLOAD_DRIVER || '').trim().toLowerCase();
    if (configured === 'local' || configured === 'blob') {
        return configured;
    }
    return process.env.VERCEL ? 'blob' : 'local';
};

const storeInLocalPublic = async (filename: string, outputBuffer: Buffer) => {
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, outputBuffer);
    return `/uploads/${filename}`;
};

const storeInVercelBlob = async (filename: string, outputBuffer: Buffer, mime: string) => {
    const token = String(process.env.BLOB_READ_WRITE_TOKEN || '').trim();
    if (!token) {
        throw new Error('Upload driver blob aktif, tetapi BLOB_READ_WRITE_TOKEN belum diset.');
    }

    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${filename}`, outputBuffer, {
        access: 'public',
        contentType: mime,
        addRandomSuffix: false,
        token,
    });

    return blob.url;
};

export async function POST(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const { buffer: outputBuffer, filename, optimized, mime } = await processImageUpload(file);
        const uploadDriver = resolveUploadDriver();
        const fileUrl =
            uploadDriver === 'blob'
                ? await storeInVercelBlob(filename, outputBuffer, mime)
                : await storeInLocalPublic(filename, outputBuffer);

        return NextResponse.json({
            url: fileUrl,
            filename,
            optimized,
            driver: uploadDriver,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        const message =
            error instanceof Error && error.message
                ? error.message
                : 'Failed to upload file';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
