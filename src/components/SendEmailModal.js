import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function SendEmailModal({ isOpen, onClose, quotation, onSent }) {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [aliases, setAliases] = useState([]);
    const [template, setTemplate] = useState('');
    
    const [formData, setFormData] = useState({
        fromAlias: '',
        toEmail: '',
        subject: '',
        message: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !user?.empresaId || !quotation) return;

        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch email settings
                const settingsRes = await fetch(`/api/settings/email?empresaId=${user.empresaId}`);
                const settings = await settingsRes.json();
                
                // Fetch clients portfolio
                const clientsRes = await fetch(`/api/clients?empresaId=${user.empresaId}`);
                const clientsData = await clientsRes.json();
                
                if (settingsRes.ok) {
                    setAliases(settings.senderAliases || []);
                    setTemplate(settings.defaultTemplate || '');
                    
                    setFormData(prev => ({
                        ...prev,
                        fromAlias: settings.senderAliases?.[0] || '',
                        subject: `Cotización ${quotation.code || ''} - ${user.empresaId}`, // Simplified subject
                        message: settings.defaultTemplate || ''
                    }));
                }
                
                if (clientsRes.ok && Array.isArray(clientsData)) {
                    // Flatten contacts from all companies
                    const flatContacts = [];
                    clientsData.forEach(comp => {
                        (comp.contacts || []).forEach(contact => {
                            flatContacts.push({
                                ...contact,
                                company: comp.companyName
                            });
                        });
                    });
                    setClients(flatContacts);
                    
                    // Try to pre-select client if email matches or name matches
                    const matchedClient = flatContacts.find(c => 
                        c.company?.toLowerCase() === (quotation.clientName || '').toLowerCase()
                    );
                    if (matchedClient && matchedClient.email) {
                        setFormData(prev => ({ ...prev, toEmail: matchedClient.email }));
                    }
                }
            } catch (err) {
                console.error('Error fetching data for email modal:', err);
                setError('Error al cargar la configuración. Asegúrate de haber configurado tu correo en Settings.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [isOpen, user?.empresaId, quotation]);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');

        if (!formData.fromAlias || !formData.toEmail) {
            setError('Faltan datos obligatorios (Remitente o Destinatario).');
            setSending(false);
            return;
        }

        try {
            // Generar PDF en el cliente (igual que en descarga)
            const resData = await fetch(`/api/quotations/${quotation.id}?empresaId=${encodeURIComponent(user.empresaId)}`);
            const fullData = await resData.json();

            const company = fullData.companyProfiles?.find(p => String(p.id) === String(fullData.companyProfileId))
                || fullData.companyProfiles?.find(p => p.isDefault) || {};
            const client = fullData.clientProfiles?.find(p => String(p.id) === String(fullData.clientProfileId))
                || fullData.clientProfiles?.find(p => p.isDefault) || {};
            const items = fullData.items || [];
            const total = items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);

            const dataForPdf = {
                ...fullData,
                total,
                company,
                clientName: client.name || fullData.clientName || '',
                clientRuc: client.ruc || fullData.clientRuc || '',
                clientAddress: client.address || fullData.clientAddress || '',
                notes: (fullData.notes !== undefined && fullData.notes !== null && fullData.notes !== '')
                    ? fullData.notes
                    : (company.conditions || fullData.generalConditions?.text || '')
            };

            const { pdf } = await import('@react-pdf/renderer');
            const { QuotationDocument } = await import('@/components/QuotationDocument');
            
            const blob = await pdf(<QuotationDocument data={dataForPdf} />).toBlob();
            
            // Enviar datos y archivo PDF al backend
            const formDataReq = new FormData();
            formDataReq.append('empresaId', user.empresaId);
            formDataReq.append('quotationId', quotation.id);
            formDataReq.append('fromAlias', formData.fromAlias);
            formDataReq.append('toEmail', formData.toEmail);
            formDataReq.append('subject', formData.subject);
            formDataReq.append('message', formData.message);
            formDataReq.append('pdfFile', blob, `${fullData.code || 'cotizacion'}.pdf`);

            const res = await fetch(`/api/quotations/send-email`, {
                method: 'POST',
                body: formDataReq
            });

            const result = await res.json();

            if (res.ok) {
                if (onSent) onSent(quotation.id);
                onClose();
            } else {
                setError(result.error || 'Error al enviar el correo.');
            }
        } catch (err) {
            console.error('Error sending email:', err);
            setError('Error de conexión al intentar enviar el correo.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Enviar Cotización al Cliente</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                            {quotation?.code || 'Borrador'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}>✕</button>
                </div>
                
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando configuración...</div>
                ) : (
                    <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        
                        {aliases.length === 0 && (
                            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                No tienes remitentes (alias) configurados. Por favor, ve a Configuración para añadirlos.
                            </div>
                        )}

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>De (Remitente)</label>
                            <select 
                                required 
                                value={formData.fromAlias} 
                                onChange={e => setFormData({...formData, fromAlias: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', background: '#f8fafc' }}
                            >
                                <option value="" disabled>Selecciona un remitente...</option>
                                {aliases.map((alias, idx) => (
                                    <option key={idx} value={alias}>{alias}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Para (Cliente)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select 
                                    value={formData.toEmail}
                                    onChange={e => setFormData({...formData, toEmail: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', flex: 1 }}
                                >
                                    <option value="">Seleccionar desde directorio...</option>
                                    {clients.filter(c => c.email).map(c => (
                                        <option key={c.id} value={c.email}>{c.company} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <input 
                                    required 
                                    type="email" 
                                    value={formData.toEmail} 
                                    onChange={e => setFormData({...formData, toEmail: e.target.value})}
                                    placeholder="O escribe un correo manualmente: cliente@ejemplo.com"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Asunto</label>
                            <input 
                                required 
                                type="text" 
                                value={formData.subject} 
                                onChange={e => setFormData({...formData, subject: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Mensaje</label>
                            <textarea 
                                required 
                                rows={6}
                                value={formData.message} 
                                onChange={e => setFormData({...formData, message: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit' }}
                            />
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '500' }}>{error}</div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                            <button type="button" onClick={onClose} disabled={sending} style={{ background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={sending || aliases.length === 0} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: (sending || aliases.length===0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (sending || aliases.length===0) ? 0.7 : 1 }}>
                                {sending ? 'Enviando...' : 'Enviar Cotización (PDF)'}
                                {!sending && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
