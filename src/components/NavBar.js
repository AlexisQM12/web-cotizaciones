'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function NavBar() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [companyLogo, setCompanyLogo] = useState(null);
    const [companyName, setCompanyName] = useState('');

    useEffect(() => {
        if (!user?.empresaId) return;
        fetch(`/api/company-profiles/${user.empresaId}`)
            .then(r => r.json())
            .then(data => {
                if (data?.logoUrl) setCompanyLogo(data.logoUrl);
                if (data?.name) setCompanyName(data.name);
            })
            .catch(() => {});
    }, [user?.empresaId]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="navbar">
            {/* CGO System Logo + Company Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                    src="/icono-cgo.png"
                    alt="Logo CGO"
                    onClick={() => router.push('/')}
                    style={{
                        width: '38px',
                        height: '38px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        background: '#fff',
                        padding: '2px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />

                {companyLogo && (
                    <>
                        <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                cursor: 'pointer',
                                background: '#fff',
                                padding: '4px 10px 4px 6px',
                                borderRadius: '10px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s'
                            }}
                            onClick={() => router.push('/settings')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <img
                                src={companyLogo}
                                alt={companyName || 'Logo empresa'}
                                title={companyName}
                                style={{
                                    height: '34px',
                                    maxWidth: '80px',
                                    objectFit: 'contain',
                                    borderRadius: '6px',
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                            />
                            {companyName && (
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 400,
                                    color: '#475569',
                                    letterSpacing: '0',
                                    whiteSpace: 'normal',
                                    maxWidth: 90,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {companyName}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* User Info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '50px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                {user.photoURL && (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || user.firstName || 'User'}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '2px solid #f1f5f9'
                        }}
                    />
                )}
                <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#101828'
                }}>
                    {(user.displayName || user.firstName || 'Usuario').split(' ')[0]}
                </span>
                <button
                    onClick={handleSignOut}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#667085',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.color = '#101828';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = '#667085';
                    }}
                >
                    Salir
                </button>
            </div>
        </div>
    );
}
