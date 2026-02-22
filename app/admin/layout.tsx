import Sidebar from './sidebar';
import { ReactNode } from 'react';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import { AdminToastProvider } from '@/components/providers/admin-toast-provider';

export const dynamic = 'force-dynamic';

const AdminLayout = ({ children }: { children: ReactNode }) => {
    return (
        <AuthSessionProvider>
            <AdminToastProvider>
                <div className="flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden bg-gray-100">
                    <Sidebar />
                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:overflow-y-auto">{children}</main>
                </div>
            </AdminToastProvider>
        </AuthSessionProvider>
    );
};

export default AdminLayout;
