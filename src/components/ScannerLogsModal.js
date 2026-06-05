import React, { useState, useEffect, useRef } from 'react';

const PHASE_CONFIG = {
  idle:       { color: '#64748b', bg: '#f1f5f9', icon: '🕐', label: 'En espera' },
  connecting: { color: '#d97706', bg: '#fef3c7', icon: '🔌', label: 'Conectando' },
  scanning:   { color: '#2563eb', bg: '#dbeafe', icon: '🔍', label: 'Escaneando' },
  processing: { color: '#7c3aed', bg: '#ede9fe', icon: '⚙️', label: 'Procesando' },
  error:      { color: '#dc2626', bg: '#fee2e2', icon: '❌', label: 'Error' },
};

export function ScannerLogsModal({ isOpen, onClose, socket, quotations }) {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({ phase: 'idle', message: 'Conectando al servidor...', current: 0, total: 0, currentFile: null, nextScanAt: null });
  const [countdown, setCountdown] = useState(null);
  const [reassignRow, setReassignRow] = useState(null); // logId del row con dropdown abierto
  const [ocrProcessingId, setOcrProcessingId] = useState(null); // logId siendo procesado por OCR
  const [debugRow, setDebugRow] = useState(null); // logId con panel de debug expandido
  const [ocrToast, setOcrToast] = useState(null); // { type: 'success'|'warn'|'error', message }
  const [searchTerm, setSearchTerm] = useState('');
  const ocrToastRef = useRef(null);
  const countdownRef = useRef(null);

  // Countdown timer to next scan
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (!status.nextScanAt) { setCountdown(null); return; }

    const tick = () => {
      const secs = Math.max(0, Math.round((status.nextScanAt - Date.now()) / 1000));
      setCountdown(secs);
      if (secs === 0) clearInterval(countdownRef.current);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => clearInterval(countdownRef.current);
  }, [status.nextScanAt]);

  useEffect(() => {
    if (!isOpen) return;

    let unsubLogs = () => {};
    let unsubStatus = () => {};
    
    // Importación dinámica para evitar problemas en SSR
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      import('@/lib/firestoreClient').then(({ clientDb }) => {
        if (!clientDb) return;
        
        // Escuchar logs directamente desde Firestore
        unsubLogs = onSnapshot(doc(clientDb, 'scanner_state', 'logs'), (snap) => {
          if (snap.exists()) {
            const data = snap.data().entries || [];
            const seen = new Set();
            setLogs(data.filter(l => l.id && !seen.has(l.id) && seen.add(l.id)));
          }
        });

        // Escuchar estado (status)
        unsubStatus = onSnapshot(doc(clientDb, 'scanner_state', 'status'), (snap) => {
          if (snap.exists()) {
            setStatus(snap.data());
          }
        });
      });
    });

    return () => {
      unsubLogs();
      if (typeof unsubStatus === 'function') unsubStatus();
    };
  }, [isOpen]);

  const assignManually = async (logId, docId) => {
    if (!docId) return;
    try {
      await fetch(`/api/quotations/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationStatus: 'aprobada' })
      });
      setLogs(prev => prev.map(log =>
        log.id === logId ? { ...log, status: 'Asignado Manualmente', docId } : log
      ));
    } catch (err) {
      console.error(err);
      alert('Error al asignar cotización manualmente.');
    }
  };

  const reassignInvoice = (logId, oldDocId, newDocId) => {
    if (!socket || !newDocId || newDocId === oldDocId) return;
    socket.emit('reassign_invoice', { logId, oldDocId, newDocId });
    setReassignRow(null);
    setLogs(prev => prev.map(log => {
      if (log.id !== logId) return log;
      const q = quotations.find(q => q.id === newDocId);
      return { ...log, docId: newDocId, status: 'Factura - Completado', foundCode: q?.code || log.foundCode };
    }));
  };

  const assignInvoiceManually = async (logId, newDocId) => {
    if (!newDocId) return;
    try {
      await fetch(`/api/quotations/${newDocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationStatus: 'completado' }),
      });
      const q = quotations.find(q => q.id === newDocId);
      setLogs(prev => prev.map(log =>
        log.id === logId
          ? { ...log, docId: newDocId, status: 'Factura - Completado', foundCode: q?.code || 'Asignado' }
          : log
      ));
    } catch (err) {
      console.error(err);
      alert('Error al asignar factura manualmente.');
    }
  };

  const handleScannerAction = async (actionType) => {
    try {
      setOcrToast({ type: 'warn', message: 'Limpiando caché en la base de datos...' });
      const res = await fetch('/api/scanner/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType }),
      });
      const data = await res.json();
      if (data.success) {
        setOcrToast({ type: 'success', message: data.message });
      } else {
        setOcrToast({ type: 'error', message: `Error: ${data.error}` });
      }
    } catch (err) {
      setOcrToast({ type: 'error', message: `Error de red: ${err.message}` });
    }
  };

  if (!isOpen) return null;

  const phase = PHASE_CONFIG[status.phase] || PHASE_CONFIG.idle;
  const isActive = status.phase === 'connecting' || status.phase === 'scanning' || status.phase === 'processing';
  const progressPct = status.total > 0 ? Math.round((status.current / status.total) * 100) : 0;
  const pendingQuotations = quotations
    .filter(q => q.code)
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''));

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.filename && log.filename.toLowerCase().includes(term)) ||
      (log.foundCode && log.foundCode.toLowerCase().includes(term)) ||
      (log.status && log.status.toLowerCase().includes(term)) ||
      (log.source && log.source.toLowerCase().includes(term))
    );
  });

  // Cotizaciones con OC recibida (aprobada) — opciones para asignar facturas
  const ocOptions = quotations
    .filter(q => q.code && q.quotationStatus === 'aprobada')
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
    .map(q => {
      const subtotal = q.items?.length
        ? q.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0), 0)
        : (q.total || 0);
      const totalConIGV = (Math.round(subtotal * 1.18 * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return { id: q.id, label: `${q.code} — ${q.clientName || 'Sin cliente'} (S/ ${totalConIGV})` };
    });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      {/* Toast OCR — siempre visible, esquina inferior derecha del overlay */}
      {ocrToast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1100,
          maxWidth: 380, padding: '0.85rem 1.1rem', borderRadius: '10px',
          fontSize: '0.88rem', fontWeight: '500', boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          background: ocrToast.type === 'success' ? '#f0fdf4' : ocrToast.type === 'error' ? '#fef2f2' : '#fff7ed',
          border: `1px solid ${ocrToast.type === 'success' ? '#86efac' : ocrToast.type === 'error' ? '#fca5a5' : '#fdba74'}`,
          color: ocrToast.type === 'success' ? '#15803d' : ocrToast.type === 'error' ? '#dc2626' : '#c2410c',
        }}>
          <span style={{ flex: 1 }}>{ocrToast.message}</span>
          <button onClick={() => setOcrToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'inherit', opacity: 0.5, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      )}
      <div className="scanner-modal-content">

        {/* Header */}
        <div className="scanner-modal-header">
          <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>📡 Monitor de Escaneo de Órdenes de Compra</h2>
          <div className="scanner-modal-actions">
            <button
              onClick={() => handleScannerAction('force_rescan')}
              style={{
                background: isActive ? '#e2e8f0' : '#fef2f2',
                border: '1px solid #fecaca',
                color: isActive ? '#94a3b8' : '#dc2626',
                borderRadius: '8px',
                padding: '0.4rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: isActive ? 'not-allowed' : 'pointer',
              }}
              title="Revierte estados incorrectos y re-escanea con la lógica correcta (solo archivos con 'OC' en el nombre)"
            >
              ⚠️ Resetear y re-escanear
            </button>
            <button
              onClick={() => handleScannerAction('rescan_sent')}
              style={{
                background: isActive ? '#e2e8f0' : '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: isActive ? '#94a3b8' : '#16a34a',
                borderRadius: '8px',
                padding: '0.4rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: isActive ? 'not-allowed' : 'pointer',
              }}
              title="Limpia caché de enviados y re-escanea facturas y cotizaciones enviadas sin tocar el inbox"
            >
              📤 Re-escanear enviados
            </button>
            <button
              onClick={() => handleScannerAction('force_rescan')}
              style={{
                background: isActive ? '#e2e8f0' : '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: isActive ? '#94a3b8' : '#475569',
                borderRadius: '8px',
                padding: '0.4rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: isActive ? 'not-allowed' : 'pointer',
              }}
              title="Limpia la caché y re-analiza todos los correos con la lógica actualizada"
            >
              🔄 Re-escanear todo
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
          </div>
        </div>

        {/* Status Panel */}
        <div style={{
          background: phase.bg,
          border: `1px solid ${phase.color}30`,
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
        }}>
          {/* Phase badge + message */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: isActive ? '0.75rem' : 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: phase.color, color: 'white',
              padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
              whiteSpace: 'nowrap',
            }}>
              {isActive && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'white',
                  display: 'inline-block',
                  animation: 'pulse-dot 1.2s ease-in-out infinite',
                }} />
              )}
              {phase.icon} {phase.label}
            </span>
            <span style={{ color: phase.color, fontSize: '0.9rem', fontWeight: '500' }}>
              {status.message}
            </span>
          </div>



          {/* Progress bar */}
          {isActive && status.total > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: phase.color, marginBottom: '0.35rem', fontWeight: '600' }}>
                <span>{status.current} / {status.total} correos</span>
                <span>{progressPct}%</span>
              </div>
              <div style={{ background: `${phase.color}25`, borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: phase.color, borderRadius: '99px',
                  width: `${progressPct}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              {status.currentFile && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: phase.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📄</span>
                  <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{status.currentFile}</span>
                </div>
              )}
            </div>
          )}

          {/* Countdown */}
          {!isActive && countdown !== null && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
              Próximo escaneo en <strong>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</strong>
            </div>
          )}
        </div>

        <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          Si el lector no detectó el código automáticamente (PDF con imagen), puedes emparejarlo manualmente con el selector.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Buscar por archivo, código OC, estado o tipo (ej. Factura)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        {/* Logs table */}
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
            Aún no se han procesado PDFs. Aparecerán aquí cuando el escáner encuentre adjuntos.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
            No se encontraron registros para la búsqueda: "{searchTerm}".
          </div>
        ) : (
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Hora</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Archivo PDF</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Código</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isOk  = log.status?.startsWith('Asignado') || log.status === 'Enviada' || log.status === 'Factura - Completado';
                const isWarn = log.status === 'Sin monto legible';
                const isErr = !isOk && !isWarn && (log.status === 'No Coincide' || log.status === 'No Existe' || log.status === 'Error Lectura');
                const sourceLabel = log.source === 'factura' ? { text: 'Factura', bg: '#f3e8ff', color: '#7c3aed' }
                  : log.source === 'enviada' ? { text: 'Enviada', bg: '#e0f2fe', color: '#0369a1' }
                  : { text: 'OC', bg: '#fef3c7', color: '#d97706' };
                const isOcrRunning = ocrProcessingId === log.id;
                return (
                  <React.Fragment key={log.id}>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: isOcrRunning ? '#ecfeff' : undefined, transition: 'background 0.3s' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: sourceLabel.bg, color: sourceLabel.color, whiteSpace: 'nowrap' }}>
                        {sourceLabel.text}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#0f172a', maxWidth: 220, wordBreak: 'break-word' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span>{log.filename}</span>
                        {log.debugText && (
                          <button
                            onClick={() => setDebugRow(debugRow === log.id ? null : log.id)}
                            title="Ver texto extraído del PDF"
                            style={{
                              fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                              border: '1px solid #cbd5e1', background: debugRow === log.id ? '#f1f5f9' : 'white',
                              color: '#64748b', cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            📋
                          </button>
                        )}
                        {log.source === 'factura' && !log.docId && (
                          <button
                            onClick={() => {
                              alert('El re-proceso de OCR manual está desactivado en Cloud Functions. El sistema lo reintentará automáticamente en el próximo ciclo si es necesario.');
                            }}
                            title={isOcrRunning ? 'Procesando OCR...' : 'Re-procesar con OCR para extraer montos y asignar automáticamente'}
                            disabled={isOcrRunning}
                            style={{
                              fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '4px',
                              border: `1px solid ${isOcrRunning ? '#a5f3fc' : '#6ee7b7'}`,
                              background: isOcrRunning ? '#ecfeff' : '#ecfdf5',
                              color: isOcrRunning ? '#0e7490' : '#065f46',
                              cursor: isOcrRunning ? 'not-allowed' : 'pointer',
                              fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0,
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            }}
                          >
                            {isOcrRunning ? (
                              <>
                                <span style={{
                                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                  border: '1.5px solid #0e7490', borderTopColor: 'transparent',
                                  animation: 'ocr-spin 0.7s linear infinite',
                                }} />
                                OCR...
                              </>
                            ) : '🔬 OCR'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: log.foundCode ? '#0284c7' : '#94a3b8', fontFamily: 'monospace' }}>
                      {log.foundCode || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                        background: isOk ? '#dcfce7' : isWarn ? '#fff7ed' : isErr ? '#fee2e2' : '#fef3c7',
                        color: isOk ? '#16a34a' : isWarn ? '#ea580c' : isErr ? '#dc2626' : '#d97706',
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {log.source === 'factura' ? (
                        log.docId ? (
                          // Factura asignada — código visible + botón Cambiar
                          reassignRow === log.id ? (
                            <select
                              autoFocus
                              defaultValue=""
                              onChange={(e) => reassignInvoice(log.id, log.docId, e.target.value)}
                              onBlur={() => setReassignRow(null)}
                              style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #a855f7', fontSize: '0.8rem' }}
                            >
                              <option value="" disabled>Reasignar a OC recibida...</option>
                              {ocOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>
                                ✓ {quotations.find(q => q.id === log.docId)?.code || 'Asignado'}
                              </span>
                              <button
                                onClick={() => setReassignRow(log.id)}
                                style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #d8b4fe', background: '#faf5ff', color: '#7c3aed', cursor: 'pointer' }}
                              >
                                Cambiar
                              </button>
                            </div>
                          )
                        ) : (
                          // Factura sin asignar (sin monto legible o sin coincidencia)
                          <select
                            defaultValue=""
                            onChange={(e) => assignInvoiceManually(log.id, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #d8b4fe', fontSize: '0.8rem' }}
                          >
                            <option value="" disabled>Asignar a OC recibida...</option>
                            {ocOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                        )
                      ) : isErr ? (
                        // OC o COT sin coincidencia — re-vincular
                        <select
                          defaultValue=""
                          onChange={(e) => assignManually(log.id, e.target.value)}
                          style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        >
                          <option value="" disabled>Re-vincular...</option>
                          {pendingQuotations.map(q => (
                            <option key={q.id} value={q.id}>{q.code} — {q.clientName || 'Sin Título'}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                  </tr>
                  {debugRow === log.id && log.debugText && (
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan={6} style={{ padding: '0.5rem 1rem 0.75rem 1rem' }}>
                        <pre style={{
                          margin: 0, fontSize: '0.75rem', color: '#334155',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                          background: '#f1f5f9', border: '1px solid #e2e8f0',
                          borderRadius: '6px', padding: '0.6rem 0.8rem',
                          maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace',
                        }}>
                          {log.debugText}
                        </pre>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes ocr-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
