import { getTenantCollection } from '@/lib/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');
        const userId = searchParams.get('userId');

        if (!empresaId || !userId) {
            return Response.json({ error: 'Falta empresaId o userId' }, { status: 400 });
        }

        const tasks = [];

        // 1. Fetch independent tasks
        const independentTasksSnap = await getTenantCollection(empresaId, 'tasks')
            .where('assigneeIds', 'array-contains', userId)
            .get();

        independentTasksSnap.forEach(doc => {
            const data = doc.data();
            tasks.push({
                ...data,
                id: doc.id,
                source: 'independent'
            });
        });

        // 2. Fetch project tasks
        // Usually tasks are in approved quotations
        const quotationsSnap = await getTenantCollection(empresaId, 'quotations')
            .where('quotationStatus', 'in', ['aprobada', 'completado', 'pendiente_factura'])
            .get();

        quotationsSnap.forEach(doc => {
            const qData = doc.data();
            if (qData.operationsData && Array.isArray(qData.operationsData.tasks)) {
                qData.operationsData.tasks.forEach(task => {
                    const assignees = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);
                    if (assignees.includes(userId)) {
                        tasks.push({
                            ...task,
                            projectId: doc.id,
                            projectCode: qData.code,
                            projectName: qData.projectName || qData.serviceDescription,
                            source: 'project'
                        });
                    }
                });
            }
        });

        return Response.json(tasks);
    } catch (err) {
        console.error('[tasks] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { empresaId, title, description, assigneeIds, dueDate, createdBy } = body;

        if (!empresaId || !title) {
            return Response.json({ error: 'Falta empresaId o title' }, { status: 400 });
        }

        const newTaskRef = getTenantCollection(empresaId, 'tasks').doc();
        const taskData = {
            title,
            description: description || '',
            assigneeIds: assigneeIds || [],
            dueDate: dueDate || null,
            status: 'pending',
            createdBy: createdBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await newTaskRef.set(taskData);

        return Response.json({ success: true, id: newTaskRef.id, ...taskData });
    } catch (err) {
        console.error('[tasks] POST error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
