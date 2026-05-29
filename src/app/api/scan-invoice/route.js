import { NextResponse } from 'next/server';

export async function POST(req) {
    return NextResponse.json({ 
        error: 'El escaneo manual con OCR ha sido desactivado temporalmente en la web principal debido a la migración a Cloud Functions. Por favor, usa el flujo automático enviando el comprobante por correo.' 
    }, { status: 501 });
}
