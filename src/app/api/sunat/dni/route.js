import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');

    if (!dni || dni.length !== 8) {
        return NextResponse.json({ error: 'DNI inválido. Debe tener 8 dígitos.' }, { status: 400 });
    }

    try {
        const token = process.env.APIS_NET_PE_TOKEN || ''; 
        
        let url = `https://api.apis.net.pe/v1/dni?numero=${dni}`;
        let headers = {
            'Accept': 'application/json'
        };

        if (token) {
            url = `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`;
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers, next: { revalidate: 3600 } });

        if (!res.ok) {
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    numeroDocumento: dni,
                    nombres: 'JUAN PEREZ (Simulado)',
                    apellidoPaterno: 'PEREZ',
                    apellidoMaterno: 'GOMEZ',
                    nombreCompleto: 'JUAN PEREZ GOMEZ'
                });
            }
            return NextResponse.json({ error: 'No se pudo encontrar el DNI.' }, { status: 404 });
        }

        const data = await res.json();
        
        return NextResponse.json({
            numeroDocumento: data.numeroDocumento || data.dni,
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            nombreCompleto: data.nombre ? data.nombre : `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`
        });
        
    } catch (error) {
        console.error('Error fetching DNI:', error);
        return NextResponse.json({ error: 'Error interno del servidor al consultar RENIEC.' }, { status: 500 });
    }
}
