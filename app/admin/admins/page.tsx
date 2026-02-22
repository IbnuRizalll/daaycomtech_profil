'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminToast } from '@/components/providers/admin-toast-provider';

interface AdminUser {
    id: string;
    username: string;
    email: string;
    role: 'SUPERADMIN' | 'ADMIN';
}

interface AdminInvite {
    id: string;
    username: string;
    email: string;
    role: 'SUPERADMIN' | 'ADMIN';
    expiresAt: string;
    createdAt: string;
    invitedByEmail?: string | null;
    status: 'PENDING' | 'EXPIRED' | 'USED';
}

interface InviteCreateResponse {
    id: string;
    username: string;
    email: string;
    role: 'SUPERADMIN' | 'ADMIN';
    expiresAt: string;
    activationUrl: string;
}

export default function AdminsPage() {
    const toast = useAdminToast();
    const { data: session, status } = useSession();
    const role = (session?.user as any)?.role as AdminUser['role'] | undefined;
    const isSuperAdmin = role === 'SUPERADMIN';

    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [invites, setInvites] = useState<AdminInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [latestInvite, setLatestInvite] = useState<InviteCreateResponse | null>(null);
    const [inviteForm, setInviteForm] = useState({
        username: '',
        email: '',
    });
    const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

    const [resetSubmitting, setResetSubmitting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [resetForm, setResetForm] = useState({
        adminId: '',
        password: '',
        confirmPassword: '',
    });

    const fetchAdminsAndInvites = async () => {
        if (!isSuperAdmin) {
            setLoading(false);
            return;
        }

        try {
            const [adminsRes, invitesRes] = await Promise.all([
                fetch('/api/admins'),
                fetch('/api/admins/invitations'),
            ]);

            const adminsData = await adminsRes.json().catch(() => []);
            const invitesData = await invitesRes.json().catch(() => []);

            if (!adminsRes.ok) {
                setError(adminsData?.error || 'Gagal memuat admin.');
            } else {
                setAdmins(Array.isArray(adminsData) ? adminsData : []);
            }

            if (!invitesRes.ok) {
                setError(invitesData?.error || 'Gagal memuat undangan admin.');
            } else {
                setInvites(Array.isArray(invitesData) ? invitesData : []);
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Gagal memuat data admin.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status !== 'loading') {
            fetchAdminsAndInvites();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperAdmin, status]);

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        try {
            const response = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteForm),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data?.error || 'Gagal membuat undangan admin.');
                return;
            }

            const inviteResponse = data as InviteCreateResponse;
            setLatestInvite(inviteResponse);
            setInviteForm({ username: '', email: '' });
            setSuccess('Undangan admin berhasil dibuat.');
            toast.success('Undangan admin berhasil dibuat.');
            await fetchAdminsAndInvites();
        } catch (err) {
            console.error('Error creating admin invite:', err);
            setError('Gagal membuat undangan admin.');
        } finally {
            setSubmitting(false);
        }
    };

    const copyInviteLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link aktivasi berhasil disalin.');
        } catch {
            toast.error('Gagal menyalin link aktivasi.');
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        const confirmed = window.confirm('Yakin ingin membatalkan undangan ini?');
        if (!confirmed) return;

        setRevokingInviteId(inviteId);
        try {
            const response = await fetch(`/api/admins/invitations/${inviteId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                toast.error(data?.error || 'Gagal membatalkan undangan.');
                return;
            }
            toast.success('Undangan berhasil dibatalkan.');
            await fetchAdminsAndInvites();
        } catch (err) {
            console.error('Error revoking invitation:', err);
            toast.error('Gagal membatalkan undangan.');
        } finally {
            setRevokingInviteId(null);
        }
    };

    const handleDeleteAdmin = async (adminId: string) => {
        if (!adminId) return;
        const confirmed = window.confirm('Yakin ingin menghapus admin ini?');
        if (!confirmed) return;

        setDeleteError(null);
        setDeletingId(adminId);
        try {
            const response = await fetch(`/api/admins/${adminId}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) {
                setDeleteError(data?.error || 'Gagal menghapus admin.');
                return;
            }
            setAdmins((prev) => prev.filter((admin) => admin.id !== adminId));
            toast.success('Admin berhasil dihapus.');
        } catch (err) {
            console.error('Error deleting admin:', err);
            setDeleteError('Gagal menghapus admin.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError(null);
        setResetSuccess(null);
        setResetSubmitting(true);

        try {
            const response = await fetch('/api/admins/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resetForm),
            });
            const data = await response.json();
            if (!response.ok) {
                setResetError(data?.error || 'Gagal mereset password.');
                return;
            }
            setResetForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
            setResetSuccess('Password admin berhasil direset.');
            toast.success('Password admin berhasil direset.');
        } catch (err) {
            console.error('Error resetting admin password:', err);
            setResetError('Gagal mereset password.');
        } finally {
            setResetSubmitting(false);
        }
    };

    if (status === 'loading') {
        return <div className="p-4 sm:p-6">Loading...</div>;
    }

    if (!isSuperAdmin) {
        return (
            <div className="p-4 sm:p-6">
                <h1 className="text-2xl font-bold mb-2">Admin Management</h1>
                <p className="text-gray-600">Anda tidak memiliki akses untuk halaman ini.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Admin Management</h1>
                <p className="text-gray-600">
                    SUPERADMIN membuat undangan aktivasi. Admin baru mengaktifkan akun lewat link token.
                </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="bg-white rounded-lg shadow p-6 space-y-4 w-full max-w-xl">
                <h2 className="text-lg font-semibold">Undang Admin Baru</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {success}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                        type="text"
                        value={inviteForm.username}
                        onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Email Admin</label>
                    <input
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 w-full sm:w-auto"
                >
                    {submitting ? 'Menyimpan...' : 'Buat Undangan Aktivasi'}
                </button>
            </form>

            {latestInvite && (
                <div className="bg-white rounded-lg shadow p-6 space-y-3 w-full max-w-3xl">
                    <h2 className="text-lg font-semibold">Link Aktivasi Terbaru</h2>
                    <p className="text-sm text-gray-600">
                        Bagikan link ini ke admin yang diundang ({latestInvite.email}).
                    </p>
                    <div className="rounded border bg-gray-50 p-3 break-all text-sm">
                        {latestInvite.activationUrl}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => copyInviteLink(latestInvite.activationUrl)}
                            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-black text-sm"
                        >
                            Copy Link
                        </button>
                        <a
                            href={latestInvite.activationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            Buka Halaman Aktivasi
                        </a>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Undangan Aktivasi</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Username</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Expired</th>
                                    <th className="px-4 py-2 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map((invite) => (
                                    <tr key={invite.id} className="border-b">
                                        <td className="px-4 py-2">{invite.username}</td>
                                        <td className="px-4 py-2">{invite.email}</td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                                    invite.status === 'PENDING'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : invite.status === 'EXPIRED'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {invite.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">{new Date(invite.expiresAt).toLocaleString()}</td>
                                        <td className="px-4 py-2">
                                            {invite.status !== 'USED' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevokeInvite(invite.id)}
                                                    disabled={revokingInviteId === invite.id}
                                                    className="text-red-600 hover:text-red-800 font-medium disabled:text-red-300"
                                                >
                                                    {revokingInviteId === invite.id ? 'Membatalkan...' : 'Batalkan'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {invites.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-4 text-gray-500" colSpan={5}>
                                            Belum ada undangan admin.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <form
                id="reset-password"
                onSubmit={handleResetSubmit}
                className="bg-white rounded-lg shadow p-6 space-y-4 w-full max-w-xl"
            >
                <h2 className="text-lg font-semibold">Reset Password Admin Aktif</h2>

                {resetError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        {resetError}
                    </div>
                )}
                {resetSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {resetSuccess}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">Pilih Admin</label>
                    <select
                        value={resetForm.adminId}
                        onChange={(e) => setResetForm({ ...resetForm, adminId: e.target.value })}
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="" disabled>
                            Pilih admin
                        </option>
                        {admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                                {admin.username} ({admin.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Password Baru</label>
                    <input
                        type="password"
                        value={resetForm.password}
                        onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
                    <input
                        type="password"
                        value={resetForm.confirmPassword}
                        onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:bg-amber-300 w-full sm:w-auto"
                >
                    {resetSubmitting ? 'Menyimpan...' : 'Reset Password'}
                </button>
            </form>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Daftar Admin Aktif</h2>
                {deleteError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        {deleteError}
                    </div>
                )}
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Username</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">Role</th>
                                    <th className="px-4 py-2 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="border-b">
                                        <td className="px-4 py-2">{admin.username}</td>
                                        <td className="px-4 py-2">{admin.email}</td>
                                        <td className="px-4 py-2">{admin.role}</td>
                                        <td className="px-4 py-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResetForm((prev) => ({ ...prev, adminId: admin.id }));
                                                    setResetError(null);
                                                    setResetSuccess(null);
                                                }}
                                                className="text-amber-700 hover:text-amber-900 font-medium"
                                            >
                                                Reset Password
                                            </button>
                                            {admin.role !== 'SUPERADMIN' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAdmin(admin.id)}
                                                    disabled={deletingId === admin.id}
                                                    className="ml-4 text-red-600 hover:text-red-800 font-medium disabled:text-red-300"
                                                >
                                                    {deletingId === admin.id ? 'Menghapus...' : 'Hapus'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {admins.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-4 text-gray-500" colSpan={4}>
                                            Belum ada admin aktif.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
