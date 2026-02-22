import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // Server-side fetch counts and recent items
    const [productsCount, clientsCount, unreadMessagesCount] = await Promise.all([
        prisma.product.count(),
        prisma.client.count(),
        prisma.message.count({ where: { status: 'UNREAD' } }),
    ]);

    const [recentProducts, recentMessages] = await Promise.all([
        prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-sm text-gray-600">Ringkasan statistik singkat dan aktivitas terbaru.</p>
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold">{productsCount}</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <p className="text-sm text-gray-500">Total Clients</p>
                    <p className="text-2xl font-bold">{clientsCount}</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <p className="text-sm text-gray-500">Unread Messages</p>
                    <p className="text-2xl font-bold">{unreadMessagesCount}</p>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded shadow p-4">
                    <h2 className="text-lg font-semibold mb-3">Recent Products</h2>
                    <ul className="space-y-3">
                        {recentProducts.map((p) => (
                            <li key={p.id} className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                                    {p.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-sm text-gray-600">{formatPrice(p.price)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">{p.category}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded shadow p-4">
                    <h2 className="text-lg font-semibold mb-3">Recent Messages</h2>
                    <ul className="space-y-3">
                        {recentMessages.map((m) => (
                            <li key={m.id} className="flex flex-col">
                                <div className="flex justify-between">
                                    <span className="font-medium">{m.name}</span>
                                    <span className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="text-sm text-gray-700">{m.subject}</div>
                                <div className="text-xs text-gray-500 truncate">{m.content}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}
