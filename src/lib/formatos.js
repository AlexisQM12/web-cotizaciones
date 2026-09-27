// Catálogo de formatos: los documentos de la empresa que se rellenan una y
// otra vez (un ATS por trabajo, una ficha por máquina, una carta por
// practicante…).
//
// Cada plantilla es un HTML completo y autónomo —hoja A4, estilos propios y
// listo para imprimir— que vive en `public/plantillas/`. Al crear un formato se
// copia ese HTML al espacio de la empresa y desde ahí se edita: la plantilla
// original nunca se toca, así que siempre queda el molde para el siguiente.

export const TIPOS = {
    sso:       { id: 'sso',       nombre: 'Seguridad y salud', color: '#ea580c', fondo: '#fff7ed' },
    ficha:     { id: 'ficha',     nombre: 'Ficha técnica',     color: '#0284c7', fondo: '#f0f9ff' },
    manual:    { id: 'manual',    nombre: 'Manual',            color: '#7c3aed', fondo: '#f5f3ff' },
    comercial: { id: 'comercial', nombre: 'Comercial',         color: '#16a34a', fondo: '#f0fdf4' },
    rrhh:      { id: 'rrhh',      nombre: 'Personas',          color: '#db2777', fondo: '#fdf2f8' },
    libre:     { id: 'libre',     nombre: 'Otro',              color: '#64748b', fondo: '#f8fafc' },
};

export const ORDEN_TIPOS = ['sso', 'ficha', 'manual', 'comercial', 'rrhh', 'libre'];

export const tipoDe = (id) => TIPOS[id] || TIPOS.libre;

/**
 * Plantillas que vienen con la aplicación.
 *
 * `hojas` es orientativo (lo que trae el molde); `paraQue` explica en una línea
 * cuándo se duplica, que es lo que uno quiere saber al elegir.
 */
export const PLANTILLAS = [
    {
        id: 'formato-ats',
        nombre: 'Formato ATS',
        subtitulo: 'Análisis de Trabajo Seguro',
        tipo: 'sso',
        archivo: '/plantillas/formato-ats.html',
        hojas: 1,
        paraQue: 'Uno por trabajo: cambia la tarea, los riesgos y las firmas.',
    },
    {
        id: 'ficha-qt4-40',
        nombre: 'Ficha técnica — Bloquetera QT4-40',
        subtitulo: 'Ficha de máquina con fotos',
        tipo: 'ficha',
        archivo: '/plantillas/ficha-qt4-40.html',
        hojas: 6,
        paraQue: 'Molde de ficha con fotos: sirve para otra máquina cambiando datos e imágenes.',
        pesada: true,
    },
    {
        id: 'ficha-adoquinera-mod-lab',
        nombre: 'Ficha técnica — Adoquinera MOD-LAB',
        subtitulo: 'Ficha de máquina, sin fotos',
        tipo: 'ficha',
        archivo: '/plantillas/ficha-adoquinera-mod-lab.html',
        hojas: 9,
        paraQue: 'La misma estructura de ficha, más larga y sin fotos incrustadas.',
    },
    {
        id: 'manual-flexometro-dr-j801',
        nombre: 'Manual de operación — Flexómetro DR-J801',
        subtitulo: 'Manual de máquina',
        tipo: 'manual',
        archivo: '/plantillas/manual-flexometro-dr-j801.html',
        hojas: 7,
        paraQue: 'Estructura de manual (uso, mantenimiento, seguridad) para otra máquina.',
        pesada: true,
    },
    {
        id: 'brochure',
        nombre: 'Brochure corporativo',
        subtitulo: 'Presentación de la empresa',
        tipo: 'comercial',
        archivo: '/plantillas/brochure.html',
        hojas: 4,
        paraQue: 'Se duplica para actualizarlo sin perder la versión anterior.',
    },
    {
        id: 'carta-aceptacion-practicas',
        nombre: 'Carta de aceptación de prácticas',
        subtitulo: 'Una por practicante',
        tipo: 'rrhh',
        archivo: '/plantillas/carta-aceptacion-practicas.html',
        hojas: 1,
        paraQue: 'Solo cambian nombre, fechas y área.',
    },
    {
        id: 'convocatoria-practicante',
        nombre: 'Convocatoria de practicante',
        subtitulo: 'Aviso de puesto',
        tipo: 'rrhh',
        archivo: '/plantillas/convocatoria-practicante.html',
        hojas: 1,
        paraQue: 'Se reusa cambiando el puesto y los requisitos.',
    },
];

export const plantillaDe = (id) => PLANTILLAS.find(p => p.id === id) || null;

/** Nombre inicial de un formato nuevo: el de la plantilla con la fecha. */
export function nombreSugerido(plantilla) {
    const hoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${plantilla?.nombre || 'Formato'} — ${hoy}`;
}

// ── Utilidades sobre el HTML del documento ──────────────────────────────────

/**
 * Título que se lee dentro del propio HTML (<title>), para que al importar un
 * documento suelto el formato no se llame "documento.html".
 */
export function tituloDelHtml(html) {
    const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || '');
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

/** Cuántas hojas A4 trae el documento (los `.page` del molde). */
export function contarHojas(html) {
    const m = (html || '').match(/class="[^"]*\bpage\b[^"]*"/g);
    return m ? m.length : 0;
}
