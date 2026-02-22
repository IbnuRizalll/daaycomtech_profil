'use client';

import { useEffect, useState } from 'react';
import { useAdminToast } from '@/components/providers/admin-toast-provider';

interface Article {
    id: string;
    title: string;
    category: string;
    excerpt: string;
    content?: string | null;
    contentBlocks?: ContentBlock[] | null;
    imageUrl?: string | null;
    isHighlight: boolean;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

type ContentBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'image'; url: string; caption?: string }
    | { type: 'list'; items: string[] }
    | { type: 'table'; headers: string[]; rows: string[][]; headersText?: string; rowsText?: string };

const emptyForm = {
    title: '',
    category: 'Berita',
    imageUrl: '',
    isHighlight: false,
    publishedAt: '',
};

const categoryOptions = ['Berita', 'Artikel', 'Studi Kasus'];

const toDateInput = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const emptyParagraphBlock: ContentBlock = { type: 'paragraph', text: '' };
const emptyImageBlock: ContentBlock = { type: 'image', url: '', caption: '' };
const emptyListBlock: ContentBlock = { type: 'list', items: [] };
const emptyTableBlock: ContentBlock = { type: 'table', headers: [], rows: [], headersText: '', rowsText: '' };

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

const formatHeadersText = (headers: string[]) => headers.join(' | ');

const formatRowsText = (rows: string[][]) => rows.map((row) => row.join(' | ')).join('\n');

const normalizeContentBlocks = (value: unknown): ContentBlock[] => {
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
                return caption
                    ? { type: 'image', url, caption }
                    : { type: 'image', url };
            }
            if (item?.type === 'list') {
                const items = Array.isArray(item?.items)
                    ? item.items.map((value: any) => String(value || '').trim()).filter(Boolean)
                    : [];
                return items.length ? { type: 'list', items } : null;
            }
            if (item?.type === 'table') {
                const hasHeadersText = typeof item?.headersText === 'string';
                const hasRowsText = typeof item?.rowsText === 'string';
                const headersFromText = hasHeadersText ? parsePipeList(item.headersText) : [];
                const headersFromArray = Array.isArray(item?.headers)
                    ? item.headers.map((value: any) => String(value || '').trim()).filter(Boolean)
                    : typeof item?.headers === 'string'
                        ? parsePipeList(item.headers)
                        : [];
                const headers = hasHeadersText ? headersFromText : headersFromArray;

                const rowsFromText = hasRowsText ? parseTableRows(item.rowsText) : [];
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
                const rows = hasRowsText ? rowsFromText : rowsFromArray;
                return headers.length || rows.length
                    ? {
                        type: 'table',
                        headers,
                        rows,
                        headersText: formatHeadersText(headers),
                        rowsText: formatRowsText(rows),
                    }
                    : null;
            }
            return null;
        })
        .filter(Boolean) as ContentBlock[];
};

export default function ArticlesPage() {
    const toast = useAdminToast();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [blockUploadingIndex, setBlockUploadingIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const response = await fetch('/api/articles');
            const data = await response.json();
            if (response.ok) {
                setArticles(data);
            }
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (article?: Article) => {
        if (article) {
            setEditingId(article.id);
            setFormData({
                title: article.title,
                category: article.category,
                imageUrl: article.imageUrl || '',
                isHighlight: article.isHighlight,
                publishedAt: toDateInput(article.publishedAt || article.createdAt),
            });
            setContentBlocks(normalizeContentBlocks(article.contentBlocks));
        } else {
            setEditingId(null);
            setFormData({ ...emptyForm });
            setContentBlocks([]);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ ...emptyForm });
        setContentBlocks([]);
        setBlockUploadingIndex(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData((prev) => ({ ...prev, imageUrl: data.url }));
            } else {
                alert('Gagal upload gambar');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Gagal upload gambar');
        } finally {
            setUploading(false);
        }
    };

    const handleBlockChange = (index: number, patch: Partial<ContentBlock>) => {
        setContentBlocks((prev) =>
            prev.map((block, i) => (i === index ? { ...block, ...patch } as ContentBlock : block))
        );
    };

    const handleAddBlock = (type: ContentBlock['type']) => {
        setContentBlocks((prev) => [
            ...prev,
            type === 'image'
                ? { ...emptyImageBlock }
                : type === 'list'
                    ? { ...emptyListBlock }
                    : type === 'table'
                        ? { ...emptyTableBlock }
                        : { ...emptyParagraphBlock },
        ]);
    };

    const handleRemoveBlock = (index: number) => {
        setContentBlocks((prev) => prev.filter((_, i) => i !== index));
    };

    const moveBlock = (from: number, to: number) => {
        setContentBlocks((prev) => {
            if (to < 0 || to >= prev.length) return prev;
            const updated = [...prev];
            const [item] = updated.splice(from, 1);
            updated.splice(to, 0, item);
            return updated;
        });
    };

    const handleBlockImageUpload = async (index: number, file?: File | null) => {
        if (!file) return;
        setBlockUploadingIndex(index);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                handleBlockChange(index, { url: data.url, type: 'image' });
            } else {
                alert('Gagal upload gambar blok');
            }
        } catch (error) {
            console.error('Error uploading block image:', error);
            alert('Gagal upload gambar blok');
        } finally {
            setBlockUploadingIndex(null);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.category) {
            alert('Judul dan kategori wajib diisi');
            return;
        }

        try {
            const url = editingId ? `/api/articles/${editingId}` : '/api/articles';
            const method = editingId ? 'PATCH' : 'POST';

        const cleanedBlocks = normalizeContentBlocks(contentBlocks).map((block) =>
            block.type === 'table' ? { type: 'table', headers: block.headers, rows: block.rows } : block
        );

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    publishedAt: formData.publishedAt || null,
                    contentBlocks: cleanedBlocks,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data?.error || 'Gagal menyimpan artikel');
                return;
            }

            if (editingId) {
                setArticles((prev) => prev.map((item) => (item.id === editingId ? data : item)));
                toast.success('Artikel berhasil diperbarui.');
            } else {
                setArticles((prev) => [data, ...prev]);
                toast.success('Artikel berhasil ditambahkan.');
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving article:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus artikel ini?')) return;

        try {
            const response = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setArticles((prev) => prev.filter((item) => item.id !== id));
                toast.success('Artikel berhasil dihapus.');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
        }
    };

    if (loading) {
        return <div className="p-4 sm:p-6">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Berita & Artikel</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full sm:w-auto"
                >
                    Tambah Artikel
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[880px]">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Gambar</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Judul</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Kategori</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Tanggal</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Highlight</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map((article) => (
                            <tr key={article.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 sm:px-6 py-4">
                                    {article.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={article.imageUrl}
                                            alt={article.title}
                                            className="h-12 w-16 object-contain rounded bg-gray-50"
                                        />
                                    ) : (
                                        <div className="h-12 w-16 rounded bg-gray-100" />
                                    )}
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="font-medium text-gray-900">{article.title}</div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{article.excerpt}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm">{article.category}</td>
                                <td className="px-4 sm:px-6 py-4 text-sm">{formatDate(article.publishedAt || article.createdAt)}</td>
                                <td className="px-4 sm:px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-sm ${article.isHighlight ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {article.isHighlight ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(article)}
                                            className="px-3 py-1.5 text-sm rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="px-3 py-1.5 text-sm rounded border border-red-200 text-red-700 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                    Belum ada artikel.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto mx-4">
                        <h2 className="text-xl font-bold mb-4">
                            {editingId ? 'Edit Artikel' : 'Tambah Artikel'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Gambar</label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="flex-1 border rounded p-2"
                                    />
                                    {uploading && <span className="text-sm text-blue-600">Uploading...</span>}
                                </div>
                                {formData.imageUrl && (
                                    <div className="mt-3">
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="h-48 w-full object-contain rounded bg-gray-50"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Kategori *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {categoryOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tanggal Publikasi</label>
                                <input
                                    type="date"
                                    value={formData.publishedAt}
                                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    type="checkbox"
                                    id="highlight"
                                    checked={formData.isHighlight}
                                    onChange={(e) => setFormData({ ...formData, isHighlight: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="highlight" className="text-sm font-medium">Tampilkan di Highlight</label>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="block text-sm font-medium">
                                        Konten Blok (Opsional)
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleAddBlock('paragraph')}
                                            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                        >
                                            + Paragraf
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddBlock('image')}
                                            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                        >
                                            + Gambar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddBlock('list')}
                                            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                        >
                                            + List
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddBlock('table')}
                                            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                        >
                                            + Tabel
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 mb-3">
                                    Susun konten seperti artikel: paragraf, gambar, paragraf, dst.
                                </p>

                                {contentBlocks.length === 0 && (
                                    <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                                        Belum ada blok konten.
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {contentBlocks.map((block, index) => (
                                        <div key={index} className="rounded-lg border border-gray-200 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    {block.type === 'image'
                                                        ? 'Gambar'
                                                        : block.type === 'list'
                                                            ? 'List'
                                                            : block.type === 'table'
                                                                ? 'Tabel'
                                                                : 'Paragraf'}{' '}
                                                    #{index + 1}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(index, index - 1)}
                                                        disabled={index === 0}
                                                        className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                                                    >
                                                        Naik
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(index, index + 1)}
                                                        disabled={index === contentBlocks.length - 1}
                                                        className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                                                    >
                                                        Turun
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBlock(index)}
                                                        className="text-xs text-red-600 hover:text-red-800"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>

                                            {block.type === 'paragraph' && (
                                                <textarea
                                                    value={block.text}
                                                    onChange={(e) => handleBlockChange(index, { text: e.target.value })}
                                                    className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={3}
                                                    placeholder="Tulis paragraf..."
                                                />
                                            )}

                                            {block.type === 'image' && (
                                                <div className="space-y-3">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleBlockImageUpload(index, e.target.files?.[0])}
                                                        className="w-full border rounded p-2 text-sm"
                                                    />
                                                    {blockUploadingIndex === index && (
                                                        <p className="text-xs text-blue-600">Uploading...</p>
                                                    )}
                                                    {block.url && (
                                                        <img
                                                            src={block.url}
                                                            alt="Preview"
                                                            className="h-40 w-full object-contain rounded bg-gray-50"
                                                        />
                                                    )}
                                                    <input
                                                        type="text"
                                                        value={block.caption || ''}
                                                        onChange={(e) => handleBlockChange(index, { caption: e.target.value })}
                                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Caption (opsional)"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'list' && (
                                                <textarea
                                                    value={(block.items || []).join('\n')}
                                                    onChange={(e) =>
                                                        handleBlockChange(index, {
                                                            items: e.target.value
                                                                .split('\n')
                                                                .map((item) => item.trim())
                                                                .filter(Boolean),
                                                        })
                                                    }
                                                    className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={4}
                                                    placeholder="Satu item per baris"
                                                />
                                            )}

                                            {block.type === 'table' && (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value={block.headersText ?? (block.headers || []).join(' | ')}
                                                        onChange={(e) =>
                                                            handleBlockChange(index, {
                                                                headersText: e.target.value,
                                                            })
                                                        }
                                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Header kolom (pisahkan dengan | )"
                                                    />
                                                    <textarea
                                                        value={
                                                            block.rowsText ??
                                                            (block.rows || [])
                                                                .map((row) => row.join(' | '))
                                                                .join('\n')
                                                        }
                                                        onChange={(e) =>
                                                            handleBlockChange(index, {
                                                                rowsText: e.target.value,
                                                            })
                                                        }
                                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        rows={4}
                                                        placeholder="Baris tabel (pisahkan kolom dengan | )"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Simpan
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
