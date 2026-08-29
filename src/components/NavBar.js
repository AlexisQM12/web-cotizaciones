'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { TasksPopover } from '@/components/TasksPopover';

export function NavBar() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [companyLogo, setCompanyLogo] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [hasPendingTasks, setHasPendingTasks] = useState(false);
    const [tasksList, setTasksList] = useState([]);
    const dropdownRef = useRef(null);

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

    const fetchTasks = async () => {
        if (!user?.empresaId || !user?.uid) return;
        try {
            const res = await fetch(`/api/tasks?empresaId=${user.empresaId}&userId=${user.uid}`);
            if (res.ok) {
                const tasks = await res.json();
                setTasksList(tasks);
                const hasPending = tasks.some(t => t.status !== 'completed' && t.completed !== true);
                setHasPendingTasks(hasPending);
            }
        } catch (err) {}
    };

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [user]);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!user) return null;

    const userRoleStr = (user?.role || '').toLowerCase();
    const isAdmin = userRoleStr === 'admin' || userRoleStr === 'administrador';

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

            {/* User Info & Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#ffffff',
                        padding: '0.5rem 1rem',
                        borderRadius: '50px',
                        border: isAdmin ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        position: 'relative',
                        animation: isAdmin ? 'adminGlow 3s infinite' : 'none'
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || user.firstName || 'User'}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: isAdmin ? '2px solid #3b82f6' : '2px solid #f1f5f9'
                                }}
                            />
                        ) : (
                            <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', 
                                background: isAdmin ? '#eff6ff' : '#e2e8f0', 
                                border: isAdmin ? '2px solid #3b82f6' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: isAdmin ? '#2563eb' : '#64748b' 
                            }}>
                                {(user.displayName || user.firstName || 'U')[0]}
                            </div>
                        )}
                        {hasPendingTasks && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '10px',
                                height: '10px',
                                background: '#ef4444',
                                borderRadius: '50%',
                                border: '2px solid #ffffff',
                                animation: 'pulse 1.5s infinite'
                            }} />
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#101828',
                            lineHeight: 1
                        }}>
                            {(user.displayName || user.firstName || 'Usuario').split(' ')[0]}
                        </span>
                        {isAdmin && (
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                color: '#3b82f6',
                                marginTop: '0.15rem'
                            }}>
                                ADMIN
                            </span>
                        )}
                    </div>

                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: '#64748b', marginLeft: '0.25rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {dropdownOpen && (
                    <TasksPopover 
                        tasks={tasksList} 
                        fetchTasks={fetchTasks} 
                        user={user} 
                        handleSignOut={handleSignOut} 
                    />
                )}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes adminGlow {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
            `}} />
        </div>
    );
}
