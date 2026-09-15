// ── Autenticación de las rutas de API ────────────────────────────────────────
//
// Las rutas del backend usan firebase-admin, que IGNORA las reglas de Firestore.
// Es decir: `firestore.rules` no protege nada de lo que pase por /api. Si una
// ruta no verifica al llamante por su cuenta, cualquiera con la URL puede leer o
// escribir los datos de cualquier tenant.
//
// Este módulo verifica el ID token de Firebase que envía el cliente y comprueba
// que el usuario pertenezca al tenant que dice.

import { firestore, admin } from '@/lib/firebase-admin';

export class AuthError extends Error {
    constructor(message, status = 401) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
    }
}

// Extrae y valida el ID token de la cabecera Authorization.
export async function verificarSesion(req) {
    const cabecera = req.headers.get('authorization') || '';
    const [esquema, token] = cabecera.split(' ');
    if (esquema !== 'Bearer' || !token) {
        throw new AuthError('Falta el token de sesión (cabecera Authorization: Bearer).');
    }

    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
        // Token vencido, de otro proyecto o manipulado.
        throw new AuthError(`Sesión inválida o expirada (${err.code || err.message}).`);
    }

    const snap = await firestore.collection('users').doc(decoded.uid).get();
    if (!snap.exists) {
        throw new AuthError('El usuario autenticado no está registrado en la plataforma.', 403);
    }
    const datos = snap.data();

    return {
        uid:       decoded.uid,
        email:     decoded.email || datos.email || null,
        empresaId: datos.empresaId || datos.tenantId || null,
        role:      datos.role || null,
        esAdmin:   datos.role === 'admin' || datos.role === 'superadmin',
    };
}

// Verifica sesión Y que el usuario pueda operar sobre ese tenant.
// Los administradores globales pueden actuar sobre cualquiera.
export async function autorizarTenant(req, empresaId) {
    if (!empresaId) throw new AuthError('Falta empresaId en la petición.', 400);

    const sesion = await verificarSesion(req);
    if (sesion.esAdmin) return sesion;

    if (String(sesion.empresaId) !== String(empresaId)) {
        // No revelamos si el tenant existe: para el llamante es siempre lo mismo.
        throw new AuthError('No tienes acceso a los datos de esta empresa.', 403);
    }
    return sesion;
}

// Convierte un AuthError en respuesta HTTP; devuelve null si no es de auth,
// para que la ruta siga con su propio manejo de errores.
export function respuestaDeAuthError(err) {
    if (err instanceof AuthError) {
        return Response.json({ error: err.message, fuente: 'AUTH' }, { status: err.status });
    }
    return null;
}
