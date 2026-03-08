'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminToast } from '@/components/providers/admin-toast-provider';

interface Message {
    id: number;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    content: string;
    replyContent?: string;
    status: 'UNREAD' | 'READ' | 'REPLIED';
    createdAt: string;
}

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const PAGE_SIZE = 20;

export default function MessagesPage() {
    const toast = useAdminToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
    });

    const normalizePhone = (value: string) => value.replace(/\D/g, '');
    const toWhatsAppNumber = (value: string) => {
        const digits = normalizePhone(value);
        if (!digits) return '';
        if (digits.startsWith('0')) return `62${digits.slice(1)}`;
        if (digits.startsWith('62')) return digits;
        if (digits.startsWith('8')) return `62${digits}`;
        return digits;
    };

    const buildReplyText = (message: Message) => ([
        `Halo ${message.name},`,
        '',
        'Terima kasih sudah menghubungi DaayComTech.',
        '',
        `Subjek: ${message.subject}`,
        `Pesan: ${message.content}`,
        '',
        'Salam,',
        'DaayComTech',
    ].join('\n'));

    const buildGmailComposeUrl = (to: string, subject: string, body: string) => {
        const params = new URLSearchParams({
            view: 'cm',
            fs: '1',
            to,
            su: subject,
            body,
        });
        return `https://mail.google.com/mail/?${params.toString()}`;
    };

    const buildWhatsAppUrl = (phone: string, body: string) => {
        const number = toWhatsAppNumber(phone);
        if (!number) return '';
        return `https://wa.me/${number}?text=${encodeURIComponent(body)}`;
    };

    const handleSelectMessage = (message: Message) => {
        const shouldMarkRead = message.status === 'UNREAD';
        const updatedMessage = shouldMarkRead ? { ...message, status: 'READ' as const } : message;

        setSelectedMessage(updatedMessage);
        if (shouldMarkRead) {
            setMessages((prev) => prev.map((m) => m.id === message.id ? updatedMessage : m));
            markAsRead(message.id);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const response = await fetch(`/api/messages/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'READ' }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Error marking message as read:', err);
                setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'UNREAD' } : m));
                setSelectedMessage((prev) => prev && prev.id === id ? { ...prev, status: 'UNREAD' } : prev);
                return;
            }

            const updated = await response.json();
            setMessages((prev) => prev.map((m) => m.id === id ? updated : m));
            setSelectedMessage((prev) => prev && prev.id === id ? updated : prev);
        } catch (error) {
            console.error('Error marking message as read:', error);
            setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'UNREAD' } : m));
            setSelectedMessage((prev) => prev && prev.id === id ? { ...prev, status: 'UNREAD' } : prev);
        }
    };

    const fetchMessages = useCallback(async (targetPage: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(targetPage),
                limit: String(PAGE_SIZE),
            });
            const response = await fetch(`/api/messages?${params.toString()}`, { cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) {
                console.error('Error fetching messages:', data);
                return;
            }

            const items = Array.isArray(data?.data) ? data.data : [];
            const nextPagination: PaginationState = {
                page: Number(data?.pagination?.page) || targetPage,
                limit: Number(data?.pagination?.limit) || PAGE_SIZE,
                total: Number(data?.pagination?.total) || items.length,
                totalPages: Math.max(1, Number(data?.pagination?.totalPages) || 1),
            };

            setMessages(items);
            setPagination(nextPagination);
            setSelectedMessage((prev) => {
                if (!prev) return null;
                const matched = items.find((item: Message) => item.id === prev.id);
                return matched || null;
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages(page);
    }, [fetchMessages, page]);

    const handleDelete = async () => {
        if (!selectedMessage) return;
        const confirmed = window.confirm('Hapus pesan ini? Tindakan ini tidak dapat dibatalkan.');
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/messages/${selectedMessage.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Error deleting message:', err);
                alert(err?.error || 'Gagal menghapus pesan.');
                return;
            }
            const nextPage = messages.length === 1 && page > 1 ? page - 1 : page;
            if (nextPage !== page) {
                setPage(nextPage);
            } else {
                await fetchMessages(nextPage);
            }
            toast.success('Pesan berhasil dihapus.');
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Gagal menghapus pesan.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return <div className="p-4 sm:p-6">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-6">Messages Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Messages List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow">
                        <div className="border-b p-4">
                            <h2 className="font-semibold">Messages ({pagination.total})</h2>
                        </div>
                        <div className="max-h-64 sm:max-h-80 lg:max-h-[70vh] overflow-y-auto">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    onClick={() => handleSelectMessage(message)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="font-semibold text-sm">{message.name}</div>
                                    <div className="text-xs text-gray-500">{message.email}</div>
                                    {message.phone && (
                                        <div className="text-xs text-gray-500">{message.phone}</div>
                                    )}
                                    <div className="text-sm text-gray-700 line-clamp-2">{message.subject}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(message.createdAt).toLocaleDateString('id-ID')}
                                    </div>
                                    <span className={`inline-block text-xs px-2 py-1 mt-2 rounded ${message.status === 'UNREAD'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : message.status === 'READ'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {message.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t p-3 flex items-center justify-between text-sm">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span>
                                Halaman {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                                disabled={page >= pagination.totalPages}
                                className="px-3 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Message Detail */}
                <div className="lg:col-span-2">
                    {selectedMessage ? (
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                            <h2 className="text-xl font-bold mb-4">{selectedMessage.subject}</h2>

                            <div className="mb-4">
                                <label className="text-sm text-gray-600">From:</label>
                                <p className="font-semibold">{selectedMessage.name} ({selectedMessage.email})</p>
                            </div>
                            {selectedMessage.phone && (
                                <div className="mb-4">
                                    <label className="text-sm text-gray-600">Phone:</label>
                                    <p className="font-semibold">{selectedMessage.phone}</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="text-sm text-gray-600">Date:</label>
                                <p>{new Date(selectedMessage.createdAt).toLocaleString('id-ID')}</p>
                            </div>

                            <div className="mb-6 pb-6 border-b">
                                <label className="text-sm text-gray-600">Message:</label>
                                <p className="mt-2 whitespace-pre-wrap">{selectedMessage.content}</p>
                            </div>

                            {selectedMessage.replyContent && (
                                <div className="mb-6 pb-6 border-b bg-blue-50 p-4 rounded">
                                    <label className="text-sm text-gray-600">Your Reply:</label>
                                    <p className="mt-2 whitespace-pre-wrap">{selectedMessage.replyContent}</p>
                                </div>
                            )}

                            {selectedMessage.status !== 'REPLIED' && (
                                <div>
                                    <label className="text-sm font-semibold">Balasan:</label>
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <a
                                            href={buildGmailComposeUrl(
                                                selectedMessage.email,
                                                `Balasan: ${selectedMessage.subject}`,
                                                buildReplyText(selectedMessage)
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded hover:bg-blue-50 w-full sm:w-auto"
                                        >
                                            Balas via Gmail
                                        </a>
                                        {selectedMessage.phone ? (
                                            <a
                                                href={buildWhatsAppUrl(
                                                    selectedMessage.phone,
                                                    buildReplyText(selectedMessage)
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
                                            >
                                                Balas via WhatsApp
                                            </a>
                                        ) : (
                                            <span className="inline-flex items-center justify-center bg-gray-200 text-gray-500 px-4 py-2 rounded cursor-not-allowed w-full sm:w-auto">
                                                Balas via WhatsApp
                                            </span>
                                        )}
                                    </div>
                                    {!selectedMessage.phone && (
                                        <p className="text-xs text-gray-500 mt-2">Nomor HP belum tersedia.</p>
                                    )}
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-300 w-full sm:w-auto"
                                >
                                    {isDeleting ? 'Menghapus...' : 'Hapus Pesan'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6 text-center text-gray-500">
                            Select a message to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
