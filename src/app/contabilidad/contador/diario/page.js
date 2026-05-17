'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods } from '@/lib/accounting/taxCalendar';

export default function Page() {
    return <Suspense fallback={<AccountingShell><p style={{ color: '#94a3b8' }}>Cargando...</p></AccountingShell>}><LibroDiarioMayor /></Suspense>;
}

function LibroDiarioMayor() {
    const searchParams = useSearchParams();
    const { companyProfileId } = useAccountingConfig();
    const [period, setPeriod] = useState(searchParams.get('period') || getCurrentDeclarationPeriod());
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(false);
    const [view, setView]     = useState('diario');

    useEffect(() => {
        if (!companyProfileId) return;
        (async () => {
            setLoading(true);
            const r = await fetch(`/api/accounting/tax-calc?companyProfileId=${companyProfileId}&period=${period}`);
            setData(await r.json());
            setLoading(false);
        })();
    }, [companyProfileId, period]);

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="book" size={24} />
                        Libro Diario / Mayor
                    </h1>
                    <p className="acc-page-subtitle">
                        {formatPeriod(period)} · {data?.counts?.journalEntries || 0} asientos generados automáticamente
                    </p>
                </div>
                <div className="acc-page-actions">
                    <select className="acc-select" style={{ width: 200 }} value={period} onChange={e => setPeriod(e.target.value)}>
                        {listAvailablePeriods().map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
                    </select>
                </div>
            </div>

            <div className="view-tabs">
                <button className={`view-tab ${view === 'diario' ? 'active' : ''}`} onClick={() => setView('diario')}>
                    <Icon name="file-text" size={15} />
                    <span>Libro Diario</span>
                </button>
                <button className={`view-tab ${view === 'mayor' ? 'active' : ''}`} onClick={() => setView('mayor')}>
                    <Icon name="chart-bar" size={15} />
                    <span>Libro Mayor</span>
                </button>
            </div>

            {loading ? <p style={{ color: '#94a3b8' }}>Generando asientos...</p> : view === 'diario' ? <Diario entries={data?.journal?.diario || []} /> : <Mayor accounts={data?.journal?.mayor || []} />}

            <style jsx>{`
                .view-tabs { display: flex; gap: 0.4rem; margin-bottom: 1.25rem; }
                .view-tab {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.6rem 1rem; border-radius: 12px;
                    border: 1px solid var(--border); background: #fff;
                    color: #64748b; font-weight: 600; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.15s; font-family: inherit;
                }
                .view-tab:hover { color: var(--primary); }
                .view-tab.active {
                    background: var(--primary); color: #fff; border-color: var(--primary);
                }
            `}</style>
        </AccountingShell>
    );
}

function Diario({ entries }) {
    if (entries.length === 0) {
        return <div className="acc-card"><p style={{ color: '#94a3b8' }}>Sin asientos en este periodo.</p></div>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {entries.map((e) => (
                <div key={e.number} className="acc-card-sm">
                    <div className="entry-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span className="entry-num">N° {e.number}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{fmtDate(e.date)}</span>
                            <span className="acc-badge acc-badge-neutral">{e.sourceType}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                            <span>Debe: <strong>{fmt(e.totalDebit)}</strong></span>
                            <span>Haber: <strong>{fmt(e.totalCredit)}</strong></span>
                        </div>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem', fontStyle: 'italic' }}>{e.glosa}</p>
                    <div className="acc-table-wrap" style={{ borderRadius: 12 }}>
                        <table className="acc-table" style={{ fontSize: '0.82rem' }}>
                            <thead>
                                <tr>
                                    <th>Cuenta</th>
                                    <th>Denominación</th>
                                    <th style={{ textAlign: 'right' }}>Debe</th>
                                    <th style={{ textAlign: 'right' }}>Haber</th>
                                </tr>
                            </thead>
                            <tbody>
                                {e.lines.map((l, i) => (
                                    <tr key={i}>
                                        <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{l.account}</code></td>
                                        <td>{l.accountName}</td>
                                        <td style={{ textAlign: 'right' }}>{l.debit > 0 ? fmt(l.debit) : '—'}</td>
                                        <td style={{ textAlign: 'right' }}>{l.credit > 0 ? fmt(l.credit) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
            <style jsx>{`
                .entry-head {
                    display: flex; justify-content: space-between; align-items: center;
                    flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;
                }
                .entry-num {
                    font-weight: 700; font-size: 0.85rem; color: var(--text-main);
                }
            `}</style>
        </div>
    );
}

function Mayor({ accounts }) {
    if (accounts.length === 0) {
        return <div className="acc-card"><p style={{ color: '#94a3b8' }}>Sin movimientos en este periodo.</p></div>;
    }
    return (
        <div className="acc-table-wrap">
            <table className="acc-table">
                <thead>
                    <tr>
                        <th>Cuenta</th>
                        <th>Denominación</th>
                        <th style={{ textAlign: 'right' }}>Movs.</th>
                        <th style={{ textAlign: 'right' }}>Debe</th>
                        <th style={{ textAlign: 'right' }}>Haber</th>
                        <th style={{ textAlign: 'right' }}>Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map((a) => (
                        <tr key={a.account}>
                            <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{a.account}</code></td>
                            <td>{a.name}</td>
                            <td style={{ textAlign: 'right' }}>{a.movements.length}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(a.totalDebit)}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(a.totalCredit)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: a.balance >= 0 ? 'var(--text-main)' : '#b91c1c' }}>{fmt(a.balance)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function fmt(n) { return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0); }
function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
