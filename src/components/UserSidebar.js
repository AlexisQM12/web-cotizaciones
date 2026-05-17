'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function UserSidebar({ activeUsers = [] }) {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!user) return null;

    // Filter out current user from active users
    const otherUsers = activeUsers?.filter(u => u.uid !== user?.uid) || [];
    const uniqueUsers = Array.from(new Map(otherUsers.map(u => [u.uid, u])).values());

    return (
        <div className="user-sidebar">
            {/* Current User Profile */}
            <div className="user-profile-current">
                <div style={{ position: 'relative' }}>
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || user.firstName || 'User'}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                border: '2px solid #10b981',
                                boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                            }}
                            title={`${user.displayName || user.firstName || 'Usuario'}\n${user.email}`}
                        />
                    ) : (
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: '2px solid #10b981',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                        }}
                            title={`${user.displayName || user.firstName || 'Usuario'}\n${user.email}`}
                        >
                            {(user.displayName || user.firstName || user.email || '?')[0].toUpperCase()}
                        </div>
                    )}
                    {/* Online indicator */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid #f8fafc',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                    }} />
                </div>
                <span style={{
                    fontSize: '0.65rem',
                    color: '#64748b',
                    fontWeight: '500',
                    textAlign: 'center',
                    maxWidth: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    Tú
                </span>
            </div>

            {/* Active Users */}
            {uniqueUsers.length > 0 && (
                <div className="user-sidebar-content">
                    <div className="sidebar-label">
                        Editando
                    </div>
                    {uniqueUsers.map((activeUser, index) => (
                        <div
                            key={`sidebar-user-${activeUser.uid}-${index}`}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}
                        >
                            {activeUser.photoURL ? (
                                <img
                                    src={activeUser.photoURL}
                                    alt={activeUser.displayName || activeUser.firstName || 'User'}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: '2px solid #667eea',
                                        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                    }}
                                    title={activeUser.displayName || activeUser.firstName || activeUser.email}
                                />
                            ) : (
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '2px solid #667eea',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                }}
                                    title={activeUser.displayName || activeUser.firstName || activeUser.email}
                                >
                                    {(activeUser.displayName || activeUser.firstName || activeUser.email || '?')[0].toUpperCase()}
                                </div>
                            )}
                            {/* Online indicator */}
                            <div style={{
                                position: 'absolute',
                                bottom: '18px',
                                right: '8px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#667eea',
                                border: '2px solid #f8fafc',
                                boxShadow: '0 0 6px rgba(102, 126, 234, 0.6)'
                            }} />
                            <span style={{
                                fontSize: '0.6rem',
                                color: '#64748b',
                                fontWeight: '500',
                                textAlign: 'center',
                                maxWidth: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {(activeUser.displayName || activeUser.firstName || activeUser.email?.split('@')[0] || '').substring(0, 8)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Logout Button */}
            <button
                className="btn-logout"
                onClick={handleSignOut}
            >
                🚪
            </button>
        </div>
    );
}
