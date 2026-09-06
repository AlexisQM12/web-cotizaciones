import { NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/firebase-admin';
import { getSireToken, fetchSireProposal } from '@/lib/accounting/sunatApi';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const empresaId = searchParams.get('empresaId');
        const companyProfileId = searchParams.get('companyProfileId');
        const period = searchParams.get('period'); // e.g. "2023-10"
        const type = searchParams.get('type'); // "RCE" (Compras) or "RVIE" (Ventas)

        if (!companyProfileId || !period || !type) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos (companyProfileId, period, type).' }, { status: 400 });
        }

        // Fetch credentials
        let hasRealCredentials = false;
        let configData = null;
        if (empresaId) {
            const configDoc = await getTenantCollection(empresaId, 'accounting_config').doc(companyProfileId).get();
            if (configDoc.exists) {
                configData = configDoc.data();
                if (configData.clientId && configData.clientSecret && configData.solUser && configData.solPass && configData.ruc) {
                    hasRealCredentials = true;
                }
            }
        }

        if (hasRealCredentials) {
            try {
                // 1. Get Token
                const token = await getSireToken({
                    clientId: configData.clientId,
                    clientSecret: configData.clientSecret,
                    ruc: configData.ruc,
                    solUser: configData.solUser,
                    solPassword: configData.solPass
                });

                // 2. Fetch Proposal
                const data = await fetchSireProposal({
                    token,
                    type,
                    period,
                    page: 1,
                    perPage: 100
                });

                // 3. Map to UI format
                // API SIRE returns an array of objects inside some property, usually `comprobantes` or `registros`.
                // For simplicity, we assume `data` contains the raw JSON from SUNAT.
                // We'll extract `registros` or fallback to mapping the structure safely.
                const records = (data.comprobantes || data.registros || []).map((r, i) => ({
                    id: r.numId || r.codigo || `SUNAT-${i}`,
                    tipoComprobante: r.codTipoCDP || r.codComp || '01',
                    serie: r.numSerieCDP || r.numSerie || '-',
                    numero: r.numCDP || r.numComp || '-',
                    fechaEmision: r.fecEmision || '-',
                    ruc: r.numDocIdentidad || r.numDoc || '-',
                    razonSocial: r.nomRazonSocial || r.nombre || 'Desconocido',
                    baseImponible: parseFloat(r.mtoBIPIGV || r.mtoBase || 0),
                    igv: parseFloat(r.mtoIGV || 0),
                    total: parseFloat(r.mtoTotalCP || r.mtoTotal || 0),
                    estadoPropuesta: r.estado || 'Aceptado'
                }));

                return NextResponse.json({
                    period,
                    type,
                    companyProfileId,
                    estadoPropuesta: data.estadoPropuesta || 'Propuesta Generada',
                    resumen: {
                        totalDocumentos: records.length,
                        totalBaseImponible: records.reduce((sum, r) => sum + (r.baseImponible || 0), 0),
                        totalIGV: records.reduce((sum, r) => sum + (r.igv || 0), 0),
                        totalMonto: records.reduce((sum, r) => sum + (r.total || 0), 0),
                    },
                    comprobantes: records,
                    rawSunat: data // Para debugging en el cliente
                });

            } catch (err) {
                console.error('[sunat/sire] Real API Error:', err);
                return NextResponse.json({ error: `Error conectando con SUNAT SIRE: ${err.message}` }, { status: 502 });
            }
        }

        // --- FALLBACK MODO PRUEBAS ---
        // Simular un pequeño retardo de red
        await new Promise(r => setTimeout(r, 800));

        // Generar data simulada
        const generateInvoices = (isVentas) => {
            const count = isVentas ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 8) + 5;
            const list = [];
            for (let i = 0; i < count; i++) {
                const num = 1000 + i;
                const subtotal = Math.floor(Math.random() * 5000) + 100;
                const igv = subtotal * 0.18;
                const total = subtotal + igv;
                list.push({
                    id: `F001-${num}`,
                    tipoComprobante: '01',
                    serie: 'F001',
                    numero: num.toString(),
                    fechaEmision: `${period}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                    ruc: isVentas ? `20${Math.floor(Math.random() * 90000000) + 10000000}` : `201000${Math.floor(Math.random() * 90000) + 10000}`,
                    razonSocial: isVentas ? `CLIENTE SIMULADO ${i}` : `PROVEEDOR SIMULADO ${i}`,
                    baseImponible: subtotal,
                    igv: igv,
                    total: total,
                    estadoPropuesta: Math.random() > 0.8 ? 'Observado' : 'Aceptado'
                });
            }
            return list;
        };

        const records = generateInvoices(type === 'RVIE');

        return NextResponse.json({
            period,
            type,
            companyProfileId,
            estadoPropuesta: 'Propuesta Generada (MODO PRUEBAS)',
            resumen: {
                totalDocumentos: records.length,
                totalBaseImponible: records.reduce((sum, r) => sum + r.baseImponible, 0),
                totalIGV: records.reduce((sum, r) => sum + r.igv, 0),
                totalMonto: records.reduce((sum, r) => sum + r.total, 0),
            },
            comprobantes: records
        });
    } catch (err) {
        console.error('[sunat/sire] Route Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    // Endpoint para "Aceptar" la propuesta del SIRE
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period');

    // Aquí iría la lógica real de SUNAT para aceptar propuesta.
    // Por ahora, simulamos el éxito incluso si hay credenciales reales,
    // para evitar aceptar propuestas reales accidentalmente.

    // Simular un pequeño retardo de red
    await new Promise(r => setTimeout(r, 1500));

    return NextResponse.json({
        success: true,
        message: `La propuesta de ${type === 'RVIE' ? 'Ventas' : 'Compras'} para el periodo ${period} ha sido aceptada exitosamente en SUNAT (Modo Pruebas / Sandbox).`,
        ticket: `TICKET-${Math.floor(Math.random() * 1000000)}`
    });
}
