'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig, getAccountingMode, setAccountingMode } from '@/hooks/useAccountingConfig';

// Shell del módulo contable. Conserva la paleta slate del sistema:
//   --primary:#1e293b, border:#f1f5f9, text-muted:#94a3b8, accent:#3b82f6
// Usa las clases globales (.btn, .input) y un layout con sidebar.
export default function AccountingShell({ children, requireSetup = true }) {
    const router   = useRouter();
    const pathname = usePathname();
    const { loading, exists, config, companyProfileId, error, reload } = useAccountingConfig();
    const [mode, setMode] = useState('empresario');

    useEffect(() => { setMode(getAccountingMode()); }, []);

    useEffect(() => {
        if (!loading && requireSetup && !exists && !pathname.includes('/setup')) {
            router.replace('/contabilidad/setup');
        }
    }, [loading, exists, requireSetup, pathname, router]);

    const toggleMode = (next) => {
        setAccountingMode(next);
        setMode(next);
        if (next === 'empresario' && pathname.startsWith('/contabilidad/contador')) {
            router.push('/contabilidad/empresario');
        } else if (next === 'contador' && pathname.startsWith('/contabilidad/empresario')) {
            router.push('/contabilidad/contador');
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <NavBar />
                <main className="container"><p style={{ paddingTop: '5rem', color: '#94a3b8' }}>Cargando configuración contable...</p></main>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <NavBar />
            <div className="acc-shell">
                <aside className="acc-sidebar">
                    <div className="acc-brand">
                        <div className="acc-brand-icon"><Icon name="calculator" size={22} /></div>
                        <div className="acc-brand-text">
                            <div className="acc-brand-label">Centro Contable</div>
                            <div className="acc-brand-name">{config?.razonSocial || 'Mi Empresa'}</div>
                            {config?.taxRegime && (
                                <div className="acc-brand-meta">
                                    {config.companyType} · {config.taxRegime} · RUC {config.ruc}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="acc-toggle">
                        <button
                            className={`acc-toggle-btn ${mode === 'empresario' ? 'active' : ''}`}
                            onClick={() => toggleMode('empresario')}
                        >
                            <Icon name="briefcase" size={15} /> Empresario
                        </button>
                        <button
                            className={`acc-toggle-btn ${mode === 'contador' ? 'active' : ''}`}
                            onClick={() => toggleMode('contador')}
                        >
                            <Icon name="calculator" size={15} /> Contador
                        </button>
                    </div>

                    <nav className="acc-nav">
                        {mode === 'empresario' ? (
                            <>
                                <NavLink href="/contabilidad/empresario" icon="home" active={pathname === '/contabilidad/empresario'}>Resumen</NavLink>
                                <NavLink href="/contabilidad/proyecciones" icon="chart-bar" active={pathname === '/contabilidad/proyecciones'}>Proyecciones</NavLink>
                                <NavLink href="/contabilidad/setup" icon="settings" active={pathname === '/contabilidad/setup'}>Configuración</NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink href="/contabilidad/contador" icon="home" active={pathname === '/contabilidad/contador'}>Panel Contador</NavLink>
                                <NavLink href="/contabilidad/contador/ventas" icon="doc-up" active={pathname.startsWith('/contabilidad/contador/ventas')}>Registro de Ventas</NavLink>
                                <NavLink href="/contabilidad/contador/compras" icon="doc-down" active={pathname.startsWith('/contabilidad/contador/compras')}>Registro de Compras</NavLink>
                                <NavLink href="/contabilidad/proyecciones" icon="chart-bar" active={pathname === '/contabilidad/proyecciones'}>Proyecciones</NavLink>
                                <NavLink href="/contabilidad/contador/diario" icon="book" active={pathname.startsWith('/contabilidad/contador/diario')}>Libro Diario / Mayor</NavLink>
                                <NavLink href="/contabilidad/contador/igv" icon="receipt" active={pathname.startsWith('/contabilidad/contador/igv')}>Determinación IGV / Renta</NavLink>
                                <NavLink href="/contabilidad/contador/exportar" icon="package" active={pathname.startsWith('/contabilidad/contador/exportar')}>Exportar SIRE</NavLink>
                                <NavLink href="/contabilidad/setup" icon="settings" active={pathname === '/contabilidad/setup'}>Configuración</NavLink>
                            </>
                        )}
                    </nav>
                </aside>

                <main className="acc-main">
                    {error && (
                        <div className="acc-alert acc-alert-warn">
                            <Icon name="alert" size={16} />
                            <span>{error}</span>
                            <button onClick={reload} className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Reintentar</button>
                        </div>
                    )}
                    {children}
                </main>
            </div>

            <style jsx global>{`
                .acc-shell {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    min-height: calc(100vh - 80px);
                    background: var(--bg);
                    padding-top: 80px;
                }
                .acc-sidebar {
                    background: #ffffff;
                    border-right: 1px solid var(--border);
                    padding: 1.75rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.75rem;
                    position: sticky;
                    top: 80px;
                    align-self: start;
                    height: calc(100vh - 80px);
                    overflow-y: auto;
                }
                .acc-brand { display: flex; gap: 0.75rem; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
                .acc-brand-icon {
                    width: 40px; height: 40px; border-radius: 12px;
                    background: var(--primary); color: #ffffff;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .acc-brand-text { min-width: 0; flex: 1; }
                .acc-brand-label {
                    font-size: 0.65rem; color: var(--text-muted); font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .acc-brand-name {
                    font-weight: 700; color: var(--text-main); font-size: 0.95rem;
                    margin-top: 0.15rem; line-height: 1.2;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .acc-brand-meta { font-size: 0.7rem; color: #64748b; margin-top: 0.25rem; }

                .acc-toggle {
                    display: flex; background: #f1f5f9; border-radius: 12px;
                    padding: 4px; gap: 4px;
                }
                .acc-toggle-btn {
                    flex: 1; background: transparent; border: none;
                    padding: 0.55rem 0.5rem; border-radius: 8px;
                    font-size: 0.78rem; font-weight: 600; color: #64748b;
                    cursor: pointer; transition: all 0.15s;
                    display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
                    font-family: inherit;
                }
                .acc-toggle-btn.active {
                    background: #ffffff; color: var(--primary);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                }

                .acc-nav { display: flex; flex-direction: column; gap: 2px; }
                .acc-nav-link {
                    display: flex; align-items: center; gap: 0.7rem;
                    padding: 0.65rem 0.85rem; border-radius: 10px;
                    color: #475569; text-decoration: none;
                    font-size: 0.875rem; font-weight: 500;
                    transition: all 0.15s; cursor: pointer;
                    font-family: inherit;
                }
                .acc-nav-link:hover { background: #f8fafc; color: var(--text-main); }
                .acc-nav-link.active {
                    background: var(--primary); color: #ffffff; font-weight: 600;
                }

                .acc-main { padding: 2.5rem 2.5rem 4rem; max-width: 1400px; }

                .acc-alert {
                    display: flex; align-items: center; gap: 0.6rem;
                    padding: 0.85rem 1rem; border-radius: 12px;
                    margin-bottom: 1.5rem; font-size: 0.875rem;
                }
                .acc-alert-warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
                .acc-alert-info { background: #f8fafc; border: 1px solid var(--border); color: #475569; }

                /* Cards reutilizando filosofía del sistema */
                .acc-card {
                    background: #ffffff;
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    padding: 1.75rem;
                    box-shadow: var(--shadow-premium);
                }
                .acc-card-sm {
                    background: #ffffff;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.25rem;
                }

                /* KPI tiles */
                .acc-kpi {
                    background: #ffffff;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.25rem 1.35rem;
                    display: flex; flex-direction: column; gap: 0.35rem;
                }
                .acc-kpi-head { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); }
                .acc-kpi-label {
                    font-size: 0.7rem; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .acc-kpi-value {
                    font-size: 1.65rem; font-weight: 700;
                    color: var(--text-main); letter-spacing: -0.02em;
                    line-height: 1.1;
                }
                .acc-kpi-sub { font-size: 0.78rem; color: #64748b; }

                /* Grids */
                .acc-grid { display: grid; gap: 1.25rem; }
                .acc-grid-2 { grid-template-columns: repeat(2, 1fr); }
                .acc-grid-3 { grid-template-columns: repeat(3, 1fr); }
                .acc-grid-4 { grid-template-columns: repeat(4, 1fr); }

                /* Tables */
                .acc-table-wrap {
                    background: #ffffff;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    overflow: auto;
                }
                .acc-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                .acc-table th {
                    background: #f8fafc;
                    text-align: left;
                    padding: 0.85rem 1rem;
                    font-weight: 600; color: #475569;
                    border-bottom: 1px solid var(--border);
                    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em;
                    white-space: nowrap;
                }
                .acc-table td {
                    padding: 0.8rem 1rem;
                    border-bottom: 1px solid var(--border);
                    color: #334155;
                }
                .acc-table tr:last-child td { border-bottom: none; }
                .acc-table tr:hover td { background: #fafbfc; }

                /* Badges */
                .acc-badge {
                    display: inline-flex; align-items: center; gap: 0.25rem;
                    padding: 0.25rem 0.6rem; border-radius: 999px;
                    font-size: 0.7rem; font-weight: 600;
                }
                .acc-badge-neutral { background: #f1f5f9; color: #475569; }
                .acc-badge-success { background: #ecfdf5; color: #047857; }
                .acc-badge-warning { background: #fffbeb; color: #b45309; }
                .acc-badge-danger  { background: #fef2f2; color: #b91c1c; }
                .acc-badge-info    { background: #eff6ff; color: #1d4ed8; }

                /* Form fields */
                .acc-field { display: flex; flex-direction: column; gap: 0.4rem; }
                .acc-field-label {
                    font-size: 0.7rem; font-weight: 600; color: var(--text-muted);
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .acc-input, .acc-select {
                    width: 100%;
                    padding: 0.7rem 0.9rem;
                    font-size: 0.9rem;
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    color: var(--text-main);
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                .acc-input:focus, .acc-select:focus {
                    border-color: var(--primary); outline: none;
                }

                /* Page header */
                .acc-page-head {
                    display: flex; justify-content: space-between; align-items: flex-end;
                    flex-wrap: wrap; gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .acc-page-title {
                    display: flex; align-items: center; gap: 0.75rem;
                    font-size: 1.85rem; font-weight: 700;
                    color: var(--text-main); letter-spacing: -0.02em;
                }
                .acc-page-title svg { color: var(--primary); }
                .acc-page-subtitle { color: #64748b; font-size: 0.95rem; margin-top: 0.4rem; }

                .acc-page-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

                /* Section title */
                .acc-section-title {
                    display: flex; align-items: center; gap: 0.5rem;
                    font-size: 1.05rem; font-weight: 600; color: var(--text-main);
                    margin-bottom: 1rem; letter-spacing: -0.01em;
                }

                /* Icon button (small actions) */
                .acc-icon-btn {
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 32px; height: 32px;
                    background: #f8fafc; color: #475569;
                    border: 1px solid var(--border); border-radius: 8px;
                    cursor: pointer; transition: all 0.15s;
                    font-family: inherit;
                }
                .acc-icon-btn:hover { background: #f1f5f9; color: var(--text-main); }
                .acc-icon-btn.danger:hover { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

                /* Modal */
                .acc-modal-overlay {
                    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
                    backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000; padding: 1rem;
                }
                .acc-modal {
                    background: #fff; padding: 1.75rem; border-radius: 20px;
                    width: 100%; max-width: 820px; max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
                }
                .acc-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
                .acc-modal-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
                .acc-modal-grid .full { grid-column: span 3; }
                .acc-check-row {
                    display: flex; gap: 0.6rem; align-items: center;
                    cursor: pointer; user-select: none;
                    font-size: 0.875rem; color: #475569;
                }
                .acc-check-row input[type="checkbox"] {
                    width: 18px; height: 18px; accent-color: var(--primary); margin: 0;
                }

                @media (max-width: 900px) {
                    .acc-shell { grid-template-columns: 1fr; }
                    .acc-sidebar { position: relative; top: 0; height: auto; }
                    .acc-main { padding: 1.5rem 1rem 4rem; }
                    .acc-grid-2, .acc-grid-3, .acc-grid-4 { grid-template-columns: 1fr; }
                    .acc-page-head { flex-direction: column; align-items: stretch; }
                    .acc-modal-grid { grid-template-columns: 1fr; }
                    .acc-modal-grid .full { grid-column: 1; }
                }
            `}</style>
        </ProtectedRoute>
    );
}

function NavLink({ href, icon, active, children }) {
    const router = useRouter();
    return (
        <a href={href} className={`acc-nav-link ${active ? 'active' : ''}`}
           onClick={(e) => { e.preventDefault(); router.push(href); }}>
            <Icon name={icon} size={17} />
            <span>{children}</span>
        </a>
    );
}
