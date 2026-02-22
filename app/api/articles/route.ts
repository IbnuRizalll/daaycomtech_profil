import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user) {
        return null;
    }
    return session;
}

const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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

export async function GET() {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const articles = await prisma.article.findMany({
            orderBy: [
                { publishedAt: 'desc' },
                { createdAt: 'desc' },
            ],
        });
        return NextResponse.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
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
        const category = String(body?.category || '').trim();
        const excerpt = String(body?.excerpt || '').trim();
        const content = String(body?.content || '').trim();
        const imageUrl = String(body?.imageUrl || '').trim();
        const isHighlight = Boolean(body?.isHighlight);
        const publishedAt = parseDate(body?.publishedAt);
        const contentBlocks = normalizeContentBlocks(body?.contentBlocks);
        const summary = buildSummary(contentBlocks, content);

        if (!title || !category) {
            return NextResponse.json({ error: 'Judul dan kategori wajib diisi' }, { status: 400 });
        }

        const article = await prisma.article.create({
            data: {
                title,
                category,
                excerpt: contentBlocks.length ? summary : (excerpt || summary),
                content: content || null,
                contentBlocks: contentBlocks.length ? contentBlocks : Prisma.DbNull,
                imageUrl: imageUrl || null,
                isHighlight,
                publishedAt,
            },
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }
}
