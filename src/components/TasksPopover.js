import React, { useState, useEffect } from 'react';

export function TasksPopover({ tasks, fetchTasks, user, handleSignOut }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedAssignee, setSelectedAssignee] = useState(user.uid);
    const userRoleStr = (user?.role || '').toLowerCase();
    const isAdmin = userRoleStr === 'admin' || userRoleStr === 'administrador';

    useEffect(() => {
        if (isAdmin && user.empresaId) {
            fetch(`/api/users/list?empresaId=${user.empresaId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.active) {
                        setTeamMembers(data.active);
                    }
                })
                .catch(err => console.error('Error fetching users:', err));
        }
    }, [isAdmin, user.empresaId]);

    const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.completed !== true);

    const handleToggleTask = async (task) => {
        const isCompleted = task.status === 'completed' || task.completed;
        const newStatus = isCompleted ? 'pending' : 'completed';

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
            fetchTasks();
        } catch (err) {
            console.error('Error toggling task:', err);
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
                    assigneeIds: [selectedAssignee],
                    createdBy: user.uid
                })
            });
            setNewTaskTitle('');
            setSelectedAssignee(user.uid);
            setIsAdding(false);
            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
        }
        setIsCreating(false);
    };

    return (
        <div style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            width: '320px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '400px'
        }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>Mis Tareas</h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem' }}
                    title="Añadir nueva tarea"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Add Task Form */}
            {isAdding && (
                <form onSubmit={handleCreateTask} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            placeholder="Nueva tarea..." 
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={isCreating}
                            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: isCreating ? 'not-allowed' : 'pointer' }}
                        >
                            {isCreating ? '...' : 'Ok'}
                        </button>
                    </div>
                    {isAdmin && teamMembers.length > 0 && (
                        <select 
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#f8fafc', width: '100%' }}
                        >
                            <option value={user.uid}>Para mí</option>
                            {teamMembers.filter(m => m.id !== user.uid).map(member => (
                                <option key={member.id} value={member.id}>
                                    Para: {member.displayName || member.firstName || member.email}
                                </option>
                            ))}
                        </select>
                    )}
                </form>
            )}

            {/* Task List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
                {pendingTasks.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '2rem 0' }}>No tienes tareas pendientes.</p>
                ) : (
                    pendingTasks.map(task => (
                        <div key={`${task.source}-${task.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 1rem', borderBottom: '1px solid #f8fafc' }}>
                            <input 
                                type="checkbox" 
                                checked={task.status === 'completed' || task.completed}
                                onChange={() => handleToggleTask(task)}
                                style={{ marginTop: '0.25rem', cursor: 'pointer', accentColor: '#10b981' }}
                            />
                            <div>
                                <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.85rem', color: '#1e293b', fontWeight: '500' }}>
                                    {task.title || task.name}
                                </h4>
                                {task.source === 'project' && task.projectCode && (
                                    <span style={{ fontSize: '0.65rem', color: '#2563eb', background: '#eff6ff', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 'bold' }}>
                                        {task.projectCode}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div 
                onClick={handleSignOut}
                style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    borderTop: '1px solid #f1f5f9',
                    background: '#fff'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
            </div>
        </div>
    );
}
