import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { processImageUpload } from '@/lib/security';
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

        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const { buffer: outputBuffer, filename, optimized } = await processImageUpload(file);

        // Write file to public/uploads
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, outputBuffer);

        // Return the public URL
        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({
            url: fileUrl,
            filename,
            optimized,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
