import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

// Reemplazar o mover al archivo .env para máxima seguridad
const AYA_API_KEY = process.env.AYA_PUBLIC_API_KEY || 'cgo-aya-public-api-v1-9382';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const apiKey = req.headers.get('x-api-key');

        // 1. Configuración de CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // En prod puedes cambiar '*' por 'https://ayatech.com'
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        };

        // 2. Validación de API Key
        if (apiKey !== AYA_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        // 3. Validación de Email
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: corsHeaders });
        }

        // 4. Buscar en Firestore (CGO-Pymes usa el tenant 'ayatech' por defecto)
        // Buscamos todas las cotizaciones de la empresa 'ayatech'
        const quotationsRef = firestore.collection('tenants').doc('ayatech').collection('cgo_quotations');
        const snapshot = await quotationsRef.get(); // Obtenemos todas y filtramos en memoria, o usamos queries si están indexadas

        // Filtrado en memoria (seguro si no hay cientos de miles, de lo contrario requiere index compuesto)
        const allowedStatuses = ['pendiente_oc', 'aprobada', 'en_proceso', 'completado', 'pendiente_factura'];
        
        const clientProjects = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Verificamos estado
            if (!allowedStatuses.includes(data.quotationStatus)) return;
            
            // Verificamos email
            const clientEmail = (data.clientData?.email || data.client?.email || '').toLowerCase();
            if (clientEmail !== email.toLowerCase()) return;

            // Sanitización: Solo enviamos datos NO confidenciales
            clientProjects.push({
                id: doc.id,
                title: data.projectName || data.serviceDescription || 'Proyecto',
                status: data.quotationStatus,
                description: data.serviceDescription || '',
                code: data.code || doc.id.slice(0, 6).toUpperCase(),
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                clientLogo: data.clientData?.logoUrl || data.client?.logoUrl || data.clientData?.logo || null,
                // URLs para descargar documentos si existen
                quotationPdfUrl: data.pdfUrl || null,
                ocPdfUrl: data.ocPdfUrl || null,
                invoicePdfUrl: data.invoicePdfUrl || null,
                projectDocuments: data.projectDocuments || [],
                // Extraer el porcentaje de progreso (OperationsData)
                progress: calculateProgress(data.operationsData),
                operationsData: data.operationsData || null
            });
        });

        return NextResponse.json(clientProjects, { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error('[API Public Client Projects] Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}

export async function OPTIONS() {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// Función auxiliar para calcular progreso
function calculateProgress(opData) {
    if (!opData || !opData.phases || opData.phases.length === 0) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;

    opData.phases.forEach(phase => {
        if (phase.tasks && phase.tasks.length > 0) {
            totalTasks += phase.tasks.length;
            completedTasks += phase.tasks.filter(t => t.completed).length;
        }
    });

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
}
