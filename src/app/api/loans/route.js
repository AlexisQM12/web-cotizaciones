import { getTenantCollection } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');
        
        if (!empresaId) {
            return Response.json({ error: 'empresaId is required' }, { status: 400 });
        }

        const snapshot = await getTenantCollection(empresaId, 'cgo_loans').orderBy('createdAt', 'desc').get();
        const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // To calculate spent amount, we could also fetch purchases here, 
        // but it's more efficient if the client calculates it or we do it efficiently.
        // Let's attach the total spent by querying purchases associated with this loan.
        const purchasesSnap = await getTenantCollection(empresaId, 'purchases_ledger').get();
        const purchases = purchasesSnap.docs.map(d => d.data());

        for (const loan of loans) {
            const loanPurchases = purchases.filter(p => p.fundingSourceId === loan.id);
            loan.totalSpent = loanPurchases.reduce((acc, p) => {
                let amount = parseFloat(p.total) || 0;
                const pMoneda = p.moneda || 'PEN';
                const lMoneda = loan.currency || 'PEN';
                const tc = parseFloat(p.tipoCambio) || 1;
                
                if (lMoneda === 'PEN' && pMoneda === 'USD') {
                    amount = amount * tc;
                } else if (lMoneda === 'USD' && pMoneda === 'PEN') {
                    amount = amount / tc;
                }
                return acc + amount;
            }, 0);
            loan.availableBalance = Math.max(0, loan.amount - loan.totalSpent);
        }

        return Response.json(loans);
    } catch (e) {
        console.error('[loans API] GET Error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { empresaId, entity, amount, currency, interestRate, installments, startDate, monthlyPayment, status } = body;

        if (!empresaId || !entity || !amount) {
            return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const data = {
            entity,
            amount: parseFloat(amount) || 0,
            currency: currency || 'PEN',
            interestRate: parseFloat(interestRate) || 0,
            installments: parseInt(installments, 10) || 1,
            startDate: startDate || new Date().toISOString().split('T')[0],
            monthlyPayment: parseFloat(monthlyPayment) || 0,
            status: status || 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await getTenantCollection(empresaId, 'cgo_loans').add(data);
        return Response.json({ success: true, id: docRef.id, ...data });
    } catch (e) {
        console.error('[loans API] POST Error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, empresaId, ...updates } = body;

        if (!id || !empresaId) {
            return Response.json({ error: 'id y empresaId requeridos' }, { status: 400 });
        }

        const allowedFields = ['entity', 'amount', 'currency', 'interestRate', 'installments', 'startDate', 'monthlyPayment', 'status'];
        const dataToUpdate = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                if (['amount', 'interestRate', 'monthlyPayment'].includes(field)) {
                    dataToUpdate[field] = parseFloat(updates[field]) || 0;
                } else if (field === 'installments') {
                    dataToUpdate[field] = parseInt(updates[field], 10) || 1;
                } else {
                    dataToUpdate[field] = updates[field];
                }
            }
        }
        dataToUpdate.updatedAt = new Date().toISOString();

        await getTenantCollection(empresaId, 'cgo_loans').doc(id).update(dataToUpdate);
        return Response.json({ success: true });
    } catch (e) {
        console.error('[loans API] PUT Error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const empresaId = searchParams.get('empresaId');

        if (!id || !empresaId) {
            return Response.json({ error: 'id y empresaId requeridos' }, { status: 400 });
        }

        // Check if there are purchases tied to this loan
        const purchasesSnap = await getTenantCollection(empresaId, 'purchases_ledger').where('fundingSourceId', '==', id).get();
        if (!purchasesSnap.empty) {
            return Response.json({ error: 'No se puede eliminar el préstamo porque tiene compras asociadas. Elimina o reasigna las compras primero.' }, { status: 400 });
        }

        await getTenantCollection(empresaId, 'cgo_loans').doc(id).delete();
        return Response.json({ success: true });
    } catch (e) {
        console.error('[loans API] DELETE Error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}
