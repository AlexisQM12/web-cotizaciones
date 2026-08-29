'use client';
// Configuración de inventario del tenant, en tiempo real.
// Escucha tenants/{empresaId}/cgo_settings/inventory con onSnapshot, así un
// cambio de configuración se refleja sin recargar la página.
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb, getTenantCollectionClient } from '@/lib/firestoreClient';
import { resolveInventoryConfig } from '@/lib/cgoConfig';

export function useInventoryConfig(empresaId) {
    // Arranca con los defaults: la UI nunca se queda sin configuración válida.
    const [config, setConfig] = useState(() => resolveInventoryConfig(null));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!empresaId || !clientDb) {
            setLoading(false);
            return;
        }

        const ref = doc(getTenantCollectionClient(empresaId, 'cgo_settings'), 'inventory');
        const unsubscribe = onSnapshot(
            ref,
            (snap) => {
                setConfig(resolveInventoryConfig(snap.exists() ? snap.data() : null));
                setLoading(false);
            },
            (err) => {
                console.error('Error leyendo configuración de inventario:', err);
                setConfig(resolveInventoryConfig(null));
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [empresaId]);

    return { config, loading };
}
