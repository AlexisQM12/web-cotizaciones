'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MisTareasPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isCreating, setIsCreating] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');

    const fetchTasks = async () => {
        if (!user?.empresaId || !user?.uid) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks?empresaId=${user.empresaId}&userId=${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, [user]);

    const handleToggleTask = async (task) => {
        const isCompleted = task.status === 'completed' || task.completed;
        const newStatus = isCompleted ? 'pending' : 'completed';

        // Optimistic UI update
        setTasks(prev => prev.map(t => {
            if (t.id === task.id && t.source === task.source) {
                return { ...t, status: newStatus, completed: !isCompleted };
            }
            return t;
        }));

        try {
            await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresaId: user.empresaId,
                    source: task.source,
                    projectId: task.projectId,
                    status: newStatus
                })
            });
            // Re-fetch to sync
            fetchTasks();
        } catch (err) {
            console.error('Error toggling task:', err);
            fetchTasks(); // Revert on error
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        setIsCreating(true);
        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresaId: user.empresaId,
                    title: newTaskTitle,
                    description: newTaskDesc,
                    assigneeIds: [user.uid],
                    createdBy: user.uid
                })
            });
            setNewTaskTitle('');
            setNewTaskDesc('');
            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
        }
        setIsCreating(false);
    };

    const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.completed !== true);
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.completed === true);

    return (
        <ProtectedRoute>
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                <NavBar />
                
                <main style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Mis Tareas</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Gestiona todas tus tareas de proyectos e independientes.</p>
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>Añadir Tarea Independiente</h2>
                        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                                type="text"
                                placeholder="Título de la tarea..."
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                required
                            />
                            <textarea 
                                placeholder="Descripción (opcional)..."
                                value={newTaskDesc}
                                onChange={e => setNewTaskDesc(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', minHeight: '80px' }}
                            />
                            <button 
                                type="submit" 
                                disabled={isCreating}
                                style={{
                                    alignSelf: 'flex-start',
                                    padding: '0.6rem 1.2rem',
                                    background: '#0f172a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: isCreating ? 'not-allowed' : 'pointer',
                                    opacity: isCreating ? 0.7 : 1
                                }}
                            >
                                {isCreating ? 'Guardando...' : 'Añadir Tarea'}
                            </button>
                        </form>
                    </div>

                    {loading ? (
                        <p style={{ color: '#64748b', textAlign: 'center' }}>Cargando tus tareas...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                    Pendientes ({pendingTasks.length})
                                </h3>
                                {pendingTasks.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>No tienes tareas pendientes. ¡Buen trabajo!</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {pendingTasks.map(task => (
                                            <TaskCard key={`${task.source}-${task.id}`} task={task} onToggle={() => handleToggleTask(task)} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                    Completadas ({completedTasks.length})
                                </h3>
                                {completedTasks.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>Aún no has completado tareas.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {completedTasks.map(task => (
                                            <TaskCard key={`${task.source}-${task.id}`} task={task} onToggle={() => handleToggleTask(task)} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}

function TaskCard({ task, onToggle }) {
    const isCompleted = task.status === 'completed' || task.completed;
    const isProject = task.source === 'project';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            background: '#ffffff',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            opacity: isCompleted ? 0.6 : 1
        }}>
            <input 
                type="checkbox" 
                checked={isCompleted}
                onChange={onToggle}
                style={{
                    width: '1.2rem',
                    height: '1.2rem',
                    marginTop: '0.2rem',
                    cursor: 'pointer',
                    accentColor: '#10b981'
                }}
            />
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        color: isCompleted ? '#64748b' : '#0f172a',
                        textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                        {task.title || task.name}
                    </h4>
                    {isProject ? (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', background: '#eff6ff', color: '#2563eb', borderRadius: '999px', fontWeight: 'bold' }}>
                            {task.projectCode || 'PROYECTO'}
                        </span>
                    ) : (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', background: '#f8fafc', color: '#475569', borderRadius: '999px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                            INDEPENDIENTE
                        </span>
                    )}
                </div>
                {task.description && (
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                        {task.description}
                    </p>
                )}
                {isProject && task.projectName && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                        Proyecto: {task.projectName}
                    </p>
                )}
            </div>
        </div>
    );
}
