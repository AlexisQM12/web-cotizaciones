'use client';

import React, { useState, useEffect } from 'react';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import ProjectionsChart from '@/components/accounting/ProjectionsChart';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';

export default function ProyeccionesPage() {
    const { companyProfileId } = useAccountingConfig();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyProfileId) return;

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/accounting/projections?empresaId=${companyProfileId}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    console.error('Error fetching projections');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [companyProfileId]);

    const handleToggleExclude = async (projectId, currentState) => {
        try {
            // Optimistic update
            setData(prev => prev.map(p => p.id === projectId ? { ...p, isExcludedFromProjections: !currentState } : p));
            
            const res = await fetch(`/api/quotations/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isExcludedFromProjections: !currentState })
            });

            if (!res.ok) {
                // Revert on error
                setData(prev => prev.map(p => p.id === projectId ? { ...p, isExcludedFromProjections: currentState } : p));
                alert('Error al actualizar exclusión.');
            }
        } catch (error) {
            console.error(error);
            setData(prev => prev.map(p => p.id === projectId ? { ...p, isExcludedFromProjections: currentState } : p));
        }
    };

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="chart-bar" size={24} />
                        Proyecciones de Ingresos
                    </h1>
                    <p className="acc-page-subtitle">
                        Previsión de ingresos basada en la fecha de cobro esperada de los proyectos (OC Recibidas).
                    </p>
                </div>
            </div>

            <ProjectionsChart data={data} loading={loading} onToggleExclude={handleToggleExclude} />
            
        </AccountingShell>
    );
}
