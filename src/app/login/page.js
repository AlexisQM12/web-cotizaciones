'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Traduce los códigos de error de Firebase Auth más comunes. `auth/operation-
// not-allowed` es el que más probablemente aparezca al principio: significa
// que el proveedor "Correo/Contraseña" todavía no está activado en la
// consola de Firebase (Authentication → Sign-in method) — no es un bug de la
// app, es un interruptor que sólo un admin del proyecto puede prender.
function mensajeDeError(error, modo) {
    switch (error?.code) {
        case 'auth/operation-not-allowed':
            return 'El inicio de sesión por correo y contraseña todavía no está activado para este proyecto. Pide a un administrador que lo habilite en Firebase → Authentication → Sign-in method → Correo/Contraseña.';
        case 'auth/email-already-in-use':
            return 'Ya existe una cuenta con ese correo. Usa "Iniciar sesión" en vez de "Crear cuenta" (o restablece tu contraseña si no la recuerdas).';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        case 'auth/invalid-email':
            return 'Ese correo no tiene un formato válido.';
        case 'auth/missing-password':
            return 'Escribe una contraseña.';
        case 'auth/user-not-found':
            return 'No existe una cuenta con ese correo. Si es tu primera vez, usa "Crear cuenta".';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Correo o contraseña incorrectos.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return null; // el usuario cerró el popup a propósito, no es un error que mostrar
        default:
            return error?.message || `No se pudo ${modo === 'signup' ? 'crear la cuenta' : 'iniciar sesión'}.`;
    }
}

const estiloInput = {
    width: '100%',
    padding: '0.75rem 0.9rem',
    fontSize: '0.95rem',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    background: '#fff',
};

export default function LoginPage() {
    const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
    const router = useRouter();
    const [isSigningIn, setIsSigningIn] = useState(false);

    // 'google' = pantalla inicial; 'signin' / 'signup' / 'reset' = formulario de correo.
    const [vista, setVista] = useState('google');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null); // mensajes neutrales (ej. "correo de recuperación enviado")

    useEffect(() => {
        if (user && !loading) router.push('/');
    }, [user, loading, router]);

    const handleGoogleSignIn = async () => {
        if (isSigningIn) return;
        setIsSigningIn(true);
        setError(null);
        try {
            await signInWithGoogle();
            router.push('/');
        } catch (err) {
            const msg = mensajeDeError(err, 'signin');
            if (msg) setError(msg);
        } finally {
            setIsSigningIn(false);
        }
    };

    // Antes de pedir que se cree una cuenta, se avisa si el correo ni
    // siquiera está en la whitelist de Zentria — así no "gasta" el correo
    // creando una cuenta de Firebase que de todos modos sería rechazada
    // (Firebase no deja volver a registrar el mismo correo después).
    // Esto es sólo para dar un mensaje más claro: el control de acceso real
    // sigue estando en el servidor, después de iniciar sesión.
    const verificarWhitelistAntesDeRegistrar = async (correo) => {
        try {
            const r = await fetch(`/api/auth/check-email?email=${encodeURIComponent(correo)}`);
            const d = await r.json();
            return d.allowed !== false; // ante duda (error de red, etc.) se deja continuar
        } catch {
            return true;
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (isSigningIn) return;
        setError(null);
        setAviso(null);

        if (!email.trim() || !email.includes('@')) {
            setError('Escribe un correo válido.');
            return;
        }

        if (vista === 'reset') {
            setIsSigningIn(true);
            try {
                await resetPassword(email);
                setAviso('Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña.');
            } catch (err) {
                const msg = mensajeDeError(err, 'reset');
                if (msg) setError(msg);
            } finally {
                setIsSigningIn(false);
            }
            return;
        }

        if (!password) {
            setError('Escribe tu contraseña.');
            return;
        }

        if (vista === 'signup') {
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden.');
                return;
            }
        }

        setIsSigningIn(true);
        try {
            if (vista === 'signup') {
                const admitido = await verificarWhitelistAntesDeRegistrar(email);
                if (!admitido) {
                    setError('Ese correo no está registrado en Zentria. Pide que lo agreguen antes de crear una cuenta.');
                    setIsSigningIn(false);
                    return;
                }
                await signUpWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
            router.push('/');
        } catch (err) {
            const msg = mensajeDeError(err, vista);
            if (msg) setError(msg);
        } finally {
            setIsSigningIn(false);
        }
    };

    const cambiarVista = (nueva) => {
        setVista(nueva);
        setError(null);
        setAviso(null);
        setPassword('');
        setConfirmPassword('');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#fafafa' }}>
                <p style={{ fontSize: '1.1rem', color: '#667085' }}>Cargando...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#fafafa', padding: '1.5rem' }}>
            <div style={{
                background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '32px',
                padding: '3rem 2.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                textAlign: 'center', maxWidth: '420px', width: '100%',
            }}>
                <h1 style={{ fontSize: '2rem', color: '#101828', marginBottom: '0.75rem', letterSpacing: '-0.02em', fontWeight: '600' }}>
                    Sistema de Cotizaciones
                </h1>
                <p style={{ color: '#667085', marginBottom: '2rem', fontSize: '1rem' }}>
                    {vista === 'google' && 'Inicia sesión para acceder a tu cuenta'}
                    {vista === 'signin' && 'Inicia sesión con tu correo'}
                    {vista === 'signup' && 'Crea una cuenta con tu correo'}
                    {vista === 'reset' && 'Recupera el acceso a tu cuenta'}
                </p>

                {vista === 'google' && (
                    <>
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isSigningIn}
                            className="btn"
                            style={{
                                width: '100%', background: '#ffffff', color: '#101828', border: '1px solid #e2e8f0',
                                padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '12px', fontSize: '1rem', fontWeight: '500',
                                opacity: isSigningIn ? 0.7 : 1, cursor: isSigningIn ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
                                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                            {isSigningIn ? 'Conectando...' : 'Continuar con Google'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>o</span>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        </div>

                        <button
                            type="button"
                            onClick={() => cambiarVista('signin')}
                            className="btn"
                            style={{
                                width: '100%', background: '#fff', color: '#334155', border: '1px solid #e2e8f0',
                                padding: '0.875rem 1.5rem', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer',
                            }}
                        >
                            Continuar con correo y contraseña
                        </button>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.6rem' }}>
                            Para quienes no tienen una cuenta de Google (por ejemplo, un correo de tu propio dominio).
                        </p>
                    </>
                )}

                {vista !== 'google' && (
                    <form onSubmit={handleEmailSubmit} style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Correo</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tucorreo@tudominio.com"
                            style={{ ...estiloInput, marginBottom: '1rem' }}
                            autoComplete="email"
                            autoFocus
                        />

                        {vista !== 'reset' && (
                            <>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Contraseña</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ ...estiloInput, marginBottom: vista === 'signup' ? '1rem' : '0.4rem' }}
                                    autoComplete={vista === 'signup' ? 'new-password' : 'current-password'}
                                />
                            </>
                        )}

                        {vista === 'signup' && (
                            <>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Confirmar contraseña</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ ...estiloInput, marginBottom: '0.4rem' }}
                                    autoComplete="new-password"
                                />
                            </>
                        )}

                        {vista === 'signin' && (
                            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                                <button type="button" onClick={() => cambiarVista('reset')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {error && (
                            <p style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                                {error}
                            </p>
                        )}
                        {aviso && (
                            <p style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                                {aviso}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSigningIn}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.875rem 1.5rem', fontSize: '0.95rem', marginBottom: '0.9rem', opacity: isSigningIn ? 0.7 : 1, cursor: isSigningIn ? 'not-allowed' : 'pointer' }}
                        >
                            {isSigningIn ? 'Un momento…' : (
                                vista === 'signup' ? 'Crear cuenta' : vista === 'reset' ? 'Enviar enlace de recuperación' : 'Iniciar sesión'
                            )}
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
                            {vista === 'signin' && (
                                <>¿No tienes cuenta? <button type="button" onClick={() => cambiarVista('signup')} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: 0, fontWeight: 600 }}>Créala aquí</button></>
                            )}
                            {vista === 'signup' && (
                                <>¿Ya tienes cuenta? <button type="button" onClick={() => cambiarVista('signin')} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: 0, fontWeight: 600 }}>Inicia sesión</button></>
                            )}
                            {vista === 'reset' && (
                                <button type="button" onClick={() => cambiarVista('signin')} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: 0, fontWeight: 600 }}>← Volver a iniciar sesión</button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => cambiarVista('google')}
                            style={{ display: 'block', margin: '1.25rem auto 0', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                            ← Volver a las opciones de inicio de sesión
                        </button>
                    </form>
                )}

                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2rem', lineHeight: '1.5' }}>
                    Al iniciar sesión, aceptas los términos y condiciones del servicio.
                </p>
            </div>
        </div>
    );
}
