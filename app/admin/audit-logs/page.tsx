'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type AuditLog = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  metadata: unknown;
  createdAt: string;
};

const metadataPreview = (metadata: unknown) => {
  if (metadata === null || metadata === undefined) return '-';
  try {
    const raw = JSON.stringify(metadata);
    return raw.length > 140 ? `${raw.slice(0, 140)}...` : raw;
  } catch {
    return '-';
  }
};

export default function AdminAuditLogsPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;
  const isSuperAdmin = role === 'SUPERADMIN';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [submittedFilter, setSubmittedFilter] = useState('');

  const fetchLogs = async (action: string) => {
    const params = new URLSearchParams({ limit: '200' });
    if (action.trim()) {
      params.set('action', action.trim().toUpperCase());
    }

    const response = await fetch(`/api/audit-logs?${params.toString()}`);
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(data?.error || 'Gagal memuat audit log.');
    }

    return Array.isArray(data) ? (data as AuditLog[]) : [];
  };

  const reload = async (action: string) => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    try {
      const result = await fetchLogs(action);
      setLogs(result);
      setError(null);
    } catch (fetchError) {
      console.error('Error fetching audit logs:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat audit log.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    reload(submittedFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isSuperAdmin, submittedFilter]);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setSubmittedFilter(actionFilter.trim());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload(submittedFilter);
  };

  if (status === 'loading') {
    return <div className="p-4 sm:p-6">Loading...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-2">Audit Logs</h1>
        <p className="text-gray-600">Anda tidak memiliki akses untuk halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-gray-600">Riwayat aktivitas sensitif admin (maksimal 200 data terbaru).</p>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="rounded-lg bg-white p-4 shadow sm:flex sm:items-end sm:gap-3"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Filter Action</label>
          <input
            type="text"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            placeholder="Contoh: ADMIN_INVITE_CREATED"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="mt-3 flex gap-2 sm:mt-0">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {refreshing ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-white p-4 shadow">
        {loading ? (
          <p className="text-sm text-gray-600">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Waktu</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Actor</th>
                  <th className="px-3 py-2 text-left">Entity</th>
                  <th className="px-3 py-2 text-left">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium">{log.action}</td>
                    <td className="px-3 py-2">
                      <div className="max-w-[220px] truncate">{log.actorEmail || '-'}</div>
                      <div className="text-xs text-gray-500">
                        {(log.actorRole || '-') + (log.actorId ? ` (${log.actorId})` : '')}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{log.entity || '-'}</div>
                      <div className="text-xs text-gray-500">{log.entityId || '-'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <code className="text-xs text-gray-700">{metadataPreview(log.metadata)}</code>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-gray-500" colSpan={5}>
                      Belum ada data audit log.
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
