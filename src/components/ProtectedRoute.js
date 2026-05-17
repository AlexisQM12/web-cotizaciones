'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (!user.empresaId && pathname !== '/onboarding') {
                router.push('/onboarding');
            }
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#fafafa'
            }}>
                <p style={{ fontSize: '1.1rem', color: '#667085' }}>Cargando...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
