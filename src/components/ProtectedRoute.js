'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children, allowedModule, adminOnly }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
                return;
            } 
            if (!user.empresaId && pathname !== '/onboarding') {
                router.push('/onboarding');
                return;
            }

            // RBAC checks
            if (user.role !== 'admin') {
                if (adminOnly) {
                    alert('Acceso Denegado. Se requieren permisos de administrador.');
                    router.push('/');
                    return;
                }
                if (allowedModule && (!user.modules || !user.modules.includes(allowedModule))) {
                    alert('Acceso Denegado. No tienes permisos para este módulo.');
                    router.push('/');
                    return;
                }
            }
        }
    }, [user, loading, router, pathname, allowedModule, adminOnly]);

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
