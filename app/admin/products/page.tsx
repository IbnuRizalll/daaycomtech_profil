'use client';

import { useEffect, useState } from 'react';
import ImageCarousel from '@/components/image-carousel';
import { useAdminToast } from '@/components/providers/admin-toast-provider';
import { formatPrice } from '@/lib/utils';
import { productSchema } from '@/lib/validation';

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    imageUrl: string;
    images?: string;
    category: string;
    featured: boolean;
    inStock?: boolean;
    sections?: ProductSection[] | null;
    createdAt: string;
    updatedAt: string;
}

type ContentBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'image'; url: string; caption?: string }
    | { type: 'list'; items: string[] }
    | {
          type: 'table';
          headers: string[];
          rows: string[][];
          headersText?: string;
          rowsText?: string;
          sheets?: TableSheet[];
          selectedSheet?: string;
      };

type TableSheet = {
    name: string;
    headers: string[];
    rows: string[][];
    meta?: {
        totalRows: number;
        totalColumns: number;
        rowsReturned: number;
        columnsReturned: number;
        truncatedRows: boolean;
        truncatedColumns: boolean;
    };
};

interface ProductSection {
    title: string;
    blocks: ContentBlock[];
}

const emptySection: ProductSection = { title: '', blocks: [] };
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

const toTableSheet = (raw: any): TableSheet | null => {
    if (!raw) return null;
    const name = String(raw.name || '').trim();
    if (!name) return null;
    const headers = Array.isArray(raw.headers)
        ? raw.headers.map((value: any) => String(value || '').trim())
        : [];
    const rows = Array.isArray(raw.rows)
        ? raw.rows.map((row: any) =>
            Array.isArray(row)
                ? row.map((cell: any) => String(cell || '').trim())
                : []
        )
        : [];
    const meta = raw.meta && typeof raw.meta === 'object'
        ? {
            totalRows: Number(raw.meta.totalRows) || 0,
            totalColumns: Number(raw.meta.totalColumns) || 0,
            rowsReturned: Number(raw.meta.rowsReturned) || rows.length,
            columnsReturned: Number(raw.meta.columnsReturned) || headers.length,
            truncatedRows: Boolean(raw.meta.truncatedRows),
            truncatedColumns: Boolean(raw.meta.truncatedColumns),
        }
        : undefined;
    return { name, headers, rows, meta };
};

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
                return caption ? { type: 'image', url, caption } : { type: 'image', url };
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

const normalizeSections = (value: unknown): ProductSection[] => {
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
            const title = typeof item?.title === 'string' ? item.title : '';
            let blocks: ContentBlock[] = [];

            if (Array.isArray(item?.blocks)) {
                blocks = normalizeContentBlocks(item.blocks);
            } else if (Array.isArray(item?.contentBlocks)) {
                blocks = normalizeContentBlocks(item.contentBlocks);
            } else if (typeof item?.content === 'string' && item.content.trim()) {
                blocks = [{ type: 'paragraph', text: item.content.trim() }];
            }

            if (!title && blocks.length === 0) {
                return null;
            }

            return { title, blocks };
        })
        .filter(Boolean) as ProductSection[];
};

export default function ProductsPage() {
    const toast = useAdminToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [blockUploading, setBlockUploading] = useState<{ section: number; block: number } | null>(null);
    const [tableImporting, setTableImporting] = useState<{ section: number; block: number } | null>(null);
    const [imageList, setImageList] = useState<string[]>([]);
    const [sections, setSections] = useState<ProductSection[]>([]);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        slug: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: '',
        featured: false,
        inStock: true,
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingId(product.id);
            setFormData({
                ...product,
                inStock: product.inStock ?? true,
            });
            const images = product.images ? JSON.parse(product.images) : [product.imageUrl];
            setImageList(images);
            setSections(normalizeSections(product.sections));
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                price: 0,
                imageUrl: '',
                category: '',
                featured: false,
                inStock: true,
            });
            setImageList([]);
            setSections([]);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            price: 0,
            imageUrl: '',
            category: '',
            featured: false,
            inStock: true,
        });
        setImageList([]);
        setSections([]);
        setBlockUploading(null);
        setTableImporting(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataUpload,
                });

                if (response.ok) {
                    const data = await response.json();
                    setImageList((prev) => [...prev, data.url]);
                } else {
                    const payload = await response.json().catch(() => null);
                    const reason = payload?.error ? `: ${payload.error}` : '';
                    alert(`Failed to upload ${file.name}${reason}`);
                }
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImageList((prev) => prev.filter((_, i) => i !== index));
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '-');
    };

    const handleNameChange = (name: string) => {
        if (!editingId) {
            setFormData({ ...formData, name, slug: generateSlug(name) });
        } else {
            setFormData({ ...formData, name });
        }
    };

    const handleSectionTitleChange = (index: number, value: string) => {
        setSections((prev) =>
            prev.map((section, i) => (i === index ? { ...section, title: value } : section))
        );
    };

    const handleAddSection = () => {
        setSections((prev) => [...prev, { ...emptySection }]);
    };

    const handleRemoveSection = (index: number) => {
        setSections((prev) => prev.filter((_, i) => i !== index));
    };

    const moveSection = (from: number, to: number) => {
        setSections((prev) => {
            if (to < 0 || to >= prev.length) return prev;
            const updated = [...prev];
            const [item] = updated.splice(from, 1);
            updated.splice(to, 0, item);
            return updated;
        });
    };

    const handleAddBlock = (sectionIndex: number, type: ContentBlock['type']) => {
        setSections((prev) =>
            prev.map((section, idx) => {
                if (idx !== sectionIndex) return section;
                const nextBlock =
                    type === 'image'
                        ? { ...emptyImageBlock }
                        : type === 'list'
                            ? { ...emptyListBlock }
                            : type === 'table'
                                ? { ...emptyTableBlock }
                                : { ...emptyParagraphBlock };
                return { ...section, blocks: [...section.blocks, nextBlock] };
            })
        );
    };

    const handleBlockChange = (
        sectionIndex: number,
        blockIndex: number,
        patch: Partial<ContentBlock>
    ) => {
        setSections((prev) =>
            prev.map((section, idx) => {
                if (idx !== sectionIndex) return section;
                return {
                    ...section,
                    blocks: section.blocks.map((block, bIndex) =>
                        bIndex === blockIndex ? ({ ...block, ...patch } as ContentBlock) : block
                    ),
                };
            })
        );
    };

    const handleRemoveBlock = (sectionIndex: number, blockIndex: number) => {
        setSections((prev) =>
            prev.map((section, idx) =>
                idx === sectionIndex
                    ? { ...section, blocks: section.blocks.filter((_, bIndex) => bIndex !== blockIndex) }
                    : section
            )
        );
    };

    const moveBlock = (sectionIndex: number, from: number, to: number) => {
        setSections((prev) =>
            prev.map((section, idx) => {
                if (idx !== sectionIndex) return section;
                if (to < 0 || to >= section.blocks.length) return section;
                const updatedBlocks = [...section.blocks];
                const [item] = updatedBlocks.splice(from, 1);
                updatedBlocks.splice(to, 0, item);
                return { ...section, blocks: updatedBlocks };
            })
        );
    };

    const handleBlockImageUpload = async (sectionIndex: number, blockIndex: number, file?: File | null) => {
        if (!file) return;
        setBlockUploading({ section: sectionIndex, block: blockIndex });
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                handleBlockChange(sectionIndex, blockIndex, { url: data.url, type: 'image' });
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading block image:', error);
            alert('Failed to upload image');
        } finally {
            setBlockUploading(null);
        }
    };

    const handleTableImport = async (sectionIndex: number, blockIndex: number, file?: File | null) => {
        if (!file) return;
        setTableImporting({ section: sectionIndex, block: blockIndex });
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload-table', {
                method: 'POST',
                body: formDataUpload,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData?.error || 'Gagal import tabel');
                return;
            }

            const data = await response.json();
            const sheets = Array.isArray(data?.sheets)
                ? data.sheets.map(toTableSheet).filter(Boolean) as TableSheet[]
                : [];

            if (sheets.length === 0) {
                alert('Tidak ada data tabel yang bisa diimport.');
                return;
            }

            const firstSheet = sheets[0];
            if (firstSheet.meta?.truncatedRows || firstSheet.meta?.truncatedColumns) {
                const rowInfo = firstSheet.meta?.rowsReturned ?? firstSheet.rows.length;
                const colInfo = firstSheet.meta?.columnsReturned ?? firstSheet.headers.length;
                alert(`Data dipotong menjadi ${rowInfo} baris x ${colInfo} kolom.`);
            }
            handleBlockChange(sectionIndex, blockIndex, {
                type: 'table',
                headers: firstSheet.headers,
                rows: firstSheet.rows,
                headersText: formatHeadersText(firstSheet.headers),
                rowsText: formatRowsText(firstSheet.rows),
                sheets,
                selectedSheet: firstSheet.name,
            });
        } catch (error) {
            console.error('Error importing table:', error);
            alert('Gagal import tabel');
        } finally {
            setTableImporting(null);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug || !formData.category || imageList.length === 0) {
            alert('Please fill in all required fields and upload at least one image');
            return;
        }

        try {
            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PATCH' : 'POST';

            const cleanedSections = sections
                .map((section) => {
                    const normalizedBlocks = normalizeContentBlocks(section.blocks).map((block) =>
                        block.type === 'table'
                            ? { type: 'table', headers: block.headers, rows: block.rows }
                            : block
                    );
                    return {
                        title: section.title.trim(),
                        blocks: normalizedBlocks,
                    };
                })
                .filter((section) => section.title && section.blocks.length > 0);

            const dataToSave = {
                ...formData,
                imageUrl: imageList[0],
                images: JSON.stringify(imageList),
                sections: cleanedSections.length ? cleanedSections : null,
            };

            const validatePayload = {
                ...dataToSave,
                images: imageList,
            };
            const parsed = productSchema.safeParse(validatePayload);
            if (!parsed.success) {
                const firstError = parsed.error.issues[0]?.message || 'Data produk tidak valid.';
                toast.error(firstError);
                return;
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave),
            });

            if (response.ok) {
                const data = await response.json();
                if (editingId) {
                    setProducts(products.map(p => p.id === editingId ? data : p));
                    toast.success('Produk berhasil diperbarui.');
                } else {
                    setProducts([...products, data]);
                    toast.success('Produk berhasil ditambahkan.');
                }
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setProducts(products.filter(p => p.id !== id));
                toast.success('Produk berhasil dihapus.');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    if (loading) {
        return <div className="p-4 sm:p-6">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Products Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full sm:w-auto"
                >
                    Add Product
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Category</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Harga</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Featured</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={product.imageUrl} alt={product.name} className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded" onError={(e) => e.currentTarget.src = '/images/team/team.png'} />
                                        <span className="text-sm sm:text-base">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm">{product.category}</td>
                                <td className="px-4 sm:px-6 py-4 text-sm">{formatPrice(product.price)}</td>
                                <td className="px-4 sm:px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-sm ${product.featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {product.featured ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => handleOpenModal(product)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4">
                        <h2 className="text-xl font-bold mb-4">
                            {editingId ? 'Edit Product' : 'Add Product'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Product Images</label>
                            {imageList.length > 0 && (
                                <ImageCarousel
                                    images={imageList}
                                    onRemove={handleRemoveImage}
                                    isEditing={true}
                                />
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Upload Images (Multiple allowed)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="flex-1 border rounded p-2"
                                />
                                {uploading && <span className="text-sm text-blue-600">Uploading...</span>}
                            </div>
                            {imageList.length === 0 && (
                                <p className="text-red-500 text-sm mt-1">At least one image is required</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Slug *</label>
                                <input
                                    type="text"
                                    value={formData.slug || ''}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="auto-generated"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category *</label>
                                <input
                                    type="text"
                                    value={formData.category || ''}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Harga</label>
                                <input
                                    type="number"
                                    value={formData.price || 0}
                                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>

                            <div className="col-span-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium mb-1">
                                        Informasi Tambahan (Opsional)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddSection}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        + Tambah Section
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    Gunakan untuk deskripsi tambahan seperti spesifikasi, instalasi, isi paket, dsb.
                                </p>
                                <div className="space-y-3">
                                    {sections.length === 0 && (
                                        <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                                            Belum ada section tambahan.
                                        </div>
                                    )}
                                    {sections.map((section, index) => (
                                        <div key={index} className="rounded-lg border border-gray-200 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Section {index + 1}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveSection(index, index - 1)}
                                                        disabled={index === 0}
                                                        className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                                                    >
                                                        Naik
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveSection(index, index + 1)}
                                                        disabled={index === sections.length - 1}
                                                        className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                                                    >
                                                        Turun
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSection(index)}
                                                        className="text-xs text-red-600 hover:text-red-800"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => handleSectionTitleChange(index, e.target.value)}
                                                placeholder="Judul section (contoh: Spesifikasi)"
                                                className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                            />
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Blok Konten
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddBlock(index, 'paragraph')}
                                                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                                    >
                                                        + Paragraf
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddBlock(index, 'image')}
                                                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                                    >
                                                        + Gambar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddBlock(index, 'list')}
                                                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                                    >
                                                        + List
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddBlock(index, 'table')}
                                                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                                    >
                                                        + Tabel
                                                    </button>
                                                </div>
                                            </div>
                                            {section.blocks.length === 0 && (
                                                <div className="rounded border border-dashed border-gray-300 p-3 text-xs text-gray-500">
                                                    Belum ada blok konten untuk section ini.
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                {section.blocks.map((block, blockIndex) => {
                                                    const isUploading =
                                                        blockUploading?.section === index &&
                                                        blockUploading?.block === blockIndex;

                                                    return (
                                                        <div key={blockIndex} className="rounded-lg border border-gray-200 p-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                                    {block.type === 'image'
                                                                        ? 'Gambar'
                                                                        : block.type === 'list'
                                                                            ? 'List'
                                                                            : block.type === 'table'
                                                                                ? 'Tabel'
                                                                                : 'Paragraf'}{' '}
                                                                    #{blockIndex + 1}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveBlock(index, blockIndex, blockIndex - 1)}
                                                                        disabled={blockIndex === 0}
                                                                        className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                                                                    >
                                                                        Naik
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveBlock(index, blockIndex, blockIndex + 1)}
                                                                        disabled={blockIndex === section.blocks.length - 1}
                                                                        className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                                                                    >
                                                                        Turun
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveBlock(index, blockIndex)}
                                                                        className="text-xs text-red-600 hover:text-red-800"
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {block.type === 'paragraph' && (
                                                                <textarea
                                                                    value={block.text}
                                                                    onChange={(e) => handleBlockChange(index, blockIndex, { text: e.target.value })}
                                                                    className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    rows={3}
                                                                    placeholder="Tulis paragraf..."
                                                                />
                                                            )}

                                                            {block.type === 'image' && (
                                                                <div className="space-y-2">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleBlockImageUpload(index, blockIndex, e.target.files?.[0])}
                                                                        className="w-full border rounded p-2 text-sm"
                                                                    />
                                                                    {isUploading && (
                                                                        <p className="text-xs text-blue-600">Uploading...</p>
                                                                    )}
                                                                    {block.url && (
                                                                        <img
                                                                            src={block.url}
                                                                            alt="Preview"
                                                                            className="h-32 w-full object-contain rounded bg-gray-50"
                                                                        />
                                                                    )}
                                                                    <input
                                                                        type="text"
                                                                        value={block.caption || ''}
                                                                        onChange={(e) => handleBlockChange(index, blockIndex, { caption: e.target.value })}
                                                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="Caption (opsional)"
                                                                    />
                                                                </div>
                                                            )}

                                                            {block.type === 'list' && (
                                                                <textarea
                                                                    value={(block.items || []).join('\n')}
                                                                    onChange={(e) =>
                                                                        handleBlockChange(index, blockIndex, {
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
                                                                            handleBlockChange(index, blockIndex, {
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
                                                                            handleBlockChange(index, blockIndex, {
                                                                                rowsText: e.target.value,
                                                                            })
                                                                        }
                                                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        rows={4}
                                                                        placeholder="Baris tabel (pisahkan kolom dengan | )"
                                                                    />
                                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                                                        <label className="inline-flex items-center gap-2 px-2 py-1 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                                                                            <input
                                                                                type="file"
                                                                                accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                                                                onChange={(e) =>
                                                                                    handleTableImport(
                                                                                        index,
                                                                                        blockIndex,
                                                                                        e.target.files?.[0]
                                                                                    )
                                                                                }
                                                                                className="hidden"
                                                                            />
                                                                            Import CSV/XLSX
                                                                        </label>
                                                                        {tableImporting?.section === index &&
                                                                            tableImporting?.block === blockIndex && (
                                                                                <span className="text-blue-600">Mengimpor...</span>
                                                                            )}
                                                                        {Array.isArray(block.sheets) &&
                                                                            block.sheets.length > 1 && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <span>Sheet</span>
                                                                                    <select
                                                                                        value={
                                                                                            block.selectedSheet ??
                                                                                            block.sheets[0]?.name ??
                                                                                            ''
                                                                                        }
                                                                                        onChange={(e) => {
                                                                                            const name = e.target.value;
                                                                                            const sheet =
                                                                                                block.sheets?.find(
                                                                                                    (item) => item.name === name
                                                                                                ) || null;
                                                                                            if (!sheet) return;
                                                                                            handleBlockChange(
                                                                                                index,
                                                                                                blockIndex,
                                                                                                {
                                                                                                    selectedSheet: name,
                                                                                                    headers: sheet.headers,
                                                                                                    rows: sheet.rows,
                                                                                                    headersText: formatHeadersText(
                                                                                                        sheet.headers
                                                                                                    ),
                                                                                                    rowsText: formatRowsText(
                                                                                                        sheet.rows
                                                                                                    ),
                                                                                                }
                                                                                            );
                                                                                        }}
                                                                                        className="border border-gray-300 rounded px-2 py-1"
                                                                                    >
                                                                                        {block.sheets.map((sheet) => (
                                                                                            <option key={sheet.name} value={sheet.name}>
                                                                                                {sheet.name}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            )}
                                                                        {(() => {
                                                                            const selectedName =
                                                                                block.selectedSheet ?? block.sheets?.[0]?.name;
                                                                            const selectedSheet = block.sheets?.find(
                                                                                (sheet) => sheet.name === selectedName
                                                                            );
                                                                            if (!selectedSheet?.meta) return null;
                                                                            if (!selectedSheet.meta.truncatedRows && !selectedSheet.meta.truncatedColumns) {
                                                                                return null;
                                                                            }
                                                                            return (
                                                                                <span className="text-amber-600">
                                                                                    Data dipotong menjadi {selectedSheet.meta.rowsReturned} baris x{" "}
                                                                                    {selectedSheet.meta.columnsReturned} kolom.
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-2 flex items-center">
                                <input
                                    type="checkbox"
                                    id="featured"
                                    checked={formData.featured || false}
                                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="featured" className="ml-2 text-sm font-medium">Mark as featured</label>
                            </div>

                            <div className="col-span-2 flex items-center">
                                <input
                                    type="checkbox"
                                    id="inStock"
                                    checked={formData.inStock ?? true}
                                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="inStock" className="ml-2 text-sm font-medium">Stok Tersedia</label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
