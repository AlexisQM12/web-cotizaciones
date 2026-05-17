'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function NavBar() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="navbar">
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
