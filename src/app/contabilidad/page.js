'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { useAccountingConfig, getAccountingMode } from '@/hooks/useAccountingConfig';

// Página raíz: decide a dónde enviar al usuario.
// - Si no hay configuración → /contabilidad/setup
// - Si hay → /contabilidad/[modo guardado]
export default function ContabilidadIndex() {
    const router = useRouter();
    const { loading, exists } = useAccountingConfig();

    useEffect(() => {
        if (loading) return;
        if (!exists) { router.replace('/contabilidad/setup'); return; }
        const mode = getAccountingMode();
        router.replace(mode === 'contador' ? '/contabilidad/contador' : '/contabilidad/empresario');
    }, [loading, exists, router]);

    return (
        <ProtectedRoute allowedModule="contabilidad">
            <NavBar />
            <main className="container">
                <p style={{ paddingTop: '5rem', color: '#94a3b8' }}>Cargando hub contable...</p>
            </main>
        </ProtectedRoute>
    );
}
