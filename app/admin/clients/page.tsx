'use client';

import { useEffect, useState } from 'react';
import { useAdminToast } from '@/components/providers/admin-toast-provider';

interface Client {
    id: string;
    name: string;
    logoUrl: string;
    isShow: boolean;
}

export default function ClientsPage() {
    const toast = useAdminToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        logoUrl: '',
        isShow: true,
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (client?: Client) => {
        if (client) {
            setEditingId(client.id);
            setFormData(client);
            setLogoPreview(client.logoUrl);
        } else {
            setEditingId(null);
            setFormData({ name: '', logoUrl: '', isShow: true });
            setLogoPreview('');
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', logoUrl: '', isShow: true });
        setLogoPreview('');
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
                setFormData({ ...formData, logoUrl: data.url });
                setLogoPreview(data.url);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.logoUrl) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const url = editingId ? `/api/clients/${editingId}` : '/api/clients';
            const method = editingId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    logoUrl: formData.logoUrl,
                    isShow: formData.isShow ?? true,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (editingId) {
                    setClients(clients.map(c => c.id === editingId ? data : c));
                    toast.success('Klien berhasil diperbarui.');
                } else {
                    setClients([...clients, data]);
                    toast.success('Klien berhasil ditambahkan.');
                }
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving client:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this client?')) return;

        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setClients(clients.filter(c => c.id !== id));
                toast.success('Klien berhasil dihapus.');
            }
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    };

    if (loading) {
        return <div className="p-4 sm:p-6">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Clients Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full sm:w-auto"
                >
                    Add Client
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Logo</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Show</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => (
                            <tr key={client.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 sm:px-6 py-4 text-sm">{client.name}</td>
                                <td className="px-4 sm:px-6 py-4">
                                    <img src={client.logoUrl} alt={client.name} className="h-8 w-auto" onError={(e) => e.currentTarget.src = '/images/team/team.png'} />
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-sm ${client.isShow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {client.isShow ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => handleOpenModal(client)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
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
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-4">
                            {editingId ? 'Edit Client' : 'Add Client'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Logo</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="flex-1 border rounded p-2"
                                    />
                                    {uploading && <span className="text-sm text-blue-600">Uploading...</span>}
                                </div>
                                {logoPreview && (
                                    <div className="mt-2">
                                        <img src={logoPreview} alt="Logo preview" className="h-16 w-auto" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isShow"
                                    checked={formData.isShow || false}
                                    onChange={(e) => setFormData({ ...formData, isShow: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isShow" className="ml-2 text-sm font-medium">Show on website</label>
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
