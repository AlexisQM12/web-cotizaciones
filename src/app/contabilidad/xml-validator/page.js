'use client';
import { useState, useRef } from 'react';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';

export default function XMLValidatorPage() {
    const { config, loading: cfgLoading } = useAccountingConfig();
    const [file, setFile] = useState(null);
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.name.endsWith('.xml')) {
            setFile(selected);
            setResult(null);
        } else if (selected) {
            alert('Por favor, sube un archivo XML válido.');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.xml')) {
            setFile(droppedFile);
            setResult(null);
        } else {
            alert('Por favor, sube un archivo XML válido.');
        }
    };

    const validateXML = async () => {
        if (!file) return;
        setValidating(true);
        setResult(null);

        // Simulamos la llamada a SUNAT
        setTimeout(() => {
            setValidating(false);
            
            // Lógica simulada: Si el nombre del archivo contiene "error", lo marcamos como inválido
            if (file.name.toLowerCase().includes('error') || file.name.toLowerCase().includes('falso')) {
                setResult({
                    isValid: false,
                    message: 'El comprobante NO existe o fue RECHAZADO por SUNAT.',
                    details: 'Error código 1033: El comprobante electrónico no cumple con las validaciones de estructura o no ha sido enviado al servidor de la SUNAT.',
                    data: null
                });
            } else {
                setResult({
                    isValid: true,
                    message: 'El comprobante existe y está ACEPTADO por SUNAT.',
                    details: 'El XML cumple con el estándar UBL 2.1 y la firma digital es válida.',
                    data: {
                        rucEmisor: '201000' + Math.floor(Math.random() * 90000 + 10000),
                        tipoDocumento: '01 (Factura Electrónica)',
                        serieNumero: 'F001-' + Math.floor(Math.random() * 9000 + 1000),
                        fechaEmision: new Date().toISOString().split('T')[0],
                        total: 'S/ ' + (Math.random() * 5000 + 100).toFixed(2)
                    }
                });
            }
        }, 1500);
    };

    if (cfgLoading || !config) return <AccountingShell><p>Cargando...</p></AccountingShell>;

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon name="shield-check" size={26} />
                        Validador de Comprobantes XML
                        <span style={{ fontSize: '0.75rem', background: '#f59e0b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            MODO PRUEBAS
                        </span>
                    </h1>
                    <p className="acc-page-subtitle" style={{ margin: 0, marginTop: '0.25rem' }}>
                        Sube el XML de una factura electrónica para verificar si es válida y aceptada en SUNAT.
                    </p>
                </div>
            </div>

            <div className="acc-card" style={{ marginTop: '1.5rem', maxWidth: '800px', margin: '1.5rem auto' }}>
                
                <div 
                    style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginBottom: '1.5rem'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".xml" 
                        style={{ display: 'none' }} 
                    />
                    
                    <Icon name="doc-up" size={48} />
                    <h3 style={{ marginTop: '1rem', color: '#334155' }}>
                        {file ? file.name : 'Arrastra un archivo XML aquí o haz clic para subir'}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Solo se aceptan archivos .xml
                    </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={validateXML} 
                        disabled={!file || validating}
                        style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                    >
                        {validating ? (
                            <>
                                <Icon name="refresh" size={18} className="spin" /> 
                                Validando con SUNAT...
                            </>
                        ) : (
                            <>
                                <Icon name="shield-check" size={18} /> 
                                Validar Comprobante
                            </>
                        )}
                    </button>
                </div>

                {result && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: `1px solid ${result.isValid ? '#bbf7d0' : '#fecaca'}`,
                        background: result.isValid ? '#f0fdf4' : '#fef2f2'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Icon name={result.isValid ? 'check' : 'alert'} size={24} />
                            <h3 style={{ margin: 0, color: result.isValid ? '#166534' : '#991b1b' }}>
                                {result.message}
                            </h3>
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1rem' }}>
                            {result.details}
                        </p>

                        {result.data && (
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Emisor</span>
                                        <div style={{ fontWeight: '500' }}>{result.data.rucEmisor}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Documento</span>
                                        <div style={{ fontWeight: '500' }}>{result.data.tipoDocumento}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Serie y Número</span>
                                        <div style={{ fontWeight: '500' }}>{result.data.serieNumero}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total</span>
                                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{result.data.total}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AccountingShell>
    );
}
