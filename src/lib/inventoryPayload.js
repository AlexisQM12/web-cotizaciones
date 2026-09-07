// Saneado de los campos configurables antes de guardarlos en Firestore.
// Solo se persisten las claves declaradas en la configuración del tenant, así
// un cliente no puede inyectar campos arbitrarios ni pisar campos núcleo.

export function sanitizeAttributes(attributes, config) {
    const clean = {};
    if (!attributes || typeof attributes !== 'object') return clean;

    for (const field of config?.extraFields || []) {
        const value = attributes[field.key];
        if (value === undefined || value === null || value === '') continue;

        if (field.type === 'number') {
            const n = Number(value);
            if (!Number.isNaN(n)) clean[field.key] = n;
        } else if (field.type === 'select') {
            // Solo se acepta una de las opciones válidas.
            if (field.options.includes(String(value))) clean[field.key] = String(value);
        } else {
            clean[field.key] = String(value).slice(0, 500);
        }
    }

    return clean;
}
