'use client';
import { useEffect, useState, useRef } from 'react';

export function ActiveUsers({ users, currentUser }) {
    const [typingUsers, setTypingUsers] = useState(new Map());
    const [position, setPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 350 : 300, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isMinimized, setIsMinimized] = useState(false);

    // Filter out current user and remove duplicates
    const otherUsers = users?.filter(u => u.uid !== currentUser?.uid) || [];
    const uniqueUsers = Array.from(new Map(otherUsers.map(u => [u.uid, u])).values());

    const handleMouseDown = (e) => {
        if (e.target.closest('.drag-handle-users')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    if (uniqueUsers.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 1000,
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                minWidth: isMinimized ? '150px' : '300px'
            }}
        >
            {/* Drag Handle */}
            <div
                className="drag-handle-users"
                onMouseDown={handleMouseDown}
                style={{
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}
            >
                <span>👥 Editando</span>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                    }}
                    title={isMinimized ? 'Maximizar' : 'Minimizar'}
                >
                    {isMinimized ? '▢' : '−'}
                </button>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '12px',
                    background: '#ffffff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '-0.5rem' }}>
                        {uniqueUsers.map((user, index) => (
                            <div
                                key={`avatar-${user.uid}-${index}`}
                                style={{
                                    position: 'relative',
                                    marginLeft: index > 0 ? '-8px' : '0'
                                }}
                                title={user.displayName || user.firstName || user.email}
                            >
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.firstName || 'User'}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: '2px solid #ffffff',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: '2px solid #ffffff',
                                        background: '#4f46e5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        {(user.displayName || user.firstName || user.email || '?')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        marginLeft: '0.5rem'
                    }}>
                        {uniqueUsers.map((user, index) => (
                            <span
                                key={`name-${user.uid}-${index}`}
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#101828',
                                    fontWeight: '500'
                                }}
                            >
                                {user.displayName || user.firstName || user.email?.split('@')[0]}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
