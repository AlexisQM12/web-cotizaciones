'use client';
import { useEffect, useRef, useState } from 'react';
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
    const [estadoSync, setEstadoSync] = useState(null); // mensaje de progreso del ticket
    const [error, setError] = useState(null);
    // El modo se conserva aunque la consulta falle: si no, el badge desaparece
    // justo cuando más necesitas saber si estás hablando con SUNAT de verdad.
    const [modo, setModo] = useState(null);
    const [esperaHasta, setEsperaHasta] = useState(0); // corte por rate limit (429)

    // La pausa por rate limit se guarda en sessionStorage: la cuota es de SUNAT,
    // no del componente, así que recargar la página no debe saltarse la espera.
    const CLAVE_ESPERA = 'sire:esperaHasta';
    useEffect(() => {
        try {
            const guardado = Number(sessionStorage.getItem(CLAVE_ESPERA) || 0);
            if (guardado > Date.now()) setEsperaHasta(guardado);
        } catch { /* modo privado o storage bloqueado */ }
    }, []);

    const pausarPorRateLimit = (hasta) => {
        setEsperaHasta(hasta);
        try { sessionStorage.setItem(CLAVE_ESPERA, String(hasta)); } catch { /* ignorar */ }
    };

    // Cada consulta le pide a SUNAT que GENERE un archivo (consume cuota). Por eso
    // cacheamos por periodo+libro: cambiar de pestaña y volver no debe re-consultar.
    const cache = useRef(new Map());

    useEffect(() => {
        if (!companyProfileId) return;
        const clave = `${activeTab}:${period}`;
        const guardado = cache.current.get(clave);
        if (guardado) { setSireData(guardado); setError(null); return; }
        if (Date.now() < esperaHasta) {
            setSireData(null);
            setError('En pausa por el límite de consultas de SUNAT. Usa "Actualizar" cuando quieras reintentar.');
            return;
        }
        fetchSireData();
    }, [companyProfileId, period, activeTab]);

    // La propuesta se genera por ticket: la primera llamada puede volver con 202
    // (aún en proceso) y hay que reconsultar con el mismo numTicket. Reintentamos
    // en el cliente para no dejar colgada la petición del servidor.
    const fetchSireData = async (numTicket = null, intento = 1) => {
        setLoading(true);
        if (!numTicket) { setError(null); setSireData(null); }
        let reintentoProgramado = false;
        try {
            const params = new URLSearchParams({
                companyProfileId, empresaId: companyProfileId, period, type: activeTab,
            });
            if (numTicket) params.set('numTicket', numTicket);

            const res = await fetch(`/api/sunat/sire?${params}`);
            const data = await res.json();

            if (res.status === 202 && data.numTicket) {
                if (intento > 10) {
                    setEstadoSync(null);
                    setError(`SUNAT sigue generando el archivo. Reintenta más tarde con el ticket ${data.numTicket}.`);
                    return;
                }
                setEstadoSync(`SUNAT está generando el archivo (ticket ${data.numTicket})… intento ${intento}`);
                reintentoProgramado = true; // mantenemos el spinner hasta que resuelva
                setTimeout(() => fetchSireData(data.numTicket, intento + 1), 4000);
                return;
            }

            setEstadoSync(null);
            if (data.modo) setModo(data.modo);

            if (!res.ok) {
                // `data.error` ya viene con el detalle de SUNAT incorporado; sólo
                // añadimos los códigos que no estén ya en el mensaje, para no
                // repetirlos como pasaba antes.
                const extra = (data.errores || [])
                    .map(e => `[${e.cod}] ${e.msg}`)
                    .filter(d => !String(data.error || '').includes(d));
                setError([data.error, ...extra].filter(Boolean).join('\n'));
                setSireData(null);
                // Ante un 429 dejamos de insistir: reintentar de inmediato sólo
                // alarga el bloqueo de SUNAT.
                if (data.rateLimited || res.status === 429) pausarPorRateLimit(Date.now() + 3 * 60 * 1000);
                return;
            }
            setSireData(data);
            cache.current.set(`${activeTab}:${period}`, data);
        } catch (err) {
            console.error(err);
            setEstadoSync(null);
            setError('Error de red consultando el buzón SIRE.');
        } finally {
            // Si hay un reintento en camino, el spinner sigue: apagarlo haría
            // parpadear "No hay datos" entre intento e intento.
            if (!reintentoProgramado) setLoading(false);
        }
    };

    const esModoPruebas = modo === 'PRUEBAS';

    const handleAceptarPropuesta = async () => {
        const libro = activeTab === 'RVIE' ? 'Ventas' : 'Compras';
        if (esModoPruebas) {
            alert('Estás en modo pruebas (sin credenciales SUNAT). No se puede aceptar una propuesta real.');
            return;
        }
        const escrito = prompt(
            `Vas a ACEPTAR ante SUNAT la propuesta de ${libro} del periodo ${formatPeriod(period)}.\n\n` +
            `Es una acción real e irreversible sobre tu registro electrónico.\n\n` +
            `Escribe ACEPTAR para confirmar:`
        );
        if (escrito !== 'ACEPTAR') return;

        setAccepting(true);
        try {
            const params = new URLSearchParams({
                companyProfileId, empresaId: companyProfileId, period, type: activeTab, confirmar: 'SI',
            });
            const res  = await fetch(`/api/sunat/sire?${params}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(data.mensaje);
                fetchSireData();
            } else {
                alert('No se pudo aceptar la propuesta:\n' + data.error);
            }
        } catch (err) {
            alert('Error de red al aceptar la propuesta.');
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
                        {modo && (
                            <span style={{
                                fontSize: '0.75rem', color: 'white', padding: '0.2rem 0.6rem',
                                borderRadius: '12px', fontWeight: 'bold',
                                background: esModoPruebas ? '#f59e0b' : '#16a34a',
                            }}>
                                {esModoPruebas ? 'MODO PRUEBAS' : 'CONECTADO A SUNAT'}
                            </span>
                        )}
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
                                {sireData.numTicket && <> · Ticket <code>{sireData.numTicket}</code></>}
                                {sireData.resumen?.filasNoParseadas > 0 && (
                                    <> · <span style={{ color: '#b45309' }}>
                                        {sireData.resumen.filasNoParseadas} fila(s) sin mapear
                                    </span></>
                                )}
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-secondary" onClick={() => { cache.current.delete(`${activeTab}:${period}`); pausarPorRateLimit(0); fetchSireData(); }} disabled={loading}>
                            <Icon name="refresh" size={16} /> Actualizar
                        </button>
                        <button className="btn btn-primary" onClick={handleAceptarPropuesta} disabled={accepting || loading || !sireData?.comprobantes?.length}>
                            <Icon name="check" size={16} /> {accepting ? 'Aceptando...' : 'Aceptar Propuesta'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="acc-alert acc-alert-danger" style={{ marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
                        <Icon name="alert" size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
                        {estadoSync || 'Sincronizando con SUNAT...'}
                    </p>
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
                                    {sireData.comprobantes.map(c => c.parcial ? (
                                        // Fila que el parser no pudo mapear: se muestra cruda en vez de
                                        // inventar valores, para que se note que hay que revisarla.
                                        <tr key={c.id}>
                                            <td colSpan="8" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#854d0e', background: '#fefce8' }}>
                                                Fila sin mapear: {c.raw}
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={c.id}>
                                            <td><strong>{c.serie}-{c.numero}</strong></td>
                                            <td>{c.fechaEmision}</td>
                                            <td>{c.ruc}</td>
                                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razonSocial}</td>
                                            <td style={{ textAlign: 'right' }}>{fmt(c.baseImponible)}</td>
                                            <td style={{ textAlign: 'right' }}>{fmt(c.igv)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(c.total)}</td>
                                            <td>
                                                <span className="status-badge" style={{ background: '#e0f2fe', color: '#075985' }}>
                                                    {c.tipoComprobante || '—'} · {c.moneda || 'PEN'}
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
