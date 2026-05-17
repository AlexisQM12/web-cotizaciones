/**
 * migrate-purchases.js
 * Migra todos los materiales con ocrData de las cotizaciones
 * hacia el purchases_ledger del módulo contable.
 * Ejecutar UNA sola vez: node migrate-purchases.js
 */
import { firestore } from './src/lib/firebase-admin.js';

const EMPRESA_ID = '6'; // AYA Technologies

async function migratePurchases() {
    console.log('🔍 Buscando cotizaciones con facturas escaneadas...\n');

    const snapshot = await firestore.collection('quotations')
        .where('empresaId', '==', EMPRESA_ID)
        .get();

    let migrated = 0;
    let skipped  = 0;
    let errors   = 0;

    for (const doc of snapshot.docs) {
        const quotation = doc.data();
        const materials = quotation.operationsData?.materials || [];

        for (const material of materials) {
            if (!material.ocrData?.amount) continue; // Sin datos OCR → saltar

            const sourceKey = `pending:${doc.id}:${material.id}`;

            // ¿Ya existe?
            const existing = await firestore.collection('purchases_ledger')
                .where('companyProfileId', '==', EMPRESA_ID)
                .where('sourceKey', '==', sourceKey)
                .limit(1).get();

            if (!existing.empty) {
                skipped++;
                continue;
            }

            // Calcular montos
            const total = parseFloat(material.ocrData.amount) || 0;
            const base  = Math.round((total / 1.18) * 100) / 100;
            const igv   = Math.round((total - base) * 100) / 100;

            const fechaEmision = material.ocrData.fecha || new Date().toISOString().slice(0, 10);
            const d = new Date(fechaEmision);
            const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            const data = {
                companyProfileId: EMPRESA_ID,
                period,
                fechaEmision,
                fechaVencimiento: null,
                tipoComprobante:  '01',
                serie:            material.ocrData.serie  || '',
                numero:           material.ocrData.numero || '',
                tipoDocProveedor: '6',
                numeroDocProveedor: material.ocrData.ruc || '',
                proveedorName:    material.ocrData.razonSocial || material.title || 'Proveedor por completar',
                baseImponible:    base,
                igv,
                noGravadas: 0, isc: 0, otrosTributos: 0,
                total,
                moneda:    'PEN',
                tipoCambio: null,
                tipoGasto: 'MERCADERIA',
                aceptaCreditoFiscal: !!material.ocrData.ruc,
                anulado:   false,
                pdfUrl:    material.attachmentUrl || null,
                sourceKey,
                sourceQuotationId:   doc.id,
                sourceMaterialTitle: material.title || null,
                needsReview: !material.ocrData.serie || !material.ocrData.numero || !material.ocrData.ruc,
                createdAt:  new Date().toISOString(),
                updatedAt:  new Date().toISOString(),
            };

            try {
                await firestore.collection('purchases_ledger').add(data);
                console.log(`  ✅ Migrado: "${material.title}" → S/ ${total} (periodo: ${period})`);
                migrated++;
            } catch (e) {
                console.error(`  ❌ Error en "${material.title}": ${e.message}`);
                errors++;
            }
        }
    }

    console.log(`\n🎉 Migración completada:`);
    console.log(`   ✅ Migrados:  ${migrated}`);
    console.log(`   ⏭  Omitidos:  ${skipped} (ya existían)`);
    console.log(`   ❌ Errores:   ${errors}`);
}

migratePurchases().catch(console.error);
