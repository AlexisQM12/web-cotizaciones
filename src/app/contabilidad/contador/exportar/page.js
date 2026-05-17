'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods } from '@/lib/accounting/taxCalendar';

export default function Page() {
    return <Suspense fallback={<AccountingShell><p style={{ color: '#94a3b8' }}>Cargando...</p></AccountingShell>}><ExportarSIRE /></Suspense>;
}

function ExportarSIRE() {
    const searchParams = useSearchParams();
    const { companyProfileId } = useAccountingConfig();
    const [period, setPeriod] = useState(searchParams.get('period') || getCurrentDeclarationPeriod());
    const [downloading, setDownloading] = useState(null);
    const [previews, setPreviews] = useState({});

    const downloadFile = async (libro) => {
        setDownloading(libro);
        try {
            const r = await fetch(`/api/accounting/sire-export?companyProfileId=${companyProfileId}&period=${period}&libro=${libro}`);
            if (!r.ok) {
                const d = await r.json().catch(() => ({}));
                alert(d.error || 'Error generando archivo');
                return;
            }
            const filename = r.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || `sire-${libro}.txt`;
            const rowCount = r.headers.get('X-Row-Count') || '0';
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
            setPreviews((p) => ({ ...p, [libro]: { filename, rowCount } }));
        } finally { setDownloading(null); }
    };

    const previewFile = async (libro) => {
        const r = await fetch(`/api/accounting/sire-export?companyProfileId=${companyProfileId}&period=${period}&libro=${libro}`);
        if (!r.ok) return;
        const text     = await r.text();
        const filename = r.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || '';
        const rowCount = r.headers.get('X-Row-Count') || '0';
        setPreviews((p) => ({ ...p, [libro]: { filename, rowCount, content: text } }));
    };

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="package" size={24} />
                        Exportar SIRE / Archivos SUNAT
                    </h1>
                    <p className="acc-page-subtitle">
                        Genera los archivos planos con la estructura oficial SUNAT para subir al portal SIRE.
                    </p>
                </div>
                <div className="acc-page-actions">
                    <select className="acc-select" style={{ width: 200 }} value={period} onChange={e => setPeriod(e.target.value)}>
                        {listAvailablePeriods().map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
                    </select>
                </div>
            </div>

            <div className="acc-alert acc-alert-info" style={{ marginBottom: '1.5rem' }}>
                <Icon name="info" size={16} />
                <span>
                    <strong>SIRE</strong> es obligatorio desde enero 2026 para los registros de Ventas (14.1) y Compras (8.1).
                    Estructura conforme a la Resolución N° 040-2022/SUNAT y modificatorias.
                </span>
            </div>

            <div className="acc-grid acc-grid-2" style={{ gap: '1.25rem' }}>
                <ExportCard
                    libro="14.1"
                    icon="doc-up"
                    title="Registro de Ventas e Ingresos"
                    description="Todas las facturas, boletas, notas de crédito y débito emitidas en el periodo."
                    onDownload={() => downloadFile('14.1')}
                    onPreview={() => previewFile('14.1')}
                    downloading={downloading === '14.1'}
                    preview={previews['14.1']}
                />
                <ExportCard
                    libro="8.1"
                    icon="doc-down"
                    title="Registro de Compras"
                    description="Todas las facturas y comprobantes de compra recibidos en el periodo."
                    onDownload={() => downloadFile('8.1')}
                    onPreview={() => previewFile('8.1')}
                    downloading={downloading === '8.1'}
                    preview={previews['8.1']}
                />
            </div>

            <div className="acc-card" style={{ marginTop: '1.5rem' }}>
                <h2 className="acc-section-title"><Icon name="book" size={18} /> Cómo presentar a SUNAT</h2>
                <ol className="steps-list">
                    <li>Descarga los archivos <code>.txt</code> de Ventas (14.1) y Compras (8.1).</li>
                    <li>Ingresa a <a href="https://www.sunat.gob.pe" target="_blank" rel="noreferrer">SUNAT Operaciones en Línea</a> con tu Clave SOL.</li>
                    <li>Ve a <strong>Registro de Ventas e Ingresos / Compras Electrónico</strong> dentro de SIRE.</li>
                    <li>Sube el archivo correspondiente al periodo {formatPeriod(period)}.</li>
                    <li>Una vez validado, genera y presenta el <strong>Formulario Virtual 621</strong> con los importes que aparecen en Determinación IGV/Renta.</li>
                </ol>
                <style jsx>{`
                    .steps-list {
                        padding-left: 1.25rem;
                        color: #475569;
                        font-size: 0.9rem;
                        line-height: 1.8;
                        margin: 0;
                    }
                    .steps-list code {
                        background: #f1f5f9; padding: 2px 6px; border-radius: 4px;
                        font-size: 0.85em;
                    }
                    .steps-list a {
                        color: var(--primary); font-weight: 600;
                    }
                `}</style>
            </div>
        </AccountingShell>
    );
}

function ExportCard({ libro, icon, title, description, onDownload, onPreview, downloading, preview }) {
    return (
        <div className="acc-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Icon name={icon} size={20} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{title}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                        Libro SIRE {libro}
                    </div>
                </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>{description}</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={onDownload} disabled={downloading}>
                    <Icon name="download" size={15} className={downloading ? 'spin' : ''} />
                    <span style={{ marginLeft: '0.45rem' }}>{downloading ? 'Generando...' : 'Descargar .txt'}</span>
                </button>
                <button className="btn btn-secondary" onClick={onPreview}>
                    <Icon name="eye" size={15} />
                    <span style={{ marginLeft: '0.45rem' }}>Ver contenido</span>
                </button>
            </div>
            {preview && (
                <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{preview.filename}</code></span>
                        <span>{preview.rowCount} filas</span>
                    </div>
                    {preview.content !== undefined && (
                        <pre style={{
                            background: '#0f172a', color: '#e2e8f0', padding: '0.85rem',
                            borderRadius: 12, fontSize: '0.7rem', maxHeight: 280, overflow: 'auto',
                            whiteSpace: 'pre', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}>{preview.content || '(archivo vacío — sin operaciones en el periodo)'}</pre>
                    )}
                </div>
            )}
        </div>
    );
}
