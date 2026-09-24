// ── Resolución del tenant en las rutas de API ────────────────────────────────
//
// Estas rutas arrastraban esta expresión, repetida 13 veces:
//
//   getTenantCollection(
//     typeof empresaId !== 'undefined' ? empresaId
//       : (typeof body !== 'undefined' ? body.empresaId : 'ayatech'), ...)
//
// En los handlers donde `empresaId` ni siquiera estaba declarado (los GET y
// DELETE por id), `typeof` daba 'undefined' y, al no haber `body`, el tenant
// terminaba siendo la constante 'ayatech'. Es decir: un usuario de otra empresa
// leía —y borraba— documentos del tenant equivocado.
//
// Aquí el tenant se resuelve explícitamente y, si no llega, la petición falla
// con un 400 claro en vez de caer en una empresa por defecto.

export function resolverEmpresaId(req, body = null) {
    let deQuery = null;
    try {
        deQuery = new URL(req.url).searchParams.get('empresaId');
    } catch { /* req.url no parseable: seguimos con el body */ }

    const empresaId = deQuery || body?.empresaId || null;
    return empresaId ? String(empresaId) : null;
}

// Respuesta estándar cuando falta. Nunca adivinamos un tenant.
export function faltaEmpresaId() {
    return Response.json({
        error: 'Falta empresaId: no se puede determinar a qué empresa pertenece el dato.',
    }, { status: 400 });
}
