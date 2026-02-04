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
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            padding: '1rem 2rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
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
                        alt={user.firstName || 'User'}
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
                    {user.firstName || 'Usuario'}
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
