import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const ruc = searchParams.get('ruc');

    if (!ruc || ruc.length !== 11) {
        return NextResponse.json({ error: 'RUC inválido. Debe tener 11 dígitos.' }, { status: 400 });
    }

    try {
        // Intenta usar el API v1 público de apis.net.pe que muchas veces no requiere token para pruebas básicas
        // o si tienes un token, usa la v2.
        const token = process.env.APIS_NET_PE_TOKEN || ''; 
        
        let url = `https://api.apis.net.pe/v1/ruc?numero=${ruc}`;
        let headers = {
            'Accept': 'application/json'
        };

        if (token) {
            url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`;
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers, next: { revalidate: 3600 } }); // caché de 1h

        if (!res.ok) {
            // Fallback para testing local si la API pública falla o pide token
            console.warn('API SUNAT falló, usando datos simulados para desarrollo.');
            return NextResponse.json({
                numeroDocumento: ruc,
                razonSocial: 'EMPRESA DE PRUEBA S.A.C. (Simulado)',
                estado: 'ACTIVO',
                condicion: 'HABIDO',
                direccion: 'AV. LOS INCAS 123 - LIMA',
                ubigeo: '150101'
            });
        }

        const data = await res.json();
        
        // Mapear la respuesta para que la plataforma frontend la consuma de forma estandarizada
        return NextResponse.json({
            numeroDocumento: data.numeroDocumento || data.ruc,
            razonSocial: data.razonSocial || data.nombre,
            estado: data.estado,
            condicion: data.condicion,
            direccion: data.direccion || '',
            ubigeo: data.ubigeo || '',
            distrito: data.distrito || '',
            provincia: data.provincia || '',
            departamento: data.departamento || ''
        });
        
    } catch (error) {
        console.error('Error fetching RUC:', error);
        return NextResponse.json({ error: 'Error interno del servidor al consultar SUNAT.' }, { status: 500 });
    }
}
