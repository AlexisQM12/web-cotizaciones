'use client'
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, onClose }) {
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        const html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1.0 },
            false
        );
        
        html5QrcodeScanner.render((decodedText, decodedResult) => {
            onScan(decodedText);
            html5QrcodeScanner.clear();
            onClose();
        }, (error) => {
            // parse error, ignore
        });

        setScanner(html5QrcodeScanner);

        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [onScan, onClose]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#0f172a' }}>Escanear Código</h3>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>
                <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '1rem' }}>Apunta la cámara al código de barras o QR.</p>
            </div>
        </div>
    );
}
