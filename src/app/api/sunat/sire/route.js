import { NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/firebase-admin';
import {
    obtenerPropuesta, recuperarTicket, aceptarPropuesta, SunatApiError,
} from '@/lib/accounting/sunatApi';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';

// La descarga de la propuesta es un proceso por ticket: puede tardar. Damos
// margen a la función y, si aun así no termina, devolvemos el ticket para que el
// cliente siga consultando (ver respuesta 202 más abajo).
export const maxDuration = 60;

// Presupuesto de espera dentro de una sola petición HTTP. Si el ticket no está
// listo en ese lapso no es un error: se devuelve el numTicket y se reintenta.
const INTENTOS_POR_PETICION = 7;
const ESPERA_MS             = 3000;

async function cargarCredenciales(empresaId, companyProfileId) {
    if (!empresaId) return null;
    const snap = await getTenantCollection(empresaId, 'accounting_config').doc(companyProfileId).get();
    if (!snap.exists) return null;

    const c = snap.data();
    const completo = c.clientId && c.clientSecret && c.solUser && c.solPass && c.ruc;
    if (!completo) return null;

    return {
        clientId:     c.clientId,
        clientSecret: c.clientSecret,
        ruc:          c.ruc,
        solUser:      c.solUser,
        solPassword:  c.solPass,
    };
}

function resumir(comprobantes) {
    const usable = comprobantes.filter(c => !c.parcial);
    return {
        totalDocumentos:    comprobantes.length,
        totalBaseImponible: usable.reduce((s, c) => s + (c.baseImponible || 0), 0),
        totalIGV:           usable.reduce((s, c) => s + (c.igv || 0), 0),
        totalMonto:         usable.reduce((s, c) => s + (c.total || 0), 0),
        filasNoParseadas:   comprobantes.length - usable.length,
    };
}

// `modo` viaja también en los errores: si no, la UI no puede decir si está
// conectada a SUNAT o en pruebas justo cuando falla, que es cuando más importa.
function manejarError(err, contexto, modo = null) {
    const authRes = respuestaDeAuthError(err);
    if (authRes) return authRes;
    console.error(`[sunat/sire] ${contexto}:`, err);
    if (err instanceof SunatApiError) {
        return NextResponse.json({
            error:      err.message,
            cod:        err.cod || null,
            errores:    err.errors || [],
            fuente:     'SUNAT',
            modo,
            // 429: la UI debe esperar antes de reintentar, no insistir.
            rateLimited: err.status === 429,
        }, { status: err.status && err.status >= 400 && err.status < 500 ? err.status : 502 });
    }
    return NextResponse.json({ error: err.message, fuente: 'CGO', modo }, { status: 500 });
}

// GET /api/sunat/sire?empresaId=&companyProfileId=&period=YYYY-MM&type=RVIE|RCE
//   &numTicket=...  (opcional: retoma un ticket ya solicitado en vez de pedir otro)
export async function GET(request) {
    let modo = null;
    try {
        const { searchParams } = new URL(request.url);
        const empresaId        = searchParams.get('empresaId');
        const companyProfileId = searchParams.get('companyProfileId');
        const period           = searchParams.get('period');
        const type             = searchParams.get('type');
        const numTicket        = searchParams.get('numTicket');

        if (!companyProfileId || !period || !type) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos (companyProfileId, period, type).' }, { status: 400 });
        }
        if (!['RVIE', 'RCE'].includes(String(type).toUpperCase())) {
            return NextResponse.json({ error: 'type debe ser RVIE o RCE.' }, { status: 400 });
        }

        await autorizarTenant(request, empresaId || companyProfileId);

        const credenciales = await cargarCredenciales(empresaId, companyProfileId);
        modo = credenciales ? 'REAL' : 'PRUEBAS';

        // ── Sin credenciales: modo pruebas con datos simulados ───────────────
        if (!credenciales) return NextResponse.json(respuestaSimulada(period, type, companyProfileId));

        // ── Retomar un ticket ya solicitado ──────────────────────────────────
        if (numTicket) {
            const r = await recuperarTicket({ credenciales, numTicket, period, type });
            if (!r.listo) {
                return NextResponse.json({
                    modo: 'REAL', enProceso: true, numTicket: r.numTicket, estadoTicket: r.estado,
                    mensaje: `SUNAT sigue generando el archivo (estado: ${r.estado}).`,
                }, { status: 202 });
            }
            return NextResponse.json({
                modo: 'REAL', enProceso: false, period, type, companyProfileId,
                numTicket: r.numTicket, vacia: !!r.vacia,
                estadoPropuesta: r.vacia ? 'Propuesta sin comprobantes' : 'Propuesta descargada',
                mensaje: r.mensaje || null,
                resumen: resumir(r.comprobantes), comprobantes: r.comprobantes,
            });
        }

        // ── Flujo completo: solicitar → esperar ticket → descargar ───────────
        try {
            const r = await obtenerPropuesta({
                credenciales, type, period,
                intentosMax: INTENTOS_POR_PETICION, esperaMs: ESPERA_MS,
            });
            return NextResponse.json({
                modo: 'REAL', enProceso: false, period, type, companyProfileId,
                numTicket: r.numTicket, archivos: r.archivos, vacia: !!r.vacia,
                estadoPropuesta: r.vacia ? 'Propuesta sin comprobantes' : 'Propuesta descargada',
                mensaje: r.mensaje || null,
                resumen: resumir(r.comprobantes), comprobantes: r.comprobantes,
            });
        } catch (err) {
            // Si sólo se agotó la espera, el ticket sigue vivo: lo devolvemos para
            // que el cliente reintente sin volver a solicitar la generación.
            const ticketPendiente = err instanceof SunatApiError && /sigue en proceso/.test(err.message) ? err.raw : null;
            if (ticketPendiente) {
                return NextResponse.json({
                    modo: 'REAL', enProceso: true, numTicket: ticketPendiente,
                    mensaje: 'SUNAT está generando el archivo. Reintenta en unos segundos con este numTicket.',
                }, { status: 202 });
            }
            throw err;
        }
    } catch (err) {
        return manejarError(err, 'GET', modo);
    }
}

// POST /api/sunat/sire?empresaId=&companyProfileId=&period=&type=&confirmar=SI
//
// ACEPTA LA PROPUESTA EN SUNAT. Es una acción fiscal real e irreversible, por eso
// exige `confirmar=SI` explícito: ninguna llamada accidental puede dispararla.
export async function POST(request) {
    let modo = null;
    try {
        const { searchParams } = new URL(request.url);
        const empresaId        = searchParams.get('empresaId');
        const companyProfileId = searchParams.get('companyProfileId');
        const period           = searchParams.get('period');
        const type             = searchParams.get('type');
        const confirmar        = searchParams.get('confirmar');

        if (!companyProfileId || !period || !type) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos (companyProfileId, period, type).' }, { status: 400 });
        }
        if (confirmar !== 'SI') {
            return NextResponse.json({
                error: 'Aceptar la propuesta es una acción irreversible ante SUNAT. Falta el parámetro confirmar=SI.',
            }, { status: 400 });
        }

        await autorizarTenant(request, empresaId || companyProfileId);

        const credenciales = await cargarCredenciales(empresaId, companyProfileId);
        modo = credenciales ? 'REAL' : 'PRUEBAS';
        if (!credenciales) {
            // Antes esto devolvía "aceptada exitosamente" sin llamar a SUNAT.
            return NextResponse.json({
                error: 'No hay credenciales SUNAT configuradas. En modo pruebas no se puede aceptar una propuesta: ' +
                       'sería una confirmación falsa de una obligación tributaria real.',
            }, { status: 409 });
        }

        const r = await aceptarPropuesta({ credenciales, type, period });
        return NextResponse.json({
            success: true,
            numTicket: r.numTicket,
            mensaje: `Solicitud de aceptación enviada a SUNAT para ${type === 'RVIE' ? 'Ventas' : 'Compras'} del periodo ${period}.` +
                     (r.numTicket ? ` Ticket ${r.numTicket}: verifica su estado antes de darla por concluida.` : ''),
            respuesta: r.respuesta,
        });
    } catch (err) {
        return manejarError(err, 'POST aceptar propuesta', modo);
    }
}

// ── Modo pruebas ─────────────────────────────────────────────────────────────
function respuestaSimulada(period, type, companyProfileId) {
    const esVentas = String(type).toUpperCase() === 'RVIE';
    const cantidad = esVentas ? 4 : 6;
    const comprobantes = Array.from({ length: cantidad }, (_, i) => {
        const base  = 500 + i * 137;
        const igv   = Math.round(base * 0.18 * 100) / 100;
        return {
            id: `F001-${1000 + i}`,
            tipoComprobante: '01',
            serie: 'F001',
            numero: String(1000 + i),
            fechaEmision: `${String(i + 1).padStart(2, '0')}/${period.split('-')[1]}/${period.split('-')[0]}`,
            ruc: `20${100000000 + i}`,
            razonSocial: esVentas ? `CLIENTE SIMULADO ${i + 1}` : `PROVEEDOR SIMULADO ${i + 1}`,
            baseImponible: base,
            igv,
            total: Math.round((base + igv) * 100) / 100,
            moneda: 'PEN',
            parcial: false,
        };
    });

    return {
        modo: 'PRUEBAS',
        enProceso: false,
        period, type, companyProfileId,
        estadoPropuesta: 'Datos simulados — sin credenciales SUNAT configuradas',
        resumen: resumir(comprobantes),
        comprobantes,
    };
}
