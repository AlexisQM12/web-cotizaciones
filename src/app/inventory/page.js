'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'
import BarcodeScanner from '@/components/BarcodeScanner'
import { storage } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function InventoryDashboard() {
    const { user } = useAuth()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        stock: '',
        minStock: '',
        unit: 'Unidades',
        cost: '',
        imageUrl: ''
    })
    const [selectedImage, setSelectedImage] = useState(null)
    const [showScanner, setShowScanner] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (user) {
            fetchInventory()
        }
    }, [user])

    const fetchInventory = async () => {
        setLoading(true)
        try {
            const url = user?.empresaId ? `/api/inventory?empresaId=${user.empresaId}` : '/api/inventory';
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) {
                setItems(data)
            }
        } catch (error) {
            console.error('Error fetching inventory:', error)
        }
        setLoading(false)
    }

    const handleOpenModal = (item = null) => {
        setSelectedImage(null)
        if (item) {
            setEditingItem(item)
            setFormData({
                name: item.name || '',
                sku: item.sku || '',
                category: item.category || '',
                stock: item.stock || 0,
                minStock: item.minStock || 0,
                unit: item.unit || 'Unidades',
                cost: item.cost || 0,
                imageUrl: item.imageUrl || ''
            })
        } else {
            setEditingItem(null)
            setFormData({
                name: '',
                sku: '',
                category: '',
                stock: '',
                minStock: '',
                unit: 'Unidades',
                cost: '',
                imageUrl: ''
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingItem(null)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            let finalImageUrl = formData.imageUrl;
            
            if (selectedImage) {
                const imgRef = ref(storage, `inventory/${Date.now()}_${selectedImage.name}`);
                const snapshot = await uploadBytes(imgRef, selectedImage);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            }

            const payload = { ...formData, imageUrl: finalImageUrl, empresaId: user?.empresaId || null };
            if (editingItem) {
                await fetch(`/api/inventory/${editingItem.id}?empresaId=${user?.empresaId || ''}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } else {
                await fetch('/api/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }
            handleCloseModal()
            fetchInventory()
        } catch (error) {
            console.error('Error saving item:', error)
            alert('Error al guardar el ítem.')
        }
        setIsSaving(false)
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este ítem del inventario?')) return;
        try {
            await fetch(`/api/inventory/${id}?empresaId=${user?.empresaId || ''}`, {
                method: 'DELETE'
            })
            fetchInventory()
        } catch (error) {
            console.error('Error deleting item:', error)
        }
    }

    // Derived Statistics
    const totalItems = items.length;
    const totalValue = items.reduce((acc, item) => acc + (Number(item.stock) * Number(item.cost)), 0);
    const lowStockItems = items.filter(item => Number(item.stock) <= Number(item.minStock));
    const lowStockPercentage = totalItems > 0 ? (lowStockItems.length / totalItems) * 100 : 0;

    const uniqueCategories = useMemo(() => {
        const cats = new Set(items.map(i => i.category).filter(Boolean));
        return Array.from(cats);
    }, [items]);

    const filteredItems = items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = categoryFilter === '' || item.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const getStockStatusColor = (stock, minStock) => {
        const s = Number(stock);
        const m = Number(minStock);
        if (s <= 0) return '#ef4444'; // Red (Out of stock)
        if (s <= m) return '#f59e0b'; // Yellow/Orange (Low stock)
        return '#10b981'; // Green (Healthy stock)
    }

    const getStockStatusLabel = (stock, minStock) => {
        const s = Number(stock);
        const m = Number(minStock);
        if (s <= 0) return 'Agotado';
        if (s <= m) return 'Bajo';
        return 'Normal';
    }

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <div className="dashboard-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="dashboard-title-area">
                        <h1>Inventario</h1>
                        <p>Control de stock, ingresos, salidas y valorización de materiales.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nuevo Ítem
                    </button>
                </div>

                {/* KPI Dashboard */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* KPI 1: Total Items */}
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: '#eff6ff', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Ítems</p>
                            <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>{totalItems}</h3>
                        </div>
                    </div>

                    {/* KPI 2: Valor del Inventario */}
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: '#ecfdf5', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor Estimado</p>
                            <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>S/ {totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </div>

                    {/* KPI 3: Alerta de Stock */}
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: '#fef2f2', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Bajo o Agotado</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>{lowStockItems.length}</h3>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>ítems</span>
                            </div>
                            <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(lowStockPercentage, 100)}%`, background: '#ef4444', height: '100%', transition: 'width 0.5s ease' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="content-frame main-content-frame" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: '1 1 300px' }}>
                            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre o SKU..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Filtrar por Categoría:</label>
                            <select 
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                            >
                                <option value="">Todas</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Ítem</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Categoría</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Stock</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Costo Unit.</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Valor Total</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Cargando inventario...</td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No se encontraron registros de inventario.</td>
                                    </tr>
                                ) : (
                                    filteredItems.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                                                        {item.sku && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>SKU: {item.sku}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                                                    {item.category || 'Sin categoría'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <span style={{ 
                                                        width: '10px', height: '10px', borderRadius: '50%', 
                                                        background: getStockStatusColor(item.stock, item.minStock) 
                                                    }} title={getStockStatusLabel(item.stock, item.minStock)}></span>
                                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.stock}</span>
                                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{item.unit}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right', color: '#475569', fontWeight: 500 }}>
                                                S/ {Number(item.cost).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>
                                                S/ {(Number(item.stock) * Number(item.cost)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleOpenModal(item)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '0.75rem', padding: '0.25rem' }}
                                                    title="Editar"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                                                    title="Eliminar"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <div className="modal-content" style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                                    {editingItem ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}
                                </h3>
                                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    
                                    {/* Image Upload Area */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                                        { (selectedImage || formData.imageUrl) ? (
                                            <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1rem' }}>
                                                <img 
                                                    src={selectedImage ? URL.createObjectURL(selectedImage) : formData.imageUrl} 
                                                    alt="Preview" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e2e8f0' }} 
                                                />
                                                <button type="button" onClick={() => { setSelectedImage(null); setFormData(p => ({...p, imageUrl: ''})) }} style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                            </div>
                                        ) : (
                                            <div style={{ width: '120px', height: '120px', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            </div>
                                        )}
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#475569', borderColor: '#475569' }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                            Tomar / Subir Foto
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            accept="image/*"
                                            capture="environment"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSelectedImage(e.target.files[0])
                                                }
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Nombre del Material / Producto *</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            required 
                                            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>SKU / Código</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input 
                                                    type="text" 
                                                    name="sku" 
                                                    value={formData.sku} 
                                                    onChange={handleChange} 
                                                    placeholder="Ej. HER-001"
                                                    style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowScanner(true)}
                                                    style={{ padding: '0 0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#475569' }}
                                                    title="Escanear Código de Barras"
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10"></rect></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Categoría</label>
                                            <input 
                                                type="text" 
                                                name="category" 
                                                value={formData.category} 
                                                onChange={handleChange} 
                                                placeholder="Ej. Consumibles"
                                                list="category-suggestions"
                                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                                            />
                                            <datalist id="category-suggestions">
                                                {uniqueCategories.map(cat => (
                                                    <option key={cat} value={cat} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Stock Actual *</label>
                                            <input 
                                                type="number" 
                                                name="stock" 
                                                value={formData.stock} 
                                                onChange={handleChange} 
                                                required
                                                min="0"
                                                step="0.01"
                                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Stock Mín. *</label>
                                            <input 
                                                type="number" 
                                                name="minStock" 
                                                value={formData.minStock} 
                                                onChange={handleChange} 
                                                required
                                                min="0"
                                                step="0.01"
                                                title="Cantidad mínima para generar alerta"
                                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Unidad *</label>
                                            <select 
                                                name="unit" 
                                                value={formData.unit} 
                                                onChange={handleChange} 
                                                required
                                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff' }} 
                                            >
                                                <option value="Unidades">Unidades</option>
                                                <option value="Kg">Kg</option>
                                                <option value="Litros">Litros</option>
                                                <option value="Metros">Metros</option>
                                                <option value="Cajas">Cajas</option>
                                                <option value="Pares">Pares</option>
                                                <option value="Galones">Galones</option>
                                                <option value="Sacos">Sacos</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Costo Unitario Referencial (S/)</label>
                                        <input 
                                            type="number" 
                                            name="cost" 
                                            value={formData.cost} 
                                            onChange={handleChange} 
                                            min="0"
                                            step="0.01"
                                            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={handleCloseModal}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="btn btn-primary"
                                        style={{ cursor: isSaving ? 'not-allowed' : 'pointer' }}
                                    >
                                        {isSaving ? 'Guardando...' : (editingItem ? 'Actualizar Ítem' : 'Crear Ítem')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {showScanner && (
                    <BarcodeScanner 
                        onScan={(code) => setFormData(p => ({ ...p, sku: code }))} 
                        onClose={() => setShowScanner(false)} 
                    />
                )}
            </main>
        </ProtectedRoute>
    )
}
