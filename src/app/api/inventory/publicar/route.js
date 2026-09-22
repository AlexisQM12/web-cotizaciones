import { reconstruir } from '@/lib/catalogoPublico';
import { autorizarTenant, AuthError } from '@/lib/apiAuth';

/**
 * Reconstruye la tienda pública del cliente desde su inventario.
 *
 * El alta, la edición y el borrado ya mantienen la vitrina al día por su
 * cuenta. Esto es para el arranque —los artículos que ya existían antes de que
 * esto se sincronizara— y como red de seguridad si alguna escritura se perdió.
 */
export async function POST(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return Response.json({ error: 'empresaId es obligatorio' }, { status: 400 });
        }

        // Reconstruir la vitrina es una escritura masiva sobre el tenant: se
        // exige sesion y pertenencia, aunque lo que acabe publicado sea
        // publico.
        await autorizarTenant(req, empresaId);

        const resumen = await reconstruir(empresaId);
        return Response.json({ empresaId, ...resumen });
    } catch (error) {
        if (error instanceof AuthError) {
            return Response.json({ error: error.message }, { status: error.status });
        }
        console.error('API Error (inventory publicar):', error);
        return Response.json({ error: 'No se pudo reconstruir la tienda', details: error.message }, { status: 500 });
    }
}
