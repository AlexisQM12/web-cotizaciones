'use client';
// Distintivo de la tienda (Amazon / AliExpress / Alibaba / otra).
//
// Por defecto dibuja una insignia con el nombre sobre el color de la marca —
// sin depender de imágenes externas, que se romperían si la tienda cambia sus
// URLs y además serían material de terceros servido desde su servidor.
//
// Si prefieres los logotipos reales, basta con dejar el archivo en
// `public/tiendas/<id>.png` (amazon.png, aliexpress.png, alibaba.png): este
// componente lo intenta primero y sólo cae a la insignia si no existe. No hay
// que tocar código para eso.

import { useEffect, useRef, useState } from 'react';
import { tiendaDe } from '@/lib/tiendas';

export default function TiendaLogo({ tienda, alto = 22 }) {
    const t = tiendaDe(tienda);
    const [sinImagen, setSinImagen] = useState(false);
    const imgRef = useRef(null);

    // onError por sí solo no basta: el HTML llega renderizado del servidor, el
    // navegador intenta cargar la imagen de inmediato y, si no existe, falla
    // ANTES de que React hidrate y enganche el handler — el evento se pierde y
    // quedaba el ícono de imagen rota en vez de la insignia. Al montar se
    // comprueba si ya falló (complete && naturalWidth === 0).
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.complete && img.naturalWidth === 0) setSinImagen(true);
    }, [t.id]);

    if (!sinImagen && t.id !== 'otra') {
        return (
            <img
                ref={imgRef}
                src={`/tiendas/${t.id}.png`}
                alt={t.nombre}
                style={{ height: alto, maxWidth: 110, objectFit: 'contain', display: 'block' }}
                onError={() => setSinImagen(true)}
            />
        );
    }

    return (
        <span
            title={t.nombre}
            style={{
                display: 'inline-flex', alignItems: 'center',
                height: alto, padding: '0 0.6rem',
                background: t.color, color: t.colorTexto,
                borderRadius: 6, fontSize: '0.74rem', fontWeight: 800,
                letterSpacing: '0.01em', whiteSpace: 'nowrap',
            }}
        >
            {t.nombre}
        </span>
    );
}
