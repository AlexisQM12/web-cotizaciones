import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export async function POST(req) {
    try {
        const { action } = await req.json();

        if (!firestore) {
            return NextResponse.json({ error: 'Firebase Admin no está inicializado' }, { status: 500 });
        }

        const cacheRef = firestore.collection('scanner_state').doc('cache');
        
        if (action === 'force_rescan') {
            await cacheRef.update({
                inboxUids: [],
                sentUids: [],
                quoteLeadUids: [],
                updatedAt: new Date().toISOString()
            });
            return NextResponse.json({ success: true, message: 'Caché completo limpiado exitosamente.' });
        } 
        
        if (action === 'rescan_sent') {
            await cacheRef.update({
                sentUids: [],
                updatedAt: new Date().toISOString()
            });
            return NextResponse.json({ success: true, message: 'Caché de enviados limpiado exitosamente.' });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    } catch (error) {
        console.error('Error al limpiar caché de escáner:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
