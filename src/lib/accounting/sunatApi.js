// ── Cliente del API SIRE de SUNAT ────────────────────────────────────────────
//
// Fuente: manuales oficiales "Servicios Web Api SIRE" v22 (SUNAT / cpe.sunat.gob.pe)
//   - Compras (RCE):  Manual de servicios Web Api - SIRE_Compras v22
//   - Ventas  (RVIE): Manual de servicios Web Api Ventas v22, Partes I y II
//
// IMPORTANTE — la descarga de la propuesta NO es síncrona. El flujo real es:
//
//   1. Solicitar la exportación  → SUNAT responde con un { numTicket }
//   2. Consultar el estado del ticket (polling) hasta "Terminado"
//   3. Descargar el archivo generado (viene ZIPEADO) y parsearlo
//
// No existe ningún endpoint que devuelva los comprobantes como JSON en una sola
// llamada. Cualquier ruta del tipo `.../propuesta/{periodo}/comprobantes` no está
// documentada y SUNAT responde con una página HTML de error 500.
//
// Otro punto del manual: los servicios del API SIRE no deben consumirse desde un
// cliente web (falla por CORS). Este módulo es SOLO para server-side.

import { unzipSync } from 'fflate';

export const SIRE_SECURITY_BASE = 'https://api-seguridad.sunat.gob.pe';
export const SIRE_API_BASE      = 'https://api-sire.sunat.gob.pe';

// Anexo III (Compras) / Anexo IV (Ventas): extensión del archivo a descargar.
export const TIPO_ARCHIVO = { TXT: '0', CSV: '1', EXCEL: '2' };

// codOrigenEnvio — sólo lo pide RCE. "2" = Servicio API.
const ORIGEN_ENVIO_API = '2';

// ── Errores ──────────────────────────────────────────────────────────────────
// Un error de SUNAT trae { cod, msg, errors: [{ cod, msg }] }. Conservamos esos
// datos para poder mostrarle al usuario algo accionable en vez de un volcado.
export class SunatApiError extends Error {
    constructor(message, { status, cod, errors, raw } = {}) {
        super(message);
        this.name   = 'SunatApiError';
        this.status = status;
        this.cod    = cod;
        this.errors = errors || [];
        this.raw    = raw;
    }
}

// ── Token OAuth2 ─────────────────────────────────────────────────────────────
// El token dura 3600s. Lo cacheamos en memoria del proceso para no pedir uno
// nuevo en cada paso del polling (son varias llamadas seguidas).
const tokenCache = new Map();

export async function getSireToken({ clientId, clientSecret, ruc, solUser, solPassword }) {
    for (const [campo, valor] of Object.entries({ clientId, clientSecret, ruc, solUser, solPassword })) {
        if (!valor || !String(valor).trim()) {
            throw new SunatApiError(`Falta la credencial "${campo}" en la configuración contable.`);
        }
    }
    if (!/^\d{11}$/.test(String(ruc).trim())) {
        throw new SunatApiError(`RUC inválido: "${ruc}". Debe tener 11 dígitos.`);
    }

    const cacheKey = `${clientId}:${ruc}:${solUser}`;
    const cached   = tokenCache.get(cacheKey);
    // 60s de margen para no usar un token que expira a mitad del flujo.
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

    const tokenUrl = `${SIRE_SECURITY_BASE}/v1/clientessol/${encodeURIComponent(clientId.trim())}/oauth2/token/`;
    // El username es la concatenación RUC + usuario SOL, sin separador.
    const username = `${String(ruc).trim()}${String(solUser).trim().toUpperCase()}`;

    const params = new URLSearchParams({
        grant_type:    'password',
        scope:         SIRE_API_BASE,
        client_id:     clientId.trim(),
        client_secret: clientSecret.trim(),
        username,
        password:      String(solPassword),
    });

    const res = await fetch(tokenUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    params.toString(),
    });

    const bodyText = await res.text();
    if (!res.ok) {
        // 401 aquí casi siempre es clave SOL, usuario o client_secret equivocado.
        const detalle = res.status === 401
            ? 'Credenciales rechazadas por SUNAT. Revisa el usuario SOL, la clave SOL y el client_secret.'
            : describirRespuesta(bodyText);
        throw new SunatApiError(`No se pudo obtener el token de SUNAT (HTTP ${res.status}). ${detalle}`, {
            status: res.status, raw: bodyText,
        });
    }

    let data;
    try {
        data = JSON.parse(bodyText);
    } catch {
        throw new SunatApiError('SUNAT devolvió una respuesta no-JSON al pedir el token.', { raw: bodyText });
    }
    if (!data.access_token) {
        throw new SunatApiError('SUNAT no devolvió access_token.', { raw: bodyText });
    }

    const vidaSegundos = Number(data.expires_in) || 3600;
    tokenCache.set(cacheKey, {
        token:     data.access_token,
        expiresAt: Date.now() + vidaSegundos * 1000,
    });
    return data.access_token;
}

// Vacía el token cacheado (útil si cambian las credenciales en configuración).
export function invalidarTokenCache() {
    tokenCache.clear();
}

// ── Helper de red ────────────────────────────────────────────────────────────
// Cuando la ruta o los parámetros no son válidos, SUNAT no responde un 404 limpio:
// devuelve su página HTML de error con el agente Dynatrace incrustado. Detectarlo
// y decirlo explícitamente ahorra horas de depuración.
function describirRespuesta(texto) {
    const recorte = (texto || '').trim().slice(0, 400);
    if (/^\s*<(!doctype|html)/i.test(recorte) || recorte.includes('ruxitagentjs')) {
        return 'SUNAT devolvió una página HTML de error en vez de JSON — normalmente significa que la ruta o los parámetros no son válidos para ese servicio.';
    }
    return recorte || '(respuesta vacía)';
}

async function sunatFetch(url, { token, method = 'GET' } = {}) {
    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept:        'application/json',
            'Content-Type': 'application/json',
        },
    });

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
        const texto = await res.text();
        let cod, msg, errors;
        try {
            const j = JSON.parse(texto);
            cod = j.cod; msg = j.msg; errors = j.errors;
        } catch { /* no era JSON */ }

        // SUNAT usa 422 para errores de validación, con una lista detallada.
        const detalleErrores = (errors || []).map(e => `[${e.cod}] ${e.msg}`).join('; ');
        // Sin este matiz, un 429 o un 403 se leen como "ruta inválida" y mandan a
        // depurar la URL cuando el problema es de cuota o de permisos.
        const porEstado = {
            401: 'Token rechazado o expirado. Vuelve a autenticarte.',
            403: 'El usuario SOL no tiene permiso sobre este servicio o este RUC.',
            429: 'Demasiadas consultas seguidas: SUNAT está limitando el ritmo (rate limit). Espera unos minutos antes de reintentar.',
            500: 'Error interno de SUNAT. Si se repite con los mismos parámetros, suele indicar que la ruta o los parámetros no corresponden a este servicio.',
            503: 'Servicio de SUNAT no disponible temporalmente.',
        }[res.status];

        const mensaje = [
            `SUNAT respondió HTTP ${res.status}`,
            cod ? `(cod ${cod})` : '',
            msg || porEstado || describirRespuesta(texto),
            detalleErrores,
        ].filter(Boolean).join(' — ');

        throw new SunatApiError(mensaje, { status: res.status, cod, errors, raw: texto.slice(0, 2000) });
    }

    // Los endpoints de descarga devuelven binario (zip), no JSON.
    if (contentType.includes('application/json')) return res.json();
    return res;
}

// ── Paso 1: solicitar la exportación de la propuesta ─────────────────────────
// Devuelve el numTicket con el que se sigue el proceso.
//
// Ojo: RVIE y RCE NO comparten ruta ni nombres de parámetros. No se puede
// intercambiar el segmento "rvie"/"rce" sobre una misma URL.
export async function solicitarDescargaPropuesta({
    token, type, period, codTipoArchivo = TIPO_ARCHIVO.TXT, filtros = {},
}) {
    const per = normalizarPeriodo(period);
    const esVentas = String(type).toUpperCase() === 'RVIE';

    let url;
    if (esVentas) {
        // Manual Ventas v22 Parte II, 5.18 "Servicio Web Api descargar propuesta"
        url = new URL(`${SIRE_API_BASE}/v1/contribuyente/migeigv/libros/rvie/propuesta/web/propuesta/${per}/exportapropuesta`);
        url.searchParams.set('codTipoArchivo', codTipoArchivo);
        aplicarFiltros(url, filtros, {
            fechaDesde: 'fecDocumentoDesde', fechaHasta: 'fecDocumentoHasta',
            montoDesde: 'mtoTotalDesde',     montoHasta: 'mtoTotalHasta',
            rucContraparte: 'numRucAdquiriente', tipoCDP: 'codTipoCDP',
            inconsistencia: 'codTipoInconsistencia', car: 'numCarSunat',
        });
    } else {
        // Manual Compras v22, 5.34 "Servicio Web Api descargar propuesta"
        url = new URL(`${SIRE_API_BASE}/v1/contribuyente/migeigv/libros/rce/propuesta/web/propuesta/${per}/exportacioncomprobantepropuesta`);
        url.searchParams.set('codTipoArchivo', codTipoArchivo);
        url.searchParams.set('codOrigenEnvio', ORIGEN_ENVIO_API); // obligatorio sólo en RCE
        aplicarFiltros(url, filtros, {
            fechaDesde: 'fecEmisionIni', fechaHasta: 'fecEmisionFin',
            montoDesde: 'mtoDesde',      montoHasta: 'mtoHasta',
            rucContraparte: 'numDocAdquiriente', tipoCDP: 'codTipoCDP',
            inconsistencia: 'codInconsistencia', car: 'codCar',
            serieCDP: 'numSerieCDP', numeroCDP: 'numCDP',
        });
    }

    const data = await sunatFetch(url.toString(), { token });
    const numTicket = data?.numTicket || data?.registros?.[0]?.numTicket;
    if (!numTicket) {
        throw new SunatApiError('SUNAT aceptó la solicitud pero no devolvió numTicket.', { raw: JSON.stringify(data).slice(0, 1000) });
    }
    return numTicket;
}

function aplicarFiltros(url, filtros, mapa) {
    for (const [nuestro, deSunat] of Object.entries(mapa)) {
        const v = filtros[nuestro];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
            url.searchParams.set(deSunat, String(v).trim());
        }
    }
}

// ── Paso 2: consultar el estado del ticket ───────────────────────────────────
export async function consultarEstadoTicket({ token, numTicket, period }) {
    const per = normalizarPeriodo(period);
    const url = new URL(`${SIRE_API_BASE}/v1/contribuyente/migeigv/libros/rvierce/gestionprocesosmasivos/web/masivo/consultaestadotickets`);
    url.searchParams.set('perIni', per);
    url.searchParams.set('perFin', per);
    url.searchParams.set('page', '1');
    url.searchParams.set('perPage', '20');
    url.searchParams.set('numTicket', numTicket);

    const data = await sunatFetch(url.toString(), { token });
    const registro = (data?.registros || []).find(r => r.numTicket === numTicket) || data?.registros?.[0];
    if (!registro) return { encontrado: false, terminado: false, archivos: [] };

    // El manual documenta el estado como texto ("Terminado"). Nos apoyamos en la
    // descripción y, sobre todo, en la presencia del archivo generado, que es la
    // señal inequívoca de que el proceso acabó.
    const desc     = String(registro.desEstadoProceso || registro.desEstadoEnvio || '').toUpperCase();
    const archivos = extraerArchivosReporte(registro);
    const fallido  = desc.includes('ERROR') || desc.includes('RECHAZ') || desc.includes('ANULAD');

    return {
        encontrado: true,
        terminado:  archivos.length > 0 || desc.includes('TERMINADO'),
        fallido,
        estado:     registro.desEstadoProceso || registro.desEstadoEnvio || registro.codEstadoProceso || 'desconocido',
        archivos,
        registro,
    };
}

// archivoReporte puede venir a nivel del registro o dentro de detalleTicket.
function extraerArchivosReporte(registro) {
    const listas = [
        registro.archivoReporte,
        ...(Array.isArray(registro.detalleTicket) ? registro.detalleTicket.map(d => d.archivoReporte) : []),
    ];
    const salida = [];
    for (const lista of listas) {
        if (!Array.isArray(lista)) continue;
        for (const a of lista) {
            if (a?.nomArchivoReporte) {
                salida.push({
                    nomArchivoReporte:     a.nomArchivoReporte,
                    codTipoArchivoReporte: a.codTipoArchivoReporte ?? null,
                });
            }
        }
    }
    return salida;
}

// ── Paso 3: descargar el archivo generado ────────────────────────────────────
// Llega zipeado (y puede venir particionado en varios archivos).
export async function descargarArchivoReporte({ token, nomArchivoReporte, codTipoArchivoReporte }) {
    const url = new URL(`${SIRE_API_BASE}/v1/contribuyente/migeigv/libros/rvierce/gestionprocesosmasivos/web/masivo/archivoreporte`);
    url.searchParams.set('nomArchivoReporte', nomArchivoReporte);
    // El manual es explícito: si el 5.31 devuelve null, se envía "null" igual.
    url.searchParams.set('codTipoArchivoReporte', codTipoArchivoReporte ?? 'null');

    const res = await sunatFetch(url.toString(), { token });
    const buffer = Buffer.from(await res.arrayBuffer());
    return descomprimirSiEsZip(buffer);
}

// Devuelve el texto del archivo. Si es un ZIP, concatena las partes que contiene.
export function descomprimirSiEsZip(buffer) {
    const esZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b; // "PK"
    if (!esZip) return buffer.toString('utf8');

    const contenido = unzipSync(new Uint8Array(buffer));
    const partes = Object.entries(contenido)
        .filter(([nombre]) => !nombre.endsWith('/'))
        .sort(([a], [b]) => a.localeCompare(b)) // el particionado va numerado
        .map(([, datos]) => Buffer.from(datos).toString('utf8'));

    if (!partes.length) throw new SunatApiError('El ZIP devuelto por SUNAT está vacío.');
    return partes.join('\n');
}

// ── Orquestador: propuesta completa ──────────────────────────────────────────
export async function obtenerPropuesta({
    credenciales, type, period, filtros = {},
    intentosMax = 20, esperaMs = 3000, onProgreso,
}) {
    const token = await getSireToken(credenciales);
    const avisar = (etapa, detalle) => { try { onProgreso?.(etapa, detalle); } catch { /* no romper por el callback */ } };

    avisar('solicitando');
    const numTicket = await solicitarDescargaPropuesta({ token, type, period, filtros });
    avisar('ticket', { numTicket });

    let estado = null;
    for (let intento = 1; intento <= intentosMax; intento++) {
        await new Promise(r => setTimeout(r, esperaMs));
        estado = await consultarEstadoTicket({ token, numTicket, period });
        avisar('poll', { intento, estado: estado.estado });

        if (estado.fallido) {
            throw new SunatApiError(`SUNAT marcó el ticket ${numTicket} como fallido (estado: ${estado.estado}).`);
        }
        if (estado.terminado && estado.archivos.length) break;
    }

    if (!estado?.terminado || !estado.archivos.length) {
        throw new SunatApiError(
            `El ticket ${numTicket} sigue en proceso tras ${intentosMax} intentos (último estado: ${estado?.estado ?? 'sin respuesta'}). ` +
            `Vuelve a consultar en unos minutos usando ese número de ticket.`,
            { raw: numTicket }
        );
    }

    avisar('descargando', { archivos: estado.archivos.length });
    const textos = [];
    for (const archivo of estado.archivos) {
        textos.push(await descargarArchivoReporte({ token, ...archivo }));
    }
    const texto = textos.join('\n');

    return {
        numTicket,
        archivos: estado.archivos.map(a => a.nomArchivoReporte),
        texto,
        comprobantes: parseComprobantes(texto, type),
    };
}

// Consulta suelta de un ticket ya emitido, para no repetir la solicitud cuando
// el proceso tardó más que el timeout de la petición HTTP.
export async function recuperarTicket({ credenciales, numTicket, period, type }) {
    const token  = await getSireToken(credenciales);
    const estado = await consultarEstadoTicket({ token, numTicket, period });
    if (!estado.terminado || !estado.archivos.length) {
        return { listo: false, estado: estado.estado, numTicket };
    }
    const textos = [];
    for (const archivo of estado.archivos) {
        textos.push(await descargarArchivoReporte({ token, ...archivo }));
    }
    const texto = textos.join('\n');
    return { listo: true, numTicket, texto, comprobantes: parseComprobantes(texto, type) };
}

// ── Aceptar propuesta ────────────────────────────────────────────────────────
// ACCIÓN FISCAL IRREVERSIBLE. Devuelve un numTicket; el resultado se confirma
// consultando ese ticket.
//
// Las rutas de ventas y compras difieren incluso en la ortografía del verbo
// ("aceptapropuesta" vs "aceptarpropuesta"): están así en los manuales.
export async function aceptarPropuesta({ credenciales, type, period }) {
    const token = await getSireToken(credenciales);
    const per   = normalizarPeriodo(period);
    const esVentas = String(type).toUpperCase() === 'RVIE';

    const url = esVentas
        ? `${SIRE_API_BASE}/v1/contribuyente/migeigv/libros/rvie/propuesta/web/propuesta/${per}/aceptapropuesta`
        : `${SIRE_API_BASE}/v1/contribuyente/migeigv/libros/rce/propuesta/web/registroslibros/${per}/aceptarpropuesta`;

    const data = await sunatFetch(url, { token, method: 'POST' });
    return { numTicket: data?.numTicket || null, respuesta: data };
}

// ── Parser del archivo plano ─────────────────────────────────────────────────
// SUNAT entrega los registros delimitados por "|". El orden de columnas es el de
// los formatos 14.1 (ventas) y 8.1 (compras), el mismo que arma sireExporter.js.
//
// OJO: los manuales de servicios web no documentan el layout del archivo
// exportado — lo definen las resoluciones del formato. Por eso el parser no
// asume nada: si el número de columnas no cuadra, no inventa datos, sino que
// devuelve la fila cruda con `parcial: true` para que se vea en la UI.
const COLUMNAS_VENTAS  = { fechaEmision: 3, tipoComprobante: 5, serie: 6, numero: 7, tipoDoc: 8, numDoc: 9, razonSocial: 10, baseImponible: 12, igv: 14, exonerado: 16, inafecto: 17, total: 22, moneda: 23 };
const COLUMNAS_COMPRAS = { fechaEmision: 3, tipoComprobante: 5, serie: 6, numero: 8, tipoDoc: 10, numDoc: 11, razonSocial: 12, baseImponible: 13, igv: 14, total: 22, moneda: 23 };

export function parseComprobantes(texto, type) {
    const esVentas = String(type).toUpperCase() === 'RVIE';
    const cols     = esVentas ? COLUMNAS_VENTAS : COLUMNAS_COMPRAS;
    const minimo   = Math.max(...Object.values(cols)) + 1;

    const lineas = String(texto || '')
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

    const salida = [];
    for (const [i, linea] of lineas.entries()) {
        const campos = linea.split('|');
        if (campos.length < 3) continue;
        // Una cabecera (si viniera en el CSV) no empieza con un periodo AAAAMM.
        if (i === 0 && !/^\d{6}/.test(campos[0])) continue;

        if (campos.length < minimo) {
            salida.push({ id: `raw-${i}`, parcial: true, raw: linea });
            continue;
        }

        salida.push({
            id:              `${campos[cols.serie] || 's'}-${campos[cols.numero] || i}`,
            fechaEmision:    campos[cols.fechaEmision] || '',
            tipoComprobante: campos[cols.tipoComprobante] || '',
            serie:           campos[cols.serie] || '',
            numero:          campos[cols.numero] || '',
            tipoDoc:         campos[cols.tipoDoc] || '',
            ruc:             campos[cols.numDoc] || '',
            razonSocial:     campos[cols.razonSocial] || '',
            baseImponible:   aNumero(campos[cols.baseImponible]),
            igv:             aNumero(campos[cols.igv]),
            total:           aNumero(campos[cols.total]),
            moneda:          campos[cols.moneda] || 'PEN',
            parcial:         false,
        });
    }
    return salida;
}

function aNumero(v) {
    if (v == null || v === '') return 0;
    // SUNAT usa punto decimal; toleramos coma por si el archivo viene en csv regional.
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

// "2026-07" o "202607" → "202607"
export function normalizarPeriodo(period) {
    const per = String(period || '').replace(/-/g, '').trim();
    if (!/^\d{6}$/.test(per)) {
        throw new SunatApiError(`Periodo inválido: "${period}". Debe tener formato AAAAMM.`);
    }
    return per;
}
