'use client';
// Bloc de notas flotante, presente en toda la app.
//
// Sirve para apuntar una idea sin salir de lo que estés haciendo. Al pulsar el
// icono se despliega una nota nueva lista para escribir, con las anteriores
// debajo. Todo se guarda en Firestore por empresa (tenants/{id}/cgo_notas).
//
// Se monta en el layout raíz, así que aparece en cualquier pantalla; se oculta
// solo cuando no hay sesión.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';

const fechaCorta = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const hoy = new Date();
    const mismoDia = d.toDateString() === hoy.toDateString();
    return mismoDia
        ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

export default function NotasFlotantes() {
    const { user } = useAuth();
    const empresaId = user?.empresaId;

    const [abierto, setAbierto] = useState(false);
    const [notas, setNotas] = useState([]);
    const [borrador, setBorrador] = useState('');
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const areaRef = useRef(null);

    const cargar = useCallback(async () => {
        if (!empresaId) return;
        setCargando(true);
        setError(null);
        try {
            const r = await authFetch(`/api/notas?empresaId=${encodeURIComponent(empresaId)}`);
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudieron cargar las notas');
            setNotas(d.notas || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [empresaId]);

    // Se cargan al abrir, no al montar: así no se pide nada en cada pantalla
    // hasta que realmente quieras ver las notas.
    useEffect(() => {
        if (abierto) {
            cargar();
            // El foco va directo a la nota nueva: pulsar el icono es empezar a escribir.
            setTimeout(() => areaRef.current?.focus(), 60);
        }
    }, [abierto, cargar]);

    // Escape cierra el panel.
    useEffect(() => {
        if (!abierto) return;
        const alPulsar = (e) => { if (e.key === 'Escape') setAbierto(false); };
        window.addEventListener('keydown', alPulsar);
        return () => window.removeEventListener('keydown', alPulsar);
    }, [abierto]);

    const guardar = async () => {
        const texto = borrador.trim();
        if (!texto || !empresaId) return;
        setGuardando(true);
        setError(null);
        try {
            const r = await authFetch('/api/notas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresaId, texto }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudo guardar');
            setNotas((prev) => [d, ...prev]);
            setBorrador('');
            areaRef.current?.focus();
        } catch (e) {
            setError(e.message);
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta nota?')) return;
        const copia = notas;
        setNotas((prev) => prev.filter((n) => n.id !== id)); // optimista
        try {
            const r = await authFetch(`/api/notas?empresaId=${encodeURIComponent(empresaId)}&id=${id}`, { method: 'DELETE' });
            if (!r.ok) throw new Error();
        } catch {
            setNotas(copia); // si falla, se restaura
            setError('No se pudo eliminar la nota');
        }
    };

    // Ctrl+Enter guarda sin levantar las manos del teclado.
    const alTeclear = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); guardar(); }
    };

    if (!empresaId) return null;

    return (
        <>
            <button
                type="button"
                className="notas-boton"
                onClick={() => setAbierto((v) => !v)}
                title="Notas rápidas — apunta una idea"
                aria-label="Notas rápidas"
                aria-expanded={abierto}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5z" />
                    <path d="M15 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M9 12h6" /><path d="M9 16h4" />
                </svg>
                {notas.length > 0 && !abierto && <span className="notas-boton__contador">{notas.length}</span>}
            </button>

            {abierto && (
                <div className="notas-panel" role="dialog" aria-label="Notas rápidas">
                    <header className="notas-panel__cabecera">
                        <span>Notas rápidas</span>
                        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar">✕</button>
                    </header>

                    <div className="notas-panel__nueva">
                        <textarea
                            ref={areaRef}
                            value={borrador}
                            onChange={(e) => setBorrador(e.target.value)}
                            onKeyDown={alTeclear}
                            placeholder="Escribe una idea…"
                            rows={3}
                        />
                        <div className="notas-panel__acciones">
                            <span className="notas-panel__pista">Ctrl + Enter para guardar</span>
                            <button type="button" onClick={guardar} disabled={guardando || !borrador.trim()}>
                                {guardando ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="notas-panel__error">{error}</p>}

                    <div className="notas-panel__lista">
                        {cargando && <p className="notas-panel__vacio">Cargando…</p>}
                        {!cargando && notas.length === 0 && (
                            <p className="notas-panel__vacio">Aún no hay notas. La primera que escribas aparecerá aquí.</p>
                        )}
                        {notas.map((n) => (
                            <article key={n.id} className="notas-nota">
                                <p>{n.texto}</p>
                                <footer>
                                    <span>{fechaCorta(n.actualizadaEn || n.creadaEn)}</span>
                                    <button type="button" onClick={() => eliminar(n.id)} title="Eliminar nota">Eliminar</button>
                                </footer>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
