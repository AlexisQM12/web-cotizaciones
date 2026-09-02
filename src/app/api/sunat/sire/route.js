import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const companyProfileId = searchParams.get('companyProfileId');
    const period = searchParams.get('period'); // e.g. "2023-10"
    const type = searchParams.get('type'); // "RCE" (Compras) or "RVIE" (Ventas)

    if (!companyProfileId || !period || !type) {
        return NextResponse.json({ error: 'Faltan parámetros requeridos (companyProfileId, period, type).' }, { status: 400 });
    }

    // Aquí iría la lógica para conectarse a SUNAT.
    // Como es modo de pruebas, devolveremos una respuesta simulada.

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
        estadoPropuesta: 'Propuesta Generada',
        resumen: {
            totalDocumentos: records.length,
            totalBaseImponible: records.reduce((sum, r) => sum + r.baseImponible, 0),
            totalIGV: records.reduce((sum, r) => sum + r.igv, 0),
            totalMonto: records.reduce((sum, r) => sum + r.total, 0),
        },
        comprobantes: records
    });
}

export async function POST(request) {
    // Endpoint para "Aceptar" la propuesta del SIRE
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period');

    // Simular un pequeño retardo de red
    await new Promise(r => setTimeout(r, 1500));

    return NextResponse.json({
        success: true,
        message: `La propuesta de ${type === 'RVIE' ? 'Ventas' : 'Compras'} para el periodo ${period} ha sido aceptada exitosamente en SUNAT (Modo Pruebas).`,
        ticket: `TICKET-${Math.floor(Math.random() * 1000000)}`
    });
}
