'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type InviteInfo = {
  id: string;
  username: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN';
  expiresAt: string;
};

export default function ActivateAdminPage() {
  const searchParams = useSearchParams();
  const token = String(searchParams.get('token') || '').trim();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let isMounted = true;

    const validateToken = async () => {
      if (!token) {
        if (isMounted) {
          setError('Token aktivasi tidak ditemukan.');
          setLoadingInvite(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/admins/activate?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        if (!response.ok) {
          if (isMounted) {
            setError(data?.error || 'Token aktivasi tidak valid.');
            setLoadingInvite(false);
          }
          return;
        }

        if (isMounted) {
          setInvite(data as InviteInfo);
          setError(null);
          setLoadingInvite(false);
        }
      } catch (fetchError) {
        console.error('Error validating invite token:', fetchError);
        if (isMounted) {
          setError('Gagal memvalidasi token aktivasi.');
          setLoadingInvite(false);
        }
      }
    };

    validateToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Token aktivasi tidak ditemukan.');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admins/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Aktivasi gagal.');
        return;
      }

      setSuccess(data?.message || 'Aktivasi berhasil. Silakan login.');
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      console.error('Error activating admin:', submitError);
      setError('Terjadi kesalahan saat aktivasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-lg rounded-lg bg-white p-6 shadow-md sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Aktivasi Akun Admin</h1>
        <p className="mt-2 text-sm text-gray-600">
          Buat password untuk mengaktifkan akun admin Anda.
        </p>

        {loadingInvite && <p className="mt-4 text-sm text-gray-600">Memvalidasi token...</p>}

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {invite && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p>
              <span className="font-medium">Username:</span> {invite.username}
            </p>
            <p>
              <span className="font-medium">Email:</span> {invite.email}
            </p>
            <p>
              <span className="font-medium">Berlaku sampai:</span>{' '}
              {new Date(invite.expiresAt).toLocaleString()}
            </p>
          </div>
        )}

        {success ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lanjut ke Login Admin
            </Link>
          </div>
        ) : (
          invite &&
          !loadingInvite && (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  minLength={8}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  minLength={8}
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {submitting ? 'Memproses...' : 'Aktifkan Akun'}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
