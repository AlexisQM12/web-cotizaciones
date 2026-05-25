'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { storage } from '@/lib/firebaseConfig'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

export default function ProjectDocumentation({ params }) {
    const router = useRouter();
    const [id, setId] = useState(null);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Unwrap params in Next 15+
        Promise.resolve(params).then(p => {
            setId(p.id);
        });
    }, [params]);

    useEffect(() => {
        if (!id) return;
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/quotations/${id}`);
            if (!res.ok) throw new Error('Project not found');
            const data = await res.json();
            setProject(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const newDocs = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const storageRef = ref(storage, `project-documents/${id}/${Date.now()}_${file.name}`);
                
                // Track progress of the first file for UI simplicity, or aggregate
                const uploadTask = uploadBytesResumable(storageRef, file);
                
                const url = await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', 
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(Math.round(progress));
                        },
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });

                newDocs.push({
                    name: file.name,
                    url,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                });
            }

            // Update database
            const currentDocs = project.projectDocuments || [];
            const updatedDocs = [...currentDocs, ...newDocs];

            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectDocuments: updatedDocs })
            });

            // Refresh UI
            await fetchProject();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Error al subir archivos. Por favor, intenta de nuevo.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (docIndex, fileUrl) => {
        if (!confirm('¿Seguro que deseas eliminar este archivo?')) return;
        
        try {
            // Delete from Storage
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef).catch(e => console.warn('File already deleted from storage or access denied', e));

            // Remove from array
            const updatedDocs = [...project.projectDocuments];
            updatedDocs.splice(docIndex, 1);

            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectDocuments: updatedDocs })
            });

            await fetchProject();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Error al eliminar el archivo.');
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#101828' }}>Cargando proyecto...</div>
                ) : !project ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#dc2626' }}>Proyecto no encontrado</div>
                ) : (
                    <>
                        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="dashboard-title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <button onClick={() => router.push('/projects')} className="btn-back-square" title="Volver a Proyectos">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', lineHeight: '1.2' }}>
                                        {project.code || 'SIN CÓDIGO'}
                                        <span style={{ fontSize: '1rem', fontWeight: '500', background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.75rem', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
                                            {project.clientName}
                                        </span>
                                    </h1>
                                    <p style={{ maxWidth: '800px' }}>{project.serviceDescription || 'Sin descripción de servicio'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid-2-col" style={{ gap: '2rem', alignItems: 'flex-start' }}>
                            {/* Panel Izquierdo: Lista de archivos */}
                            <div className="card" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', color: '#101828' }}>Archivos del Proyecto</h3>
                                    <span style={{ background: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                                        {project.projectDocuments?.length || 0}
                                    </span>
                                </div>

                                {!project.projectDocuments || project.projectDocuments.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto' }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Aún no hay documentos subidos para este proyecto.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {project.projectDocuments.map((doc, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
                                                {/* Icono según tipo */}
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: doc.type.includes('pdf') ? '#fee2e2' : doc.type.includes('image') ? '#dbeafe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {doc.type.includes('pdf') ? (
                                                        <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '0.7rem' }}>PDF</span>
                                                    ) : doc.type.includes('image') ? (
                                                        <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '0.7rem' }}>IMG</span>
                                                    ) : (
                                                        <span style={{ color: '#4b5563', fontWeight: 'bold', fontSize: '0.7rem' }}>FILE</span>
                                                    )}
                                                </div>
                                                
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {doc.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                                        {formatBytes(doc.size)} • Subido el {new Date(doc.uploadedAt).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                        Ver
                                                    </a>
                                                    <button onClick={() => handleDelete(idx, doc.url)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                                                        Borrar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Panel Derecho: Subida de archivos */}
                            <div className="card" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
                                <h3 style={{ fontSize: '1.25rem', color: '#101828', marginBottom: '1.5rem' }}>Subir Nuevos Archivos</h3>
                                
                                <div style={{ 
                                    border: '2px dashed #cbd5e1', 
                                    borderRadius: '12px', 
                                    padding: '3rem 2rem', 
                                    textAlign: 'center',
                                    background: '#f8fafc',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: uploading ? 0.7 : 1
                                }} onClick={() => !uploading && fileInputRef.current?.click()}>
                                    
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    
                                    <h4 style={{ color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        {uploading ? 'Subiendo archivos...' : 'Haz clic o arrastra archivos aquí'}
                                    </h4>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                        Soporta PDF, imágenes (JPG, PNG), RAR, ZIP.
                                    </p>

                                    <input 
                                        type="file" 
                                        multiple 
                                        ref={fileInputRef} 
                                        onChange={handleFileSelect} 
                                        style={{ display: 'none' }}
                                        disabled={uploading}
                                    />
                                </div>

                                {uploading && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem' }}>
                                            <span>Progreso</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s' }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </ProtectedRoute>
    )
}
