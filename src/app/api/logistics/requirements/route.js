import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';

const LISTS_COL  = 'logistics_lists';
const QUOTES_COL = 'logistics_quotes';

// ── GET: todas las listas de requerimientos ─────────────────────────────────
export async function GET() {
    try {
        const snap = await firestore.collection(LISTS_COL)
            .orderBy('createdAt', 'desc').limit(50).get();
        const lists = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                name: data.name,
                laboratorio: data.laboratorio || '',
                solicitante: data.solicitante || '',
                itemCount: (data.items || []).length,
                createdAt: data.createdAt,
            };
        });
        return NextResponse.json({ lists });
    } catch (err) {
        console.error('[logistics/requirements GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── POST: subir Excel de requerimientos (formato REGISTRO DE REQUERIMIENTOS) ─
export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        if (!file || !file.name) {
            return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const wb = XLSX.read(buffer, { type: 'buffer' });

        // Buscar la hoja de registro (primera que contenga "REQUERIMIENTO" o la primera)
        const sheetName = wb.SheetNames.find(n => /requerimiento/i.test(n)) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

        // Metadatos de cabecera (filas 2-4 del formato)
        const findMeta = (label) => {
            for (const row of rows.slice(0, 6)) {
                const idx = (row || []).findIndex(c => typeof c === 'string' && c.toUpperCase().includes(label));
                if (idx !== -1) {
                    const val = (row || []).slice(idx + 1).find(c => c !== null && String(c).trim() !== '');
                    if (val) return String(val).trim();
                }
            }
            return '';
        };
        const laboratorio = findMeta('LABORATORIO');
        const solicitante = findMeta('SOLICITANTE');
        const responsable = findMeta('RESPONSABLE');

        // Localizar la fila de encabezados de la tabla (contiene "NOMBRE DEL BIEN")
        const headerRowIdx = rows.findIndex(row =>
            (row || []).some(c => typeof c === 'string' && /NOMBRE\s+DEL\s+BIEN/i.test(c))
        );
        if (headerRowIdx === -1) {
            return NextResponse.json({
                error: 'No se encontró la fila de encabezados ("NOMBRE DEL BIEN O SERVICIO"). Verifica que el archivo use el formato de Registro de Requerimientos.',
            }, { status: 400 });
        }

        const headerRow = rows[headerRowIdx];
        const colOf = (re) => headerRow.findIndex(c => typeof c === 'string' && re.test(c));
        const cols = {
            n:        colOf(/^N/i),
            name:     colOf(/NOMBRE\s+DEL\s+BIEN/i),
            cas:      colOf(/CAS/i),
            qty:      colOf(/CANTIDAD/i),
            unit:     colOf(/UNIDAD/i),
            specs:    colOf(/ESPECIFICACION/i),
            obs:      colOf(/OBSERVACION/i),
            priority: colOf(/PRIORIDAD/i),
        };

        const items = [];
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r] || [];
            const name = cols.name !== -1 ? row[cols.name] : null;
            if (!name || String(name).trim() === '') continue;
            items.push({
                n:        cols.n        !== -1 && row[cols.n]        != null ? Number(row[cols.n]) : items.length + 1,
                name:     String(name).trim(),
                cas:      cols.cas      !== -1 && row[cols.cas]      != null ? String(row[cols.cas]).trim() : '',
                quantity: cols.qty      !== -1 && row[cols.qty]      != null ? Number(row[cols.qty]) || 0 : 0,
                unit:     cols.unit     !== -1 && row[cols.unit]     != null ? String(row[cols.unit]).trim() : '',
                specs:    cols.specs    !== -1 && row[cols.specs]    != null ? String(row[cols.specs]).trim() : '',
                obs:      cols.obs      !== -1 && row[cols.obs]      != null ? String(row[cols.obs]).trim() : '',
                priority: cols.priority !== -1 && row[cols.priority] != null ? Number(row[cols.priority]) || 0 : 0,
            });
        }

        if (items.length === 0) {
            return NextResponse.json({ error: 'No se encontraron ítems en el archivo.' }, { status: 400 });
        }

        const doc = {
            name: file.name.replace(/\.(xlsx|xlsm|xls)$/i, ''),
            laboratorio,
            solicitante,
            responsable,
            items,
            createdAt: new Date().toISOString(),
        };
        const ref = await firestore.collection(LISTS_COL).add(doc);
        return NextResponse.json({ id: ref.id, ...doc });
    } catch (err) {
        console.error('[logistics/requirements POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── DELETE ?id=xxx: eliminar lista y sus cotizaciones asociadas ─────────────
export async function DELETE(req) {
    try {
        const id = new URL(req.url).searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

        const quotesSnap = await firestore.collection(QUOTES_COL).where('listId', '==', id).get();
        const batch = firestore.batch();
        quotesSnap.docs.forEach(d => batch.delete(d.ref));
        batch.delete(firestore.collection(LISTS_COL).doc(id));
        await batch.commit();
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[logistics/requirements DELETE]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
