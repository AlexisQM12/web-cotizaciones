import { firestore, storage } from '@/lib/firebase-admin';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const userId = formData.get('userId');
        
        if (!userId) {
            return Response.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Get and process logo if any
        let logoUrl = '';
        const logoFile = formData.get('logo');
        if (logoFile && logoFile.size > 0) {
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            const ext = logoFile.name.split('.').pop() || 'png';
            const filename = `companies/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const bucket = storage.bucket();
            const file = bucket.file(filename);
            await file.save(buffer, {
                metadata: { contentType: logoFile.type }
            });
            await file.makePublic();
            logoUrl = file.publicUrl();
        }

        // 2. Create the company profile
        const ruc = formData.get('ruc');
        const razonSocial = formData.get('razonSocial');
        
        const companyData = {
            name: razonSocial,
            ruc: ruc,
            address: formData.get('direccionFiscal') || '',
            email: '',
            phone: '',
            website: '',
            conditions: '',
            accounts: [],
            isDefault: true,
            logoUrl: logoUrl,
            createdAt: new Date().toISOString()
        };
        
        const companyRef = getTenantDoc();
        await companyRef.set(companyData);
        const companyId = companyRef.id;

        // 3. Create accounting config
        const accountingData = {
            companyProfileId: companyId,
            companyType: formData.get('companyType'),
            taxRegime: formData.get('taxRegime'),
            ruc: ruc,
            razonSocial: razonSocial,
            direccionFiscal: formData.get('direccionFiscal') || '',
            fechaInicioActividades: formData.get('fechaInicioActividades') || null,
            esBuenContribuyente: formData.get('esBuenContribuyente') === 'true',
            tieneTrabajadores: formData.get('tieneTrabajadores') === 'true',
            ingresosAnualesProyectados: parseFloat(formData.get('ingresosAnualesProyectados')) || 0,
            coeficienteRenta: parseFloat(formData.get('coeficienteRenta')) || 0.015,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await getTenantCollection(empresaId, 'accounting_config').doc(companyId).set(accountingData);

        // 4. Update the user to link them to this company
        await firestore.collection('users').doc(userId).update({
            empresaId: companyId,
            updatedAt: new Date().toISOString()
        });

        return Response.json({ success: true, companyId });
    } catch (error) {
        console.error('Onboarding Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
