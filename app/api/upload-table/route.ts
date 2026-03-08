import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

type TableSheet = {
    name: string;
    headers: string[];
    rows: string[][];
    meta: {
        totalRows: number;
        totalColumns: number;
        rowsReturned: number;
        columnsReturned: number;
        truncatedRows: boolean;
        truncatedColumns: boolean;
    };
};

const MAX_COLUMNS = 50;
const MAX_ROWS = 200;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

const toCellText = (value: unknown) => String(value ?? '').trim();

const ALLOWED_MIME_TYPES = new Set([
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXTENSIONS = new Set(['csv', 'xls', 'xlsx']);

const getExtension = (filename: string) => {
    const parts = filename.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
};

const parseSheet = (name: string, sheet: XLSX.WorkSheet): TableSheet => {
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        blankrows: false,
    }) as unknown[][];

    const rows = rawRows
        .map((row) => (Array.isArray(row) ? row.map(toCellText) : []))
        .filter((row) => row.some((cell) => cell.length > 0));

    if (rows.length === 0) {
        return {
            name,
            headers: [],
            rows: [],
            meta: {
                totalRows: 0,
                totalColumns: 0,
                rowsReturned: 0,
                columnsReturned: 0,
                truncatedRows: false,
                truncatedColumns: false,
            },
        };
    }

    const headerRow = rows[0];
    const bodyRows = rows.slice(1);
    const maxCols = Math.max(
        headerRow.length,
        ...bodyRows.map((row) => row.length),
        0
    );

    const limitedCols = Math.min(maxCols, MAX_COLUMNS);
    const headers = Array.from({ length: limitedCols }, (_, index) => headerRow[index] || `Kolom ${index + 1}`);
    const dataRows = bodyRows
        .slice(0, MAX_ROWS)
        .map((row) => Array.from({ length: limitedCols }, (_, index) => row[index] || ''))
        .filter((row) => row.some((cell) => cell.length > 0));

    return {
        name,
        headers,
        rows: dataRows,
        meta: {
            totalRows: bodyRows.length,
            totalColumns: maxCols,
            rowsReturned: dataRows.length,
            columnsReturned: limitedCols,
            truncatedRows: bodyRows.length > MAX_ROWS,
            truncatedColumns: maxCols > MAX_COLUMNS,
        },
    };
};

export async function POST(request: NextRequest) {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
        }

        const extension = getExtension(file.name);
        const mimeType = String(file.type || '').toLowerCase();
        const isAllowedType = ALLOWED_MIME_TYPES.has(mimeType) || ALLOWED_EXTENSIONS.has(extension);
        if (!isAllowedType) {
            return NextResponse.json(
                { error: 'Format file tidak didukung. Gunakan CSV/XLS/XLSX.' },
                { status: 400 }
            );
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: 'Ukuran file terlalu besar. Maksimal 2 MB.' },
                { status: 413 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, {
            type: 'buffer',
            cellFormula: false,
            cellHTML: false,
            cellStyles: false,
            cellNF: false,
        });

        const sheets = workbook.SheetNames.map((name) =>
            parseSheet(name, workbook.Sheets[name])
        );

        return NextResponse.json({
            sheets,
            limits: { maxRows: MAX_ROWS, maxColumns: MAX_COLUMNS },
        });
    } catch (error) {
        console.error('Error importing table:', error);
        return NextResponse.json({ error: 'Gagal membaca file tabel' }, { status: 500 });
    }
}
