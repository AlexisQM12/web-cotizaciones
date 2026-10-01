// Comprobación de la configuración de inventario antes de desplegar.
//
// El error #31 de React ("objects are not valid as a React child") no lo pilla
// ni el build ni el linter: el JSX es válido y lo que falla es la FORMA del
// dato en tiempo de ejecución. Aquí se renderiza de verdad con la misma
// configuración que sirve el servidor, y además se revisa el código de la
// pantalla en busca de familias usadas como si todavía fueran texto.

import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveInventoryConfig, fieldsForCategory } from '../src/lib/cgoConfig.js';

const h = React.createElement;
let fallos = 0;
const comprobar = (ok, mensaje) => {
  console.log(`  ${ok ? 'OK  ' : 'MAL '} ${mensaje}`);
  if (!ok) fallos += 1;
};

// ── 1. La forma que el UI da por supuesta ───────────────────────────────────
for (const raw of [null, { preset: 'aceros' }, { preset: 'comestibles' }, { preset: 'general' }]) {
  const nombre = raw?.preset || '(sin configurar)';
  const config = resolveInventoryConfig(raw);
  console.log(`\n--- rubro ${nombre} · ${config.categories.length} familias`);

  comprobar(
    config.categories.every(c => c && typeof c.label === 'string' && Array.isArray(c.fields)),
    'toda familia es { label: string, fields: [] }'
  );

  let html = '';
  try {
    html = renderToStaticMarkup(
      h('select', { name: 'category', defaultValue: '' },
        h('option', { value: '' }, 'Sin clasificar'),
        ...config.categories.map(cat => h('option', { key: cat.label, value: cat.label }, cat.label)),
      ),
    );
    comprobar(true, 'el selector de familias renderiza');
  } catch (e) {
    comprobar(false, `el selector LANZA: ${String(e.message).split('\n')[0]}`);
  }
  comprobar(!html.includes('[object Object]'), 'ninguna familia sale como [object Object]');

  for (const fam of config.categories) {
    const campos = fieldsForCategory(config, fam.label).map(f => f.key);
    comprobar(campos.length > 0, `"${fam.label}" → ${campos.join(', ') || 'sin campos'}`);
    comprobar(
      campos.every(k => fam.fields.includes(k)),
      `"${fam.label}" no arrastra campos de otra familia`
    );
  }

  comprobar(
    fieldsForCategory(config, 'Familia inexistente').length === config.extraFields.length,
    'una familia desconocida ofrece todos los campos del rubro'
  );
}

// ── 2. Acería: lo que de verdad pidió el cliente ────────────────────────────
console.log('\n--- acería: lo que distingue una familia de la otra');
const aceros = resolveInventoryConfig({ preset: 'aceros' });
const campos = etiqueta => fieldsForCategory(aceros, etiqueta).map(f => f.key);
const planchas = campos('Planchas metálicas');
const ejes = campos('Ejes redondos sólidos');
comprobar(planchas.includes('ancho') && !planchas.includes('diametro'), 'plancha: ancho sí, diámetro no');
comprobar(ejes.includes('diametro') && !ejes.includes('ancho'), 'eje: diámetro sí, ancho no');
comprobar(planchas.includes('precioVenta') && ejes.includes('precioVenta'), 'las dos llevan precio de venta');

// ── 3. La pantalla, leída como texto ────────────────────────────────────────
// Busca familias tratadas como si fueran texto suelto: es exactamente el
// descuido que produjo el #31 al cambiarles la forma.
console.log('\n--- src/app/inventory/page.js');
const src = fs.readFileSync(new URL('../src/app/inventory/page.js', import.meta.url), 'utf8');
const sospechas = [
  [/categories\.map\(\s*(\w+)\s*=>[\s\S]{0,400}?\{\1\}/, 'una familia se renderiza entera en vez de su .label'],
  [/categories\.includes\(/, 'includes() sobre objetos: nunca acierta, usa .some(c => c.label === …)'],
  [/categories\.map\(\s*(\w+)\s*=>[\s\S]{0,400}?value=\{\1\}/, 'una familia se usa como value en vez de su .label'],
];
for (const [patron, queja] of sospechas) comprobar(!patron.test(src), `no hay ${queja}`);

console.log(fallos === 0 ? '\nTODO BIEN\n' : `\n${fallos} COMPROBACIONES FALLIDAS\n`);
process.exit(fallos === 0 ? 0 : 1);
