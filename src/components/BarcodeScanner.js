'use client'
import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, onClose }) {
    const [isStarting, setIsStarting] = useState(true);

    useEffect(() => {
        let html5QrCode;
        try {
            html5QrCode = new Html5Qrcode("reader");
        } catch(e) {
            console.error("Error creating Html5Qrcode", e);
            return;
        }
        
        html5QrCode.start(
            { facingMode: "environment" }, 
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            (decodedText) => {
                onScan(decodedText);
                html5QrCode.stop().then(() => onClose()).catch(console.error);
            },
            (errorMessage) => {
                // parse error, ignore
            }
        ).then(() => {
            setIsStarting(false);
        }).catch((err) => {
            console.error("Camera start error", err);
            // Fallback a cualquier camara si 'environment' falla
            html5QrCode.start(
                { facingMode: "user" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    onScan(decodedText);
                    html5QrCode.stop().then(() => onClose()).catch(console.error);
                },
                () => {}
            ).then(() => setIsStarting(false)).catch(e => {
                console.error("Fallback camera failed", e);
                setIsStarting(false);
            });
        });

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
            }
        };
    }, [onScan, onClose]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 600 }}>Escanear Código</h3>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>
                <div style={{ position: 'relative', width: '100%', minHeight: '250px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isStarting && <span style={{ color: '#64748b', position: 'absolute', zIndex: 10 }}>Iniciando cámara...</span>}
                    <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                </div>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '1rem' }}>
                    Apunta la cámara trasera al código de barras o QR para escanearlo automáticamente.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar Escaneo</button>
                </div>
            </div>
        </div>
    );
}
