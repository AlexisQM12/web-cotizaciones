'use client';

import { useEffect, useState } from 'react';

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    useEffect(() => {
        // Registrar Service Worker (necesario para PWA)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('Service Worker registration failed: ', err);
            });
        }

        // Detectar si el navegador permite la instalación
        const handleBeforeInstallPrompt = (e) => {
            // Evitar que Chrome muestre el mini-infobar por defecto
            e.preventDefault();
            // Guardar el evento para poder llamarlo luego
            setDeferredPrompt(e);
            // Mostrar nuestro propio aviso estilo web
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detectar si la app ya fue instalada para ocultar el aviso
        window.addEventListener('appinstalled', () => {
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
            console.log('PWA fue instalada exitosamente');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        // Mostrar el prompt nativo
        deferredPrompt.prompt();
        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallPrompt(false);
        }
        setDeferredPrompt(null);
    };

    if (!showInstallPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '1.2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 9999,
            width: '90%',
            maxWidth: '350px',
            border: '1px solid #e2e8f0'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%' }}>
                <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/icono-cgo.png" alt="CGO Pymes Icon" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem' }}>Instalar CGO Pymes</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', marginTop: '0.1rem' }}>Acceso rápido y mejor experiencia</p>
                </div>
                <button 
                    onClick={() => setShowInstallPrompt(false)} 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem' }}
                >
                    ✕
                </button>
            </div>
            
            <button 
                onClick={handleInstallClick}
                style={{ 
                    width: '100%', 
                    background: '#c6003d', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.6rem', 
                    borderRadius: '6px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}
            >
                Instalar Aplicación
            </button>
        </div>
    );
}
