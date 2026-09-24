import { firestore } from '@/lib/firebase-admin';

// GET /api/auth/check-email?email=...
//
// Sólo para UX del formulario de "Crear cuenta": avisa ANTES de pedir una
// contraseña si ese correo ni siquiera está en la whitelist de Zentria, así
// no se le hace crear una cuenta de Firebase Auth para terminar rechazada de
// inmediato (y ese correo quedaría "gastado" — Firebase no deja crear otra
// cuenta con el mismo email después).
//
// Esto NO es el control de acceso real. Ese sigue siendo /api/users, que
// corre después de cualquier inicio de sesión exitoso (Google o correo) y es
// el único lugar que de verdad decide si alguien entra. Nada aquí debe
// tratarse como autoritativo: quien quiera saltarse esta ruta y llamar
// directo a Firebase Auth puede hacerlo iguel, y seguiría siendo rechazado
// ahí.
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = (searchParams.get('email') || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
            return Response.json({ error: 'Correo inválido' }, { status: 400 });
        }

        const [tenantUserDoc, adminDoc] = await Promise.all([
            firestore.collection('tenant_users').doc(email).get(),
            firestore.collection('admins').doc(email).get(),
        ]);

        return Response.json({ allowed: tenantUserDoc.exists || adminDoc.exists });
    } catch (err) {
        console.error('[auth/check-email] error:', err);
        // Ante un error del servidor no bloqueamos el intento de registro: la
        // ruta real (/api/users) igual va a validar después.
        return Response.json({ allowed: true, checked: false });
    }
}
