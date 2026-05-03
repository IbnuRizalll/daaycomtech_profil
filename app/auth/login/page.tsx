'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { loginSchema } from '@/lib/validation';

const getLoginErrorMessage = (error?: string | null, status?: number) => {
    if (status === 429) {
        return 'Terlalu banyak percobaan login. Coba lagi dalam beberapa saat.';
    }

    if (!error) {
        return 'Login gagal. Email atau password salah.';
    }

    if (error === 'CredentialsSignin') {
        return 'Email atau password salah.';
    }

    if (error.toLowerCase().includes('rate') || error.includes('429')) {
        return 'Terlalu banyak percobaan login. Coba lagi dalam beberapa saat.';
    }

    return error;
};

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number) =>
    Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            window.setTimeout(() => {
                reject(new Error('timeout'));
            }, timeoutMs);
        }),
    ]);

const LoginPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Input tidak valid.';
            setError(firstError);
            setLoading(false);
            return;
        }

        try {
            const result = await withTimeout(
                signIn('credentials', {
                    redirect: false,
                    email,
                    password,
                }),
                15_000
            );

            if (result?.ok) {
                router.push('/admin');
                return;
            }

            setError(getLoginErrorMessage(result?.error, result?.status));
        } catch (error) {
            console.error('Login request failed:', error);
            setError('Login gagal diproses. Coba lagi dalam beberapa saat.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-10">
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
                {error && <p className="text-red-500 mb-4 text-center bg-red-50 p-2 rounded">{error}</p>}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        placeholder="Masukkan email admin"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-3 mb-0 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-3 mb-0 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white p-3 rounded w-full font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
