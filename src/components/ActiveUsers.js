'use client';
import { useEffect, useState } from 'react';

export function ActiveUsers({ users, currentUser }) {
    const [typingUsers, setTypingUsers] = useState(new Map());

    // Filter out current user from the list
    const otherUsers = users?.filter(u => u.uid !== currentUser?.uid) || [];

    if (otherUsers.length === 0) {
        return null;
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#ffffff',
            borderRadius: '50px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <span style={{
                fontSize: '0.75rem',
                color: '#667085',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                Editando:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '-0.5rem' }}>
                {otherUsers.map((user, index) => (
                    <div
                        key={user.uid || index}
                        style={{
                            position: 'relative',
                            marginLeft: index > 0 ? '-8px' : '0'
                        }}
                        title={user.firstName || user.email}
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
                                {(user.firstName || user.email || '?')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginLeft: '0.5rem'
            }}>
                {otherUsers.map((user, index) => (
                    <span
                        key={user.uid || index}
                        style={{
                            fontSize: '0.75rem',
                            color: '#101828',
                            fontWeight: '500'
                        }}
                    >
                        {user.firstName || user.email?.split('@')[0]}
                        {index < otherUsers.length - 1 && ', '}
                    </span>
                ))}
            </div>
        </div>
    );
}
