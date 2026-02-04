'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Settings() {
    const [companyProfiles, setCompanyProfiles] = useState([]);
    const [clientProfiles, setClientProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyFormData, setCompanyFormData] = useState({
        name: '',
        address: '',
        email: '',
        phone: '',
        ruc: '',
        website: '',
        accounts: [],
        conditions: '',
        isDefault: false
    });

    // Bank list
    const BANKS = [
        'BCP',
        'BBVA',
        'Interbank',
        'Scotiabank',
        'Banco de la Nación',
        'BanBif',
        'Pichincha',
        'Caja Arequipa',
        'Caja Piura',
        'Otros'
    ];
    const [clientFormData, setClientFormData] = useState({
        name: '',
        ruc: '',
        address: '',
        isDefault: false
    });
    const [generalConditions, setGeneralConditions] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [editingCompanyId, setEditingCompanyId] = useState(null);
    const [editingClientId, setEditingClientId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchCompanyProfiles();
        fetchClientProfiles();
    }, []);

    const fetchCompanyProfiles = async () => {
        try {
            const res = await fetch('/api/company-profiles');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCompanyProfiles(data);
            } else {
                console.error('API Error (Company Profiles):', data.error);
                setCompanyProfiles([]);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchClientProfiles = async () => {
        try {
            const res = await fetch('/api/client-profiles');
            const data = await res.json();
            if (Array.isArray(data)) {
                setClientProfiles(data);
            } else {
                console.error('API Error (Client Profiles):', data.error);
                setClientProfiles([]);
            }
        } catch (err) {
            console.error(err);
        }
    };



    const handleCompanySubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCompanyId ? `/api/company-profiles/${editingCompanyId}` : '/api/company-profiles';
            const method = editingCompanyId ? 'PUT' : 'POST';
            const data = new FormData();
            data.append('name', companyFormData.name);
            data.append('address', companyFormData.address);
            data.append('email', companyFormData.email);
            data.append('phone', companyFormData.phone);
            data.append('phone', companyFormData.phone);
            data.append('ruc', companyFormData.ruc);
            data.append('website', companyFormData.website);
            data.append('accounts', JSON.stringify(companyFormData.accounts));
            data.append('conditions', companyFormData.conditions);
            data.append('isDefault', companyFormData.isDefault.toString());
            if (logoFile) {
                data.append('logo', logoFile);
            }
            if (editingCompanyId) {
                data.append('existingLogoUrl', companyFormData.logoUrl || '');
            }
            const res = await fetch(url, {
                method,
                body: data
            });
            if (res.ok) {
                setCompanyFormData({ name: '', address: '', email: '', phone: '', ruc: '', website: '', accounts: [], conditions: '', isDefault: false });
                setLogoFile(null);
                setEditingCompanyId(null);
                fetchCompanyProfiles();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddAccount = () => {
        setCompanyFormData({
            ...companyFormData,
            accounts: [...companyFormData.accounts, { bankName: '', accountNumber: '', cci: '' }]
        });
    };

    const handleRemoveAccount = (index) => {
        const newAccounts = [...companyFormData.accounts];
        newAccounts.splice(index, 1);
        setCompanyFormData({
            ...companyFormData,
            accounts: newAccounts
        });
    };

    const handleAccountChange = (index, field, value) => {
        const newAccounts = [...companyFormData.accounts];
        newAccounts[index][field] = value;
        setCompanyFormData({
            ...companyFormData,
            accounts: newAccounts
        });
    };

    const handleClientSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingClientId ? `/api/client-profiles/${editingClientId}` : '/api/client-profiles';
            const method = editingClientId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientFormData)
            });
            if (res.ok) {
                setClientFormData({ name: '', address: '', email: '', phone: '', isDefault: false });
                setEditingClientId(null);
                fetchClientProfiles();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompanyEdit = (profile) => {
        setCompanyFormData({
            name: profile.name,
            address: profile.address,
            email: profile.email,
            phone: profile.phone,
            ruc: profile.ruc || '',
            website: profile.website || '',
            accounts: profile.accounts || [],
            conditions: profile.conditions || '',
            logoUrl: profile.logoUrl,
            isDefault: profile.isDefault === 1
        });
        setLogoFile(null); // Reset file input
        setEditingCompanyId(profile.id);
    };

    const handleClientEdit = (profile) => {
        setClientFormData({
            name: profile.name,
            ruc: profile.ruc,
            address: profile.address,
            isDefault: profile.isDefault === 1
        });
        setEditingClientId(profile.id);
    };

    const handleCompanyDelete = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este perfil de empresa?')) {
            try {
                await fetch(`/api/company-profiles/${id}`, { method: 'DELETE' });
                fetchCompanyProfiles();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleClientDelete = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este perfil de cliente?')) {
            try {
                await fetch(`/api/client-profiles/${id}`, { method: 'DELETE' });
                fetchClientProfiles();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCompanyCancel = () => {
        setCompanyFormData({ name: '', address: '', email: '', phone: '', ruc: '', website: '', accounts: [], conditions: '', isDefault: false });
        setLogoFile(null);
        setEditingCompanyId(null);
    };

    return (
        <main className="container">
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => router.push('/')} className="btn" style={{ marginBottom: '1rem', background: '#4b5563', color: 'white' }}>
                    Volver al Dashboard
                </button>
                <h1 style={{ color: '#111827' }}>Configuración de Empresa</h1>
                <p style={{ color: '#475569' }}>Administra los datos de tu empresa para las cotizaciones.</p>
            </div>

            <div className="content-frame">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                    <div>
                        <h2 style={{ color: '#101828', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Perfiles de Empresa</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                            <div className="card">
                                <h3>{editingCompanyId ? 'Editar Perfil de Empresa' : 'Añadir Nuevo Perfil de Empresa'}</h3>
                                <form onSubmit={handleCompanySubmit} style={{ marginTop: '2rem' }}>
                                    <div className="input-group">
                                        <label className="label">Nombre de Empresa</label>
                                        <input
                                            className="input"
                                            type="text"
                                            required
                                            value={companyFormData.name}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                                            placeholder="Ej: Mi Empresa S.A."
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="input-group">
                                            <label className="label">RUC</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={companyFormData.ruc}
                                                onChange={(e) => setCompanyFormData({ ...companyFormData, ruc: e.target.value })}
                                                placeholder="20123456789"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Sitio Web</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={companyFormData.website}
                                                onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                                                placeholder="www.miempresa.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Cuentas Bancarias</label>
                                        {companyFormData.accounts.map((acc, index) => (
                                            <div key={index} style={{ marginBottom: '1.25rem', padding: '1.75rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '20px' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                    <select
                                                        className="input"
                                                        value={acc.bankName}
                                                        onChange={(e) => handleAccountChange(index, 'bankName', e.target.value)}
                                                        style={{ flex: 1 }}
                                                    >
                                                        <option value="">Seleccionar Banco</option>
                                                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-danger" style={{ padding: '0 14px' }} onClick={() => handleRemoveAccount(index)}>
                                                        ✕
                                                    </button>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                    <input
                                                        className="input"
                                                        type="text"
                                                        value={acc.accountNumber}
                                                        onChange={(e) => handleAccountChange(index, 'accountNumber', e.target.value)}
                                                        placeholder="Nº de Cuenta"
                                                    />
                                                    <input
                                                        className="input"
                                                        type="text"
                                                        value={acc.cci}
                                                        onChange={(e) => handleAccountChange(index, 'cci', e.target.value)}
                                                        placeholder="CCI (Opcional)"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem' }} onClick={handleAddAccount}>
                                            + Agregar Cuenta Bancaria
                                        </button>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Dirección</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={companyFormData.address}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                                            placeholder="Calle Falsa 123"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="input-group">
                                            <label className="label">Email</label>
                                            <input
                                                className="input"
                                                type="email"
                                                value={companyFormData.email}
                                                onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                                                placeholder="contacto@empresa.com"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Teléfono</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={companyFormData.phone}
                                                onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                                                placeholder="+51 987 654 321"
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Logo de Empresa</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            <input
                                                id="company-logo-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setLogoFile(e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => document.getElementById('company-logo-upload').click()}
                                            >
                                                {logoFile ? logoFile.name : 'Seleccionar Archivo'}
                                            </button>
                                            {editingCompanyId && companyFormData.logoUrl && (
                                                <img src={companyFormData.logoUrl} alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '14px', border: '1px solid #f1f5f9' }} />
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="checkbox"
                                            id="companyIsDefault"
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            checked={companyFormData.isDefault}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, isDefault: e.target.checked })}
                                        />
                                        <label htmlFor="companyIsDefault" style={{ cursor: 'pointer', fontWeight: '500', color: '#64748b' }}>Establecer como predeterminado</label>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Condiciones Generales</label>
                                        <textarea
                                            className="input"
                                            rows={5}
                                            value={companyFormData.conditions}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, conditions: e.target.value })}
                                            placeholder="Ingrese los términos y condiciones..."
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                            {editingCompanyId ? 'Actualizar Perfil' : 'Guardar Perfil'}
                                        </button>
                                        {editingCompanyId && (
                                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCompanyCancel}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1.5rem' }}>Perfiles Registrados</h3>
                                {loading ? (
                                    <p>Cargando...</p>
                                ) : companyProfiles.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>No hay perfiles configurados.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {companyProfiles.map((p) => (
                                            <div key={p.id} className="card" style={{ padding: '1.75rem', border: p.isDefault ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                        {p.logoUrl && (
                                                            <img src={p.logoUrl} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                                                        )}
                                                        <div>
                                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name || 'Sin Nombre'}</h4>
                                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>{p.ruc || 'Sin RUC'}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '1rem' }}>
                                                        {p.isDefault && (
                                                            <span className="status-badge" style={{ background: '#1e293b', color: 'white' }}>
                                                                Default
                                                            </span>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleCompanyEdit(p)}>
                                                                Editar
                                                            </button>
                                                            <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleCompanyDelete(p.id)}>
                                                                Borrar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '4rem' }}>
                        <h2 style={{ color: '#101828', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Perfiles de Cliente</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                            <div className="card">
                                <h3>{editingClientId ? 'Editar Perfil de Cliente' : 'Añadir Nuevo Cliente'}</h3>
                                <form onSubmit={handleClientSubmit} style={{ marginTop: '2rem' }}>
                                    <div className="input-group">
                                        <label className="label">Nombre de Cliente</label>
                                        <input
                                            className="input"
                                            type="text"
                                            required
                                            value={clientFormData.name}
                                            onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">RUC / DNI</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={clientFormData.ruc}
                                            onChange={(e) => setClientFormData({ ...clientFormData, ruc: e.target.value })}
                                            placeholder="12345678901"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Dirección</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={clientFormData.address}
                                            onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                                            placeholder="Calle Falsa 123"
                                        />
                                    </div>
                                    <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="checkbox"
                                            id="clientIsDefault"
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            checked={clientFormData.isDefault}
                                            onChange={(e) => setClientFormData({ ...clientFormData, isDefault: e.target.checked })}
                                        />
                                        <label htmlFor="clientIsDefault" style={{ cursor: 'pointer', fontWeight: '500', color: '#64748b' }}>Establecer como predeterminado</label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                            {editingClientId ? 'Actualizar Perfil' : 'Guardar Perfil'}
                                        </button>
                                        {editingClientId && (
                                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingClientId(null)}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1.5rem' }}>Clientes Registrados</h3>
                                {clientProfiles.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>No hay perfiles configurados.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {clientProfiles.map((p) => (
                                            <div key={p.id} className="card" style={{ padding: '1.75rem', border: p.isDefault ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name || 'Sin Nombre'}</h4>
                                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>{p.address || 'Sin Dirección'}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '1rem' }}>
                                                        {p.isDefault && (
                                                            <span className="status-badge" style={{ background: '#1e293b', color: 'white' }}>
                                                                Default
                                                            </span>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleClientEdit(p)}>
                                                                Editar
                                                            </button>
                                                            <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleClientDelete(p.id)}>
                                                                Borrar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    );
}
