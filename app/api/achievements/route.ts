import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    if (!session?.user) {
        return null;
    }
    return session;
}

const parsePositiveInt = (value: string | null, fallback: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.trunc(parsed));
};

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

const revalidateAchievementPages = (achievementId?: string) => {
    revalidatePath('/');
    revalidatePath('/about');
    if (achievementId) revalidatePath(`/achievements/${achievementId}`);
};

export async function GET(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const hasPagination = searchParams.has('page') || searchParams.has('limit');
        const page = parsePositiveInt(searchParams.get('page'), 1);
        const limit = Math.min(100, parsePositiveInt(searchParams.get('limit'), 12));

        const orderBy: Prisma.AchievementOrderByWithRelationInput[] = [
            { order: 'asc' },
            { createdAt: 'desc' },
        ];

        if (hasPagination) {
            const [achievements, total] = await Promise.all([
                prisma.achievement.findMany({
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.achievement.count(),
            ]);

            return NextResponse.json({
                data: achievements,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
            });
        }

        const achievements = await prisma.achievement.findMany({
            orderBy,
        });
        return NextResponse.json(achievements);
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        const achievement = await prisma.achievement.create({
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

        revalidateAchievementPages(achievement.id);
        return NextResponse.json(achievement, { status: 201 });
    } catch (error) {
        console.error('Error creating achievement:', error);
        return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
    }
}
