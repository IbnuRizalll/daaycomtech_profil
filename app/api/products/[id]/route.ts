import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextResponse, NextRequest } from 'next/server';
import { productUpdateSchema } from '@/lib/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const normalizeSections = (value: unknown) => {
    if (!value) return [];
    const source = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? safeParse(value)
            : [];

    if (!Array.isArray(source)) return [];

    return source
        .map((section: any) => {
            const title = String(section?.title || '').trim();
            const blocksValue = Array.isArray(section?.blocks)
                ? section.blocks
                : Array.isArray(section?.contentBlocks)
                    ? section.contentBlocks
                    : typeof section?.content === 'string' && section.content.trim()
                        ? [{ type: 'paragraph', text: String(section.content).trim() }]
                        : [];
            const blocks = normalizeBlocks(blocksValue);
            if (!title || blocks.length === 0) return null;
            return { title, blocks };
        })
        .filter(Boolean);
};

const safeParse = (value: string) => {
    try {
        return JSON.parse(value);
    } catch {
        return [];
    }
};

const parsePipeList = (value: string) =>
    value
        .split('|')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

const parseTableRows = (value: string) =>
    value
        .split('\n')
        .map((row) => parsePipeList(row))
        .filter((row) => row.length > 0);

const normalizeBlocks = (value: unknown) => {
    if (!value) return [];
    const source = Array.isArray(value) ? value : typeof value === 'string' ? safeParse(value) : [];
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
                const headersText = typeof item?.headersText === 'string' ? item.headersText : '';
                const rowsText = typeof item?.rowsText === 'string' ? item.rowsText : '';
                const headersFromText = headersText ? parsePipeList(headersText) : [];
                const headersFromArray = Array.isArray(item?.headers)
                    ? item.headers.map((value: any) => String(value || '').trim()).filter(Boolean)
                    : typeof item?.headers === 'string'
                        ? parsePipeList(item.headers)
                        : [];
                const headers = headersFromText.length ? headersFromText : headersFromArray;

                const rowsFromText = rowsText ? parseTableRows(rowsText) : [];
                const rowsFromArray = Array.isArray(item?.rows)
                    ? item.rows
                        .map((row: any) =>
                            Array.isArray(row)
                                ? row.map((cell: any) => String(cell || '').trim())
                                : []
                        )
                        .filter((row: string[]) => row.some((cell) => cell.trim()))
                    : typeof item?.rows === 'string'
                        ? parseTableRows(item.rows)
                        : [];
                const rows = rowsFromText.length ? rowsFromText : rowsFromArray;
                return headers.length || rows.length ? { type: 'table', headers, rows } : null;
            }
            return null;
        })
        .filter(Boolean);
};

const toNumber = (value: unknown, fallback?: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: unknown, fallback = false) =>
    typeof value === 'boolean' ? value : fallback;

const toStringValue = (value: unknown) =>
    typeof value === 'string' ? value.trim() : '';

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
        const parsed = productUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const payload = parsed.data;
        const data: Record<string, any> = {};

        if ('name' in payload) data.name = toStringValue(payload.name);
        if ('slug' in payload) data.slug = toStringValue(payload.slug);
        if ('description' in payload) data.description = toStringValue(payload.description);
        if ('price' in payload) data.price = toNumber(payload.price, 0);
        if ('imageUrl' in payload) data.imageUrl = toStringValue(payload.imageUrl);
        if ('images' in payload) {
            data.images = Array.isArray(payload.images)
                ? JSON.stringify(payload.images)
                : typeof payload.images === 'string'
                    ? payload.images
                    : '[]';
        }
        if ('category' in payload) data.category = toStringValue(payload.category);
        if ('featured' in payload) data.featured = toBoolean(payload.featured);
        if ('inStock' in payload) data.inStock = toBoolean(payload.inStock, true);
        if ('sections' in payload) {
            const cleanedSections = normalizeSections(payload.sections);
            data.sections = cleanedSections.length ? cleanedSections : Prisma.DbNull;
        }

        const product = await prisma.product.update({
            where: { id: params.id },
            data,
        });
        return NextResponse.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.product.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
