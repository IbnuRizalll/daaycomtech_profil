import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    if (!session?.user) {
        return null;
    }
    return session;
}

const normalizeContentBlocks = (value: unknown) => {
    if (!value) return [];
    const source = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? (() => {
                try {
                    return JSON.parse(value);
                } catch {
                    return [];
                }
            })()
            : [];

    if (!Array.isArray(source)) return [];

    return source
        .map((item) => {
            if (item?.type === 'paragraph') {
                const text = String(item?.text || '').trim();
                return text ? { type: 'paragraph', text } : null;
            }
            if (item?.type === 'image') {
                const url = String(item?.url || '').trim();
                if (!url) return null;
                const caption = String(item?.caption || '').trim();
                return caption ? { type: 'image', url, caption } : { type: 'image', url };
            }
            if (item?.type === 'list') {
                const items = Array.isArray(item?.items)
                    ? item.items.map((value: any) => String(value || '').trim()).filter(Boolean)
                    : [];
                return items.length ? { type: 'list', items } : null;
            }
            if (item?.type === 'table') {
                const headers = Array.isArray(item?.headers)
                    ? item.headers.map((value: any) => String(value || '').trim()).filter(Boolean)
                    : [];
                const rows = Array.isArray(item?.rows)
                    ? item.rows
                        .map((row: any) =>
                            Array.isArray(row)
                                ? row.map((cell: any) => String(cell || '').trim())
                                : []
                        )
                        .filter((row: string[]) => row.some((cell) => cell.trim()))
                    : [];
                return headers.length || rows.length ? { type: 'table', headers, rows } : null;
            }
            return null;
        })
        .filter(Boolean);
};

const buildSummary = (blocks: any[], fallback?: string) => {
    const firstParagraph = blocks.find((item) => item?.type === 'paragraph' && item.text);
    const firstList = blocks.find((item) => item?.type === 'list' && Array.isArray(item.items) && item.items.length);
    const raw = String(
        firstParagraph?.text ||
        firstList?.items?.[0] ||
        fallback ||
        ''
    ).trim();
    if (!raw) return '';
    return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
};

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievementId = String(context?.params?.id || '').trim();
    if (!achievementId) {
        return NextResponse.json({ error: 'Achievement id tidak valid' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const title = String(body?.title || '').trim();
        const year = String(body?.year || '').trim();
        const description = String(body?.description || '').trim();
        const imageUrl = String(body?.imageUrl || '').trim();
        const isHighlight = Boolean(body?.isHighlight);
        const order = Number.isFinite(Number(body?.order)) ? Number(body?.order) : 0;
        const contentBlocks = normalizeContentBlocks(body?.contentBlocks);
        const summary = buildSummary(contentBlocks, description);

        if (!title || !year) {
            return NextResponse.json({ error: 'Judul dan tahun wajib diisi' }, { status: 400 });
        }

        const achievement = await prisma.achievement.update({
            where: { id: achievementId },
            data: {
                title,
                year,
                description: contentBlocks.length ? summary : (description || summary),
                contentBlocks: contentBlocks.length ? contentBlocks : Prisma.DbNull,
                imageUrl: imageUrl || null,
                isHighlight,
                order,
            },
        });

        return NextResponse.json(achievement);
    } catch (error) {
        console.error('Error updating achievement:', error);
        return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievementId = String(context?.params?.id || '').trim();
    if (!achievementId) {
        return NextResponse.json({ error: 'Achievement id tidak valid' }, { status: 400 });
    }

    try {
        await prisma.achievement.delete({ where: { id: achievementId } });
        return NextResponse.json({ message: 'Achievement berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting achievement:', error);
        return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
    }
}
