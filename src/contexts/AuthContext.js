'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [serverError, setServerError] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                const userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    firstName: firebaseUser.displayName?.split(' ')[0] || 'Usuario'
                };

                setUser(userData);

                // Sync user data to Firestore and get full profile (including empresaId)
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                
                if (res.ok) {
                    const dbData = await res.json();
                    setUser(dbData.user);
                } else if (res.status === 403) {
                    // El usuario no existe en Zentria, rechazar acceso
                    await firebaseSignOut(auth);
                    setUser(null);
                    setAccessDenied(true);
                } else {
                    // Error 500 u otros errores del servidor (ej. BD caída o sin variables de entorno)
                    console.error('[AuthContext] Error del servidor al iniciar sesión:', res.status);
                    await firebaseSignOut(auth);
                    setUser(null);
                    setServerError(true);
                }
            } else {
                // User is signed out
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        signOut
    };

    if (accessDenied) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: '20px' }}>
                <div style={{ maxWidth: '420px', width: '100%', backgroundColor: 'white', borderRadius: '16px', padding: '40px 32px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <div style={{ backgroundColor: '#fee2e2', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '36px', height: '36px', color: '#e11d48' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>Acceso Denegado</h2>
                    <p style={{ color: '#4b5563', marginBottom: '32px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                        Tu cuenta de correo no se encuentra registrada en el sistema central de <strong>Zentria Logic</strong>. No tienes permisos para acceder a este módulo.
                    </p>
                    <button 
                        onClick={() => window.location.href = 'https://zentrialogic.com'}
                        style={{ width: '100%', padding: '14px', backgroundColor: '#e11d48', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.2)' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#be123c'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#e11d48'}
                    >
                        Solicitar Acceso en Zentria
                    </button>
                    <button 
                        onClick={() => { setAccessDenied(false); window.location.href = '/login'; }}
                        style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', marginTop: '16px', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = '#f3f4f6'; e.target.style.color = '#374151'; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#6b7280'; }}
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }

    if (serverError) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: '20px' }}>
                <div style={{ maxWidth: '420px', width: '100%', backgroundColor: 'white', borderRadius: '16px', padding: '40px 32px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <div style={{ backgroundColor: '#fef3c7', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '36px', height: '36px', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>Error del Servidor</h2>
                    <p style={{ color: '#4b5563', marginBottom: '32px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                        Ha ocurrido un problema de conexión con la base de datos (Error 500). Por favor, asegúrate de que las credenciales del servidor estén configuradas correctamente.
                    </p>
                    <button 
                        onClick={() => { setServerError(false); window.location.href = '/login'; }}
                        style={{ width: '100%', padding: '14px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#b45309'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#d97706'}
                    >
                        Volver a intentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
