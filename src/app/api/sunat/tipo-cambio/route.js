import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const token = process.env.APIS_NET_PE_TOKEN || '';
        const headers = { 'Accept': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch('https://api.apis.net.pe/v1/tipo-cambio-sunat', { 
            headers, 
            next: { revalidate: 3600 } 
        });

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
        } else {
            console.warn('API SUNAT Tipo Cambio falló, devolviendo simulado');
            return NextResponse.json({ compra: 3.70, venta: 3.72, fecha: 'Simulado' });
        }
    } catch (error) {
        console.error('Error fetching Tipo Cambio:', error);
        return NextResponse.json({ compra: 3.70, venta: 3.72, fecha: 'Simulado' });
    }
}
