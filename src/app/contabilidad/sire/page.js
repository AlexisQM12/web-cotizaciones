'use client';
import { useEffect, useState } from 'react';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, listAvailablePeriods, formatPeriod } from '@/lib/accounting/taxCalendar';

export default function SirePage() {
    const { config, companyProfileId, loading: cfgLoading } = useAccountingConfig();
    const [period, setPeriod] = useState(getCurrentDeclarationPeriod());
    const [activeTab, setActiveTab] = useState('RVIE'); // RVIE o RCE
    const [sireData, setSireData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        if (!companyProfileId) return;
        fetchSireData();
    }, [companyProfileId, period, activeTab]);

    const fetchSireData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sunat/sire?companyProfileId=${companyProfileId}&period=${period}&type=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setSireData(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAceptarPropuesta = async () => {
        if (!confirm(`¿Estás seguro de aceptar la propuesta de ${activeTab === 'RVIE' ? 'Ventas' : 'Compras'} para el periodo ${formatPeriod(period)}?`)) return;
        setAccepting(true);
        try {
            const res = await fetch(`/api/sunat/sire?type=${activeTab}&period=${period}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(data.message + `\nTicket: ${data.ticket}`);
            } else {
                alert('Error al aceptar propuesta');
            }
        } catch (error) {
            alert('Error de red al aceptar propuesta');
        } finally {
            setAccepting(false);
        }
    };

    if (cfgLoading || !config) return <AccountingShell><p>Cargando...</p></AccountingShell>;

    const fmt = (n) => typeof n === 'number' ? `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon name="cloud-download" size={26} />
                        Buzón SIRE (SUNAT)
                        <span style={{ fontSize: '0.75rem', background: '#f59e0b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            MODO PRUEBAS
                        </span>
                    </h1>
                    <p className="acc-page-subtitle" style={{ margin: 0, marginTop: '0.25rem' }}>
                        Revisa y acepta las propuestas de Registros de Compras y Ventas de SUNAT.
                    </p>
                </div>
                <div className="acc-page-actions">
                    <select className="acc-select" value={period} onChange={e => setPeriod(e.target.value)}>
                        {listAvailablePeriods().map(p => (
                            <option key={p} value={p}>{formatPeriod(p)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="acc-tabs">
                <button className={`acc-tab ${activeTab === 'RVIE' ? 'active' : ''}`} onClick={() => setActiveTab('RVIE')}>
                    RVIE (Ventas)
                </button>
                <button className={`acc-tab ${activeTab === 'RCE' ? 'active' : ''}`} onClick={() => setActiveTab('RCE')}>
                    RCE (Compras)
                </button>
            </div>

            <div className="acc-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 className="acc-section-title" style={{ margin: 0 }}>
                            Propuesta {activeTab === 'RVIE' ? 'Ventas' : 'Compras'} - {formatPeriod(period)}
                        </h2>
                        {sireData && (
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                Estado SUNAT: <strong>{sireData.estadoPropuesta}</strong>
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-secondary" onClick={fetchSireData} disabled={loading}>
                            <Icon name="refresh" size={16} /> Actualizar
                        </button>
                        <button className="btn btn-primary" onClick={handleAceptarPropuesta} disabled={accepting || loading || !sireData?.comprobantes?.length}>
                            <Icon name="check" size={16} /> {accepting ? 'Aceptando...' : 'Aceptar Propuesta'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Sincronizando con SUNAT...</p>
                ) : !sireData ? (
                    <p style={{ color: '#94a3b8' }}>No hay datos.</p>
                ) : (
                    <>
                        <div className="acc-grid acc-grid-4" style={{ marginBottom: '1.5rem' }}>
                            <div className="acc-kpi-card" style={{ background: '#f8fafc' }}>
                                <div className="acc-kpi-label">Documentos</div>
                                <div className="acc-kpi-value">{sireData.resumen.totalDocumentos}</div>
                            </div>
                            <div className="acc-kpi-card" style={{ background: '#f8fafc' }}>
                                <div className="acc-kpi-label">Base Imponible</div>
                                <div className="acc-kpi-value">{fmt(sireData.resumen.totalBaseImponible)}</div>
                            </div>
                            <div className="acc-kpi-card" style={{ background: '#f8fafc' }}>
                                <div className="acc-kpi-label">Total IGV</div>
                                <div className="acc-kpi-value">{fmt(sireData.resumen.totalIGV)}</div>
                            </div>
                            <div className="acc-kpi-card" style={{ background: '#f8fafc' }}>
                                <div className="acc-kpi-label">Total Monto</div>
                                <div className="acc-kpi-value">{fmt(sireData.resumen.totalMonto)}</div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="acc-table">
                                <thead>
                                    <tr>
                                        <th>Serie - Número</th>
                                        <th>Fecha Emisión</th>
                                        <th>RUC Contratante</th>
                                        <th>Razón Social</th>
                                        <th style={{ textAlign: 'right' }}>Base Imp.</th>
                                        <th style={{ textAlign: 'right' }}>IGV</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sireData.comprobantes.map(c => (
                                        <tr key={c.id}>
                                            <td><strong>{c.serie}-{c.numero}</strong></td>
                                            <td>{c.fechaEmision}</td>
                                            <td>{c.ruc}</td>
                                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razonSocial}</td>
                                            <td style={{ textAlign: 'right' }}>{fmt(c.baseImponible)}</td>
                                            <td style={{ textAlign: 'right' }}>{fmt(c.igv)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(c.total)}</td>
                                            <td>
                                                <span className="status-badge" style={{ background: c.estadoPropuesta === 'Aceptado' ? '#dcfce7' : '#fef08a', color: c.estadoPropuesta === 'Aceptado' ? '#166534' : '#854d0e' }}>
                                                    {c.estadoPropuesta}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {sireData.comprobantes.length === 0 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>No hay comprobantes propuestos para este periodo.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </AccountingShell>
    );
}
