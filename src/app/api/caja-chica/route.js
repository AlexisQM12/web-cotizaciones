import { firestore, getTenantCollection } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId') || 'ayatech';

        const snap = await getTenantCollection(empresaId, 'caja_chica').orderBy('createdAt', 'desc').get();
        const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return Response.json(records);
    } catch (error) {
        console.error('[caja-chica] GET error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { empresaId = 'ayatech', ...data } = body;

        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();

        // 1. Guardar en caja_chica
        const docRef = await getTenantCollection(empresaId, 'caja_chica').add(data);

        // 2. Guardar en purchases_ledger (Contabilidad)
        const fechaEmision = data.ocrData?.fecha || new Date().toISOString().slice(0, 10);
        const d = new Date(fechaEmision);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const total = parseFloat(data.totalAmount || 0);
        const base  = Math.round((total / 1.18) * 100) / 100;
        const igv   = Math.round((total - base) * 100) / 100;

        let tipoGasto = 'SERVICIO';
        const categoriasTangibles = ['Consumibles', 'Muebleria', 'Equipo de computo', 'Herramientas'];
        if (categoriasTangibles.includes(data.category)) {
            tipoGasto = 'MERCADERIA';
        }

        const purchaseData = {
            companyProfileId: empresaId,
            period,
            fechaEmision,
            fechaVencimiento: null,
            tipoComprobante: '01',
            serie: data.ocrData?.serie || '',
            numero: data.ocrData?.numero || '',
            tipoDocProveedor: '6',
            numeroDocProveedor: data.ocrData?.ruc || '',
            proveedorName: data.ocrData?.razonSocial || data.description || 'Proveedor de Caja Chica',
            baseImponible: base,
            igv,
            noGravadas: 0, isc: 0, otrosTributos: 0,
            total,
            moneda: data.currency || 'PEN',
            tipoCambio: null,
            tipoGasto,
            aceptaCreditoFiscal: !!data.ocrData?.ruc,
            anulado: false,
            pdfUrl: data.receiptUrl || null,
            sourceKey: `caja-chica:${docRef.id}`,
            fundingSourceId: data.fundingSourceId || '',
            pendienteFactura: data.pendienteFactura || false,
            needsReview: !data.ocrData?.serie || !data.ocrData?.numero || !data.ocrData?.ruc,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const purchaseRef = await getTenantCollection(empresaId, 'purchases_ledger').add(purchaseData);

        // 3. Opcional: Proveedores
        if (data.ocrData?.ruc) {
            await firestore.collection('accounting_providers').doc(data.ocrData.ruc).set({
                tipoDoc: '6',
                numeroDoc: data.ocrData.ruc,
                razonSocial: data.ocrData.razonSocial || purchaseData.proveedorName,
                lastUsedAt: new Date().toISOString(),
            }, { merge: true });
        }

        // 4. Si es tangible o se activó el switch, registrar cada item en inventario
        if ((data.sendToInventory || categoriasTangibles.includes(data.category)) && Array.isArray(data.items)) {
            for (const item of data.items) {
                if (!item.description) continue;
                
                // Buscar si existe
                const invSnap = await getTenantCollection(empresaId, 'inventory')
                    .where('name', '==', item.description)
                    .limit(1).get();

                const qty = Number(item.quantity) || 1;
                const unitPrice = Number(item.unitPrice) || 0;

                if (!invSnap.empty) {
                    // Update
                    const invDoc = invSnap.docs[0];
                    const currentStock = Number(invDoc.data().stock) || 0;
                    await invDoc.ref.update({
                        stock: currentStock + qty,
                        // Promediar costo o poner el nuevo? Ponemos el nuevo para reflejar último precio
                        cost: unitPrice > 0 ? unitPrice : invDoc.data().cost
                    });
                } else {
                    // Create
                    await getTenantCollection(empresaId, 'inventory').add({
                        name: item.description,
                        sku: '',
                        category: data.category,
                        stock: qty,
                        minStock: 0,
                        unit: 'Unidades', // Default
                        cost: unitPrice,
                        empresaId: empresaId,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }

        // Actualizar caja chica con el ID contable
        await docRef.update({ purchaseLedgerId: purchaseRef.id });

        return Response.json({ id: docRef.id, ...data, purchaseLedgerId: purchaseRef.id }, { status: 201 });
    } catch (error) {
        console.error('[caja-chica] POST error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId') || 'ayatech';
        const id = searchParams.get('id');

        if (!id) {
            return Response.json({ error: 'ID is required' }, { status: 400 });
        }

        const docRef = getTenantCollection(empresaId, 'caja_chica').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return Response.json({ error: 'Record not found' }, { status: 404 });
        }

        const data = docSnap.data();
        const purchaseLedgerId = data.purchaseLedgerId;

        // Delete from caja chica
        await docRef.delete();

        // Delete from accounting
        if (purchaseLedgerId) {
            await getTenantCollection(empresaId, 'purchases_ledger').doc(purchaseLedgerId).delete();
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('[caja-chica] DELETE error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, empresaId = 'ayatech', ...data } = body;

        if (!id) {
            return Response.json({ error: 'ID is required' }, { status: 400 });
        }

        data.updatedAt = new Date().toISOString();

        const docRef = getTenantCollection(empresaId, 'caja_chica').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return Response.json({ error: 'Record not found' }, { status: 404 });
        }

        const existingData = docSnap.data();
        await docRef.update(data);

        const categoriasTangibles = ['Consumibles', 'Muebleria', 'Equipo de computo', 'Herramientas'];

        // Actualizar Inventario (Revertir items antiguos y sumar los nuevos)
        if (categoriasTangibles.includes(existingData.category) && Array.isArray(existingData.items)) {
            for (const item of existingData.items) {
                if (!item.description) continue;
                const invSnap = await getTenantCollection(empresaId, 'inventory').where('name', '==', item.description).limit(1).get();
                if (!invSnap.empty) {
                    const invDoc = invSnap.docs[0];
                    const currentStock = Number(invDoc.data().stock) || 0;
                    const qtyToRevert = Number(item.quantity) || 1;
                    await invDoc.ref.update({ stock: Math.max(0, currentStock - qtyToRevert) });
                }
            }
        }

        if (categoriasTangibles.includes(data.category) && Array.isArray(data.items)) {
            for (const item of data.items) {
                if (!item.description) continue;
                const invSnap = await getTenantCollection(empresaId, 'inventory').where('name', '==', item.description).limit(1).get();
                const qtyToAdd = Number(item.quantity) || 1;
                const unitPrice = Number(item.unitPrice) || 0;
                
                if (!invSnap.empty) {
                    const invDoc = invSnap.docs[0];
                    const currentStock = Number(invDoc.data().stock) || 0;
                    await invDoc.ref.update({
                        stock: currentStock + qtyToAdd,
                        cost: unitPrice > 0 ? unitPrice : invDoc.data().cost
                    });
                } else {
                    await getTenantCollection(empresaId, 'inventory').add({
                        name: item.description,
                        sku: '',
                        category: data.category,
                        stock: qtyToAdd,
                        minStock: 0,
                        unit: 'Unidades',
                        cost: unitPrice,
                        empresaId: empresaId,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }

        // Actualizar Contabilidad
        if (existingData.purchaseLedgerId) {
            const total = parseFloat(data.totalAmount || 0);
            const base  = Math.round((total / 1.18) * 100) / 100;
            const igv   = Math.round((total - base) * 100) / 100;

            let tipoGasto = 'SERVICIO';
            if (categoriasTangibles.includes(data.category)) {
                tipoGasto = 'MERCADERIA';
            }

            const purchaseUpdates = {
                proveedorName: data.ocrData?.razonSocial || data.description || 'Proveedor de Caja Chica',
                baseImponible: base,
                igv,
                total,
                moneda: data.currency || 'PEN',
                tipoGasto,
                pdfUrl: data.receiptUrl || null,
                fundingSourceId: data.fundingSourceId || '',
                pendienteFactura: data.pendienteFactura || false,
                updatedAt: new Date().toISOString(),
            };

            await getTenantCollection(empresaId, 'purchases_ledger').doc(existingData.purchaseLedgerId).update(purchaseUpdates);
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('[caja-chica] PUT error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

