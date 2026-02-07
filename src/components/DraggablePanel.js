'use client';
import { useState, useRef, useEffect } from 'react';

export function DraggablePanel({ children, title = "Vista Previa PDF" }) {
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isMinimized, setIsMinimized] = useState(false);
    const panelRef = useRef(null);

    const handleMouseDown = (e) => {
        // Only start dragging if clicking on the header
        if (e.target.closest('.drag-handle')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    return (
        <div
            ref={panelRef}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: isMinimized ? '300px' : '50vw',
                height: isMinimized ? 'auto' : '80vh',
                backgroundColor: '#fff',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                borderRadius: '12px',
                overflow: 'hidden',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                transition: isMinimized ? 'width 0.3s, height 0.3s' : 'none'
            }}
        >
            {/* Header */}
            <div
                className="drag-handle"
                onMouseDown={handleMouseDown}
                style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{title}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                        title={isMinimized ? 'Maximizar' : 'Minimizar'}
                    >
                        {isMinimized ? '▢' : '−'}
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div style={{
                    flex: 1,
                    backgroundColor: '#525659',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}
