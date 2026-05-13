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
    if (!isOpen || !socket) return;

    socket.emit('request_po_logs');

    const handleLogsList  = (data) => setLogs(data);
    const handleLogAdded  = (newLog) => setLogs(prev => [newLog, ...prev]);
    const handleStatus    = (s) => setStatus(s);

    socket.on('po_logs_list', handleLogsList);
    socket.on('po_scanner_log_added', handleLogAdded);
    socket.on('scan_status', handleStatus);

    return () => {
      socket.off('po_logs_list', handleLogsList);
      socket.off('po_scanner_log_added', handleLogAdded);
      socket.off('scan_status', handleStatus);
    };
  }, [isOpen, socket]);

  const assignManually = async (logId, docId) => {
    if (!docId) return;
    try {
      await fetch(`/api/quotations/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aprobada' })
      });
      setLogs(prev => prev.map(log =>
        log.id === logId ? { ...log, status: 'Asignado Manualmente', docId } : log
      ));
    } catch (err) {
      console.error(err);
      alert('Error al asignar cotización manualmente.');
    }
  };

  if (!isOpen) return null;

  const phase = PHASE_CONFIG[status.phase] || PHASE_CONFIG.idle;
  const isActive = status.phase === 'connecting' || status.phase === 'scanning' || status.phase === 'processing';
  const progressPct = status.total > 0 ? Math.round((status.current / status.total) * 100) : 0;
  const pendingQuotations = quotations
    .filter(q => q.code)
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '2rem', width: '940px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>📡 Monitor de Escaneo de Órdenes de Compra</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (!socket) return;
                if (!confirm('⚠️ Esto revertirá TODOS los estados "OC Recibida" asignados automáticamente a "Pendiente", limpiará el historial y re-escaneará desde cero.\n\n¿Continuar?')) return;
                socket.emit('reset_and_rescan');
              }}
              disabled={isActive}
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
              onClick={() => {
                if (!socket) return;
                if (!confirm('¿Re-escanear todos los correos desde cero? Esto puede tardar varios minutos.')) return;
                socket.emit('force_rescan');
              }}
              disabled={isActive}
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

        {/* Logs table */}
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
            Aún no se han procesado PDFs. Aparecerán aquí cuando el escáner encuentre adjuntos.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
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
              {logs.map((log) => {
                const isOk = log.status?.startsWith('Asignado') || log.status === 'Enviada' || log.status === 'Factura - Completado';
                const isErr = log.status === 'No Coincide' || log.status === 'No Existe' || log.status === 'Error Lectura';
                const sourceLabel = log.source === 'factura' ? { text: 'Factura', bg: '#f3e8ff', color: '#7c3aed' }
                  : log.source === 'enviada' ? { text: 'Enviada', bg: '#e0f2fe', color: '#0369a1' }
                  : { text: 'OC', bg: '#fef3c7', color: '#d97706' };
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: sourceLabel.bg, color: sourceLabel.color, whiteSpace: 'nowrap' }}>
                        {sourceLabel.text}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#0f172a', maxWidth: 220, wordBreak: 'break-word' }}>
                      {log.filename}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: log.foundCode ? '#0284c7' : '#94a3b8', fontFamily: 'monospace' }}>
                      {log.foundCode || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                        background: isOk ? '#dcfce7' : isErr ? '#fee2e2' : '#fef3c7',
                        color: isOk ? '#16a34a' : isErr ? '#dc2626' : '#d97706',
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {isErr ? (
                        <select
                          defaultValue=""
                          onChange={(e) => assignManually(log.id, e.target.value)}
                          style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        >
                          <option value="" disabled>Re-vincular...</option>
                          {pendingQuotations.map(q => (
                            <option key={q.id} value={q.id}>
                              {q.code} — {q.clientName || 'Sin Título'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>✓ Completado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
