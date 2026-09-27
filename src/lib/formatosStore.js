import { storage } from '@/lib/firebase-admin';

// Dónde vive el documento de un formato.
//
// La ficha (nombre, tipo, quién lo tocó) va a Firestore, pero el HTML NO: un
// manual con fotos incrustadas pesa megas y un documento de Firestore no pasa
// de 1 MB. El HTML se guarda en Storage, dentro de la carpeta de la empresa,
// y solo se sirve a través de la API para que pase por el mismo control de
// acceso que el resto de los datos del tenant.

export const rutaHtml = (empresaId, id) => `tenants/${empresaId}/formatos/${id}.html`;

function cubo() {
    if (!storage) throw new Error('Storage no está configurado en el servidor.');
    return storage.bucket();
}

export async function guardarHtml(empresaId, id, html) {
    await cubo().file(rutaHtml(empresaId, id)).save(html, {
        contentType: 'text/html; charset=utf-8',
        resumable: false,
    });
}

/** Devuelve el HTML, o null si el formato todavía no tiene documento. */
export async function leerHtml(empresaId, id) {
    const archivo = cubo().file(rutaHtml(empresaId, id));
    const [existe] = await archivo.exists();
    if (!existe) return null;
    const [buffer] = await archivo.download();
    return buffer.toString('utf8');
}

export async function borrarHtml(empresaId, id) {
    await cubo().file(rutaHtml(empresaId, id)).delete({ ignoreNotFound: true });
}
