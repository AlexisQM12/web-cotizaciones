// ── Texto con formato de los ítems de cotización ─────────────────────────────
//
// Conviven dos formatos en la base de datos y ambos deben imprimirse igual:
//
//   · HEREDADO  texto plano con marcadores:  "**negrita**", "• viñeta", saltos
//   · NUEVO     HTML del editor visual:      "<b>negrita</b><ul><li>…</li></ul>"
//
// Para no tener dos caminos de render, ambos se normalizan al MISMO árbol de
// bloques y el PDF sólo sabe pintar bloques:
//
//   [{ tipo: 'parrafo' | 'vineta', partes: [{ texto, negrita, cursiva, subrayado }] }]
//
// El parser de HTML es propio, deliberadamente: no usa DOMParser para poder
// ejecutarse (y probarse) también en Node, no sólo en el navegador.
//
// No hace falta migrar nada: `aBloques` detecta el formato de cada valor.

// Etiquetas que el editor puede producir y el PDF sabe representar.
const ETIQUETAS_PERMITIDAS = new Set(['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'ul', 'ol', 'li', 'span']);

export function pareceHtml(valor) {
    if (typeof valor !== 'string') return false;
    if (/<\/?(b|strong|i|em|u|br|p|div|ul|ol|li|span)\b[^>]*>/i.test(valor)) return true;
    // Un texto escrito en el editor SIN aplicar formato llega sin etiquetas pero
    // con sus entidades escapadas ("a &amp; b"). Sin esta segunda comprobación se
    // trataría como heredado y el "&amp;" acabaría impreso tal cual en el PDF.
    return /&(amp|lt|gt|quot|apos|nbsp|#\d+);/i.test(valor);
}

// ── Entidades ────────────────────────────────────────────────────────────────
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

function decodificar(texto) {
    return texto.replace(/&(#?\w+);/g, (completo, nombre) => {
        if (ENTIDADES[nombre] !== undefined) return ENTIDADES[nombre];
        if (/^#\d+$/.test(nombre)) return String.fromCharCode(Number(nombre.slice(1)));
        return completo;
    });
}

export function escapar(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── HTML → bloques ───────────────────────────────────────────────────────────
export function bloquesDesdeHtml(html) {
    const bloques = [];
    // Estilo activo mientras recorremos; se apila con cada etiqueta de formato.
    let estilo = { negrita: false, cursiva: false, subrayado: false };
    const pila = [];
    let actual = null;   // bloque en construcción
    let enLista = false;

    const abrirBloque = (tipo) => { actual = { tipo, partes: [] }; };
    const cerrarBloque = () => {
        if (actual && actual.partes.some(p => p.texto !== '')) bloques.push(actual);
        actual = null;
    };

    const anadirTexto = (bruto) => {
        // Los saltos y tabulaciones del HTML son espacios; los quiebres reales
        // los marcan <br> y los bloques.
        const texto = decodificar(bruto).replace(/[\n\r\t]+/g, ' ').replace(/ {2,}/g, ' ');
        if (!texto) return;
        if (!actual) abrirBloque(enLista ? 'vineta' : 'parrafo');
        const ultima = actual.partes[actual.partes.length - 1];
        if (ultima && ultima.negrita === estilo.negrita && ultima.cursiva === estilo.cursiva && ultima.subrayado === estilo.subrayado) {
            ultima.texto += texto;
        } else {
            actual.partes.push({ texto, ...estilo });
        }
    };

    const TOKEN = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|[^<]+/g;
    let m;
    while ((m = TOKEN.exec(html)) !== null) {
        const trozo = m[0];

        if (trozo[0] !== '<') { anadirTexto(trozo); continue; }

        const etiqueta = (m[1] || '').toLowerCase();
        const cierre = trozo.startsWith('</');
        if (!ETIQUETAS_PERMITIDAS.has(etiqueta)) continue; // ignorar lo desconocido

        if (etiqueta === 'br') { cerrarBloque(); abrirBloque(enLista ? 'vineta' : 'parrafo'); continue; }

        if (etiqueta === 'ul' || etiqueta === 'ol') {
            cerrarBloque();
            enLista = !cierre;
            continue;
        }

        if (etiqueta === 'li') {
            cerrarBloque();
            if (!cierre) abrirBloque('vineta');
            continue;
        }

        if (etiqueta === 'p' || etiqueta === 'div') {
            cerrarBloque();
            if (!cierre) abrirBloque(enLista ? 'vineta' : 'parrafo');
            continue;
        }

        // Etiquetas de estilo: b/strong, i/em, u (span no aporta estilo propio).
        const propiedad = (etiqueta === 'b' || etiqueta === 'strong') ? 'negrita'
                        : (etiqueta === 'i' || etiqueta === 'em')     ? 'cursiva'
                        : (etiqueta === 'u')                          ? 'subrayado'
                        : null;
        if (!propiedad) continue;

        if (!cierre) {
            pila.push({ ...estilo });
            estilo = { ...estilo, [propiedad]: true };
        } else {
            estilo = pila.pop() || { negrita: false, cursiva: false, subrayado: false };
        }
    }
    cerrarBloque();
    return bloques;
}

// ── Texto plano heredado → bloques ───────────────────────────────────────────
// Interpreta "**negrita**", "_cursiva_" y las viñetas escritas a mano.
export function bloquesDesdeTextoPlano(texto) {
    const bloques = [];
    for (const linea of String(texto ?? '').split(/\r?\n/)) {
        const recortada = linea.trim();
        if (!recortada) continue;

        const esVineta = /^[•\-\*]\s+/.test(recortada);
        const contenido = esVineta ? recortada.replace(/^[•\-\*]\s+/, '') : recortada;

        const partes = [];
        // Se parte por los marcadores conservando cuál marcó cada trozo.
        const MARCAS = /(\*\*[^*]+\*\*|__[^_]+__|_[^_]+_)/g;
        let ultimo = 0, mm;
        while ((mm = MARCAS.exec(contenido)) !== null) {
            if (mm.index > ultimo) {
                partes.push({ texto: contenido.slice(ultimo, mm.index), negrita: false, cursiva: false, subrayado: false });
            }
            const marca = mm[0];
            if (marca.startsWith('**') || marca.startsWith('__')) {
                partes.push({ texto: marca.slice(2, -2), negrita: true, cursiva: false, subrayado: false });
            } else {
                partes.push({ texto: marca.slice(1, -1), negrita: false, cursiva: true, subrayado: false });
            }
            ultimo = mm.index + marca.length;
        }
        if (ultimo < contenido.length) {
            partes.push({ texto: contenido.slice(ultimo), negrita: false, cursiva: false, subrayado: false });
        }
        if (partes.length) bloques.push({ tipo: esVineta ? 'vineta' : 'parrafo', partes });
    }
    return bloques;
}

// Punto de entrada: no importa en qué formato esté guardado el ítem.
export function aBloques(valor) {
    if (!valor) return [];
    return pareceHtml(valor) ? bloquesDesdeHtml(valor) : bloquesDesdeTextoPlano(valor);
}

// ── Utilidades ───────────────────────────────────────────────────────────────
// Versión legible sin formato (asuntos de correo, resúmenes, buscadores).
export function aTextoPlano(valor) {
    return aBloques(valor)
        .map(b => (b.tipo === 'vineta' ? '• ' : '') + b.partes.map(p => p.texto).join(''))
        .join('\n');
}

// Limpia lo que llega del editor antes de guardarlo: fuera scripts, estilos y
// atributos. Sólo sobreviven las etiquetas que el PDF sabe imprimir.
export function sanitizarHtml(html) {
    if (typeof html !== 'string') return '';
    return html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
        .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (completo, etiqueta) => {
            const t = etiqueta.toLowerCase();
            if (!ETIQUETAS_PERMITIDAS.has(t)) return '';
            // Se reescribe la etiqueta sin ningún atributo.
            return completo.startsWith('</') ? `</${t}>` : (t === 'br' ? '<br>' : `<${t}>`);
        })
        .trim();
}

// ¿El campo tiene contenido real, más allá de etiquetas vacías?
export function tieneContenido(valor) {
    return aBloques(valor).length > 0;
}

// Prepara un valor para volcarlo en RichTextEditor (que asigna directamente a
// `el.innerHTML`, sin pasar por aBloques). Si ya es HTML, se devuelve tal
// cual. Si es texto heredado con saltos de línea reales (p. ej. las
// "Condiciones" por defecto de una empresa, escritas antes de que existiera
// este editor), un textarea los mostraba bien porque conserva los \n, pero
// un <div contentEditable> los colapsa: sin este paso, el texto aparecería
// todo pegado en una sola línea la primera vez que se abre el campo.
export function paraEditorVisual(valor) {
    if (!valor) return '';
    if (pareceHtml(valor)) return valor;
    return escapar(String(valor)).replace(/\n/g, '<br>');
}
