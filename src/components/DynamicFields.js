'use client';
// Renderiza los campos específicos del rubro de cada empresa (definidos en
// tenants/{empresaId}/cgo_settings/*). Los valores viven en un mapa aparte
// (`attributes`) para no mezclarlos con los campos núcleo del sistema.

const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '0.4rem',
};

const inputStyle = {
    width: '100%',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
};

export function DynamicFields({ fields, values, onChange, columns = 2 }) {
    if (!fields || fields.length === 0) return null;

    const handle = (key, value) => onChange({ ...values, [key]: value });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '0.75rem' }}>
            {fields.map(field => {
                const value = values?.[field.key] ?? '';
                return (
                    <div key={field.key}>
                        <label style={labelStyle}>
                            {field.label}
                            {field.unit ? ` (${field.unit})` : ''}
                            {field.required ? ' *' : ''}
                        </label>

                        {field.type === 'select' ? (
                            <select
                                value={value}
                                required={field.required}
                                onChange={(e) => handle(field.key, e.target.value)}
                                style={{ ...inputStyle, background: '#fff' }}
                            >
                                <option value="">— Seleccionar —</option>
                                {field.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                value={value}
                                required={field.required}
                                step={field.type === 'number' ? (field.step || '1') : undefined}
                                min={field.type === 'number' ? '0' : undefined}
                                placeholder={field.help || ''}
                                onChange={(e) => handle(field.key, e.target.value)}
                                style={inputStyle}
                            />
                        )}

                        {field.help && field.type === 'select' && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{field.help}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
