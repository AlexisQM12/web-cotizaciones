import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return Response.json({ error: 'empresaId is required' }, { status: 400 });
        }

        const docRef = firestore.collection('company_settings').doc(empresaId);
        const doc = await docRef.get();

        const data = doc.exists ? doc.data() : {};
        
        return Response.json({
            smtpUser: data.smtpUser || process.env.EMAIL_USER || '',
            smtpPassword: data.smtpPassword || process.env.EMAIL_APP_PASSWORD || '',
            senderName: data.senderName || '',
            emailSignature: data.emailSignature || '',
            sigName: data.sigName || '',
            sigRole: data.sigRole || '',
            sigPhone: data.sigPhone || '',
            sigWebsite: data.sigWebsite || '',
            sigEmail: data.sigEmail || '',
            sigLogoUrl: data.sigLogoUrl || '',
            senderAliases: data.senderAliases?.length > 0 ? data.senderAliases : ['ventas@ayatech.edu.pe', 'ken.qm@ayatech.com.pe'],
            defaultTemplate: data.defaultTemplate || 'Estimado/a cliente,\n\nAdjunto le enviamos la cotización solicitada.\n\nQuedamos a su disposición para cualquier consulta.\n\nAtentamente,\nEl Equipo'
        });
    } catch (error) {
        console.error('API Error (settings/email GET):', error);
        return Response.json({ error: 'Failed to fetch email settings' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { 
            empresaId, smtpUser, smtpPassword, senderName, emailSignature, 
            sigName, sigRole, sigPhone, sigWebsite, sigEmail, sigLogoUrl,
            senderAliases, defaultTemplate 
        } = body;

        if (!empresaId) {
            return Response.json({ error: 'empresaId is required' }, { status: 400 });
        }

        const docRef = firestore.collection('company_settings').doc(empresaId);
        
        await docRef.set({
            smtpUser: smtpUser || '',
            smtpPassword: smtpPassword || '',
            senderName: senderName || '',
            emailSignature: emailSignature || '',
            sigName: sigName || '',
            sigRole: sigRole || '',
            sigPhone: sigPhone || '',
            sigWebsite: sigWebsite || '',
            sigEmail: sigEmail || '',
            sigLogoUrl: sigLogoUrl || '',
            senderAliases: senderAliases || [],
            defaultTemplate: defaultTemplate || '',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return Response.json({ success: true });
    } catch (error) {
        console.error('API Error (settings/email PUT):', error);
        return Response.json({ error: 'Failed to save email settings' }, { status: 500 });
    }
}
