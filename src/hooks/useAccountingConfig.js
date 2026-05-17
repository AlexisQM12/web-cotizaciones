'use client';
import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';

// Carga la configuración contable de la empresa default (o la indicada).
// Devuelve { loading, exists, config, companyProfileId, error, reload }.
export function useAccountingConfig(companyProfileId = null) {
    const { user } = useAuth();
    const [loading, setLoading]                 = useState(true);
    const [exists, setExists]                   = useState(false);
    const [config, setConfig]                   = useState(null);
    const [resolvedProfileId, setProfileId]     = useState(companyProfileId);
    const [error, setError]                     = useState(null);

    const load = useCallback(async () => {
        if (!user?.empresaId) return;
        setLoading(true); setError(null);
        try {
            const targetId = companyProfileId || user.empresaId;
            const qs = `?empresaId=${targetId}`;
            const r = await fetch(`/api/accounting/config${qs}`);
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error cargando configuración');
            setExists(!!data.exists);
            setProfileId(targetId);
            setConfig(data.exists ? data : null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [companyProfileId, user?.empresaId]);

    useEffect(() => { load(); }, [load]);

    return { loading, exists, config, companyProfileId: resolvedProfileId, error, reload: load };
}

// Modo de visualización: 'empresario' o 'contador'
const MODE_KEY = 'accountingMode';
export function getAccountingMode() {
    if (typeof window === 'undefined') return 'empresario';
    return window.localStorage.getItem(MODE_KEY) || 'empresario';
}
export function setAccountingMode(mode) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MODE_KEY, mode);
}
