'use client';

import { signOut, useSession } from 'next-auth/react';

const Sidebar = () => {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const isSuperAdmin = role === 'SUPERADMIN';
    const username = (session?.user as any)?.name || 'Admin';
    const email = (session?.user as any)?.email || '';
    const initials = String(username || 'A')
        .trim()
        .split(' ')
        .map((part: string) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/auth/login' });
    };

    return (
        <div className="w-full lg:w-64 bg-gray-800 text-white p-4 flex flex-col lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto border-b border-gray-700 lg:border-b-0">
            <h2 className="text-lg font-bold mb-6">Admin Menu</h2>
            <div className="mb-6 rounded-lg bg-gray-900 p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{username}</p>
                        {email && <p className="text-xs text-gray-300 truncate">{email}</p>}
                        {role && <p className="text-[11px] text-gray-400 mt-1">{role}</p>}
                    </div>
                </div>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:flex lg:flex-1 lg:flex-col lg:gap-0">
                <li><a href="/admin" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Dashboard</a></li>
                <li><a href="/admin/products" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Products</a></li>
                <li><a href="/admin/clients" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Clients</a></li>
                <li><a href="/admin/messages" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Messages</a></li>
                <li><a href="/admin/articles" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Berita & Artikel</a></li>
                <li><a href="/admin/achievements" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Achievement</a></li>
                {isSuperAdmin && (
                    <li><a href="/admin/admins" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Admins</a></li>
                )}
                {isSuperAdmin && (
                    <li><a href="/admin/audit-logs" className="block rounded px-2 py-2 text-center text-sm hover:bg-gray-700 lg:text-left">Audit Logs</a></li>
                )}
            </ul>
            <div className="border-t border-gray-700 pt-4">
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
