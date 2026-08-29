import { getTenantCollection } from '@/lib/firebase-admin';

export async function PUT(req, { params }) {
    try {
        const id = params.id; // task ID
        const body = await req.json();
        const { empresaId, source, projectId, status } = body;

        if (!empresaId || !source) {
            return Response.json({ error: 'Falta empresaId o source' }, { status: 400 });
        }

        if (source === 'independent') {
            await getTenantCollection(empresaId, 'tasks').doc(id).update({
                status,
                updatedAt: new Date().toISOString()
            });
            return Response.json({ success: true });
        }

        if (source === 'project') {
            if (!projectId) {
                return Response.json({ error: 'Falta projectId para tarea de proyecto' }, { status: 400 });
            }

            const qRef = getTenantCollection(empresaId, 'quotations').doc(projectId);
            const qSnap = await qRef.get();
            if (!qSnap.exists) {
                return Response.json({ error: 'Proyecto no encontrado' }, { status: 404 });
            }

            const qData = qSnap.data();
            const operationsData = qData.operationsData || {};
            const tasks = operationsData.tasks || [];

            const taskIndex = tasks.findIndex(t => t.id === id || t.id === Number(id));
            if (taskIndex === -1) {
                return Response.json({ error: 'Tarea no encontrada en el proyecto' }, { status: 404 });
            }

            // Actualizamos la tarea
            tasks[taskIndex].status = status;
            if (status === 'completed') {
                tasks[taskIndex].completed = true;
            } else {
                tasks[taskIndex].completed = false;
            }

            await qRef.update({
                'operationsData.tasks': tasks
            });

            return Response.json({ success: true });
        }

        return Response.json({ error: 'Source inválido' }, { status: 400 });

    } catch (err) {
        console.error('[tasks/:id] PUT error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
