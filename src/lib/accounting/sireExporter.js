// Exportador SIRE — genera los archivos planos (.txt) con la estructura
// posicional exigida por SUNAT para los registros de Ventas (14.1) y Compras (8.1).
//
// Estructura del nombre de archivo SIRE:
//   LE + RUC(11) + AAAA + MM + 00 + Libro(4) + Oportunidad(2) + Estado(1) +
//   ContenidoLibro(1) + MonedaFunc(1) + IndFirma(1) + .txt
//
// Separador de campos: |
// Decimal: punto
// Terminador de línea: \r\n
//
// Códigos de libro (SIRE):
//   14.1 → Registro de Ventas e Ingresos
//    8.1 → Registro de Compras

const DELIM = '|';
const EOL   = '\r\n';

const fmt = {
  date: (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  },
  num: (n) => (typeof n === 'number' ? n.toFixed(2) : '0.00'),
  s:   (v) => (v == null ? '' : String(v).replace(/[|\r\n]/g, ' ')),
};

// ── Nombre de archivo SIRE estándar ─────────────────────────────────────────
export function buildSireFilename({
  ruc, period, libro, oportunidad = '00', estado = '1', contenido = '1', monedaFunc = '1', firma = '1',
}) {
  const [year, month] = period.split('-');
  const libroCode = libro === '14.1' ? '140100' : '080100';
  return `LE${ruc}${year}${month}00${libroCode}${oportunidad}${estado}${contenido}${monedaFunc}${firma}.txt`;
}

// ── Registro de Ventas — Formato 14.1 ───────────────────────────────────────
// Columnas (orden oficial SUNAT):
// 1. Periodo (AAAAMM00)
// 2. CUO (Código Único de Operación)
// 3. Correlativo del libro
// 4. Fecha de emisión
// 5. Fecha de vencimiento
// 6. Tipo CP (01,03,07,08,...)
// 7. Serie
// 8. Número
// 9. Tipo doc identidad cliente
// 10. Número doc identidad cliente
// 11. Razón social / nombres cliente
// 12. Valor facturado de exportación
// 13. Base imponible operación gravada
// 14. Descuento de la base imponible
// 15. IGV / IPM
// 16. Descuento del IGV
// 17. Importe exonerado
// 18. Importe inafecto
// 19. ISC
// 20. Base imponible IVAP
// 21. IVAP
// 22. Otros tributos
// 23. Total comprobante
// 24. Moneda
// 25. Tipo de cambio
// 26-29. Datos de comprobante modificado (NC/ND): tipo, serie, número, fecha
// 30. Identif. cargo
// 31. Inconsistencias
// 32. Indicador anulación
// 33. Indicador comprobante percepción
export function buildSire141({ ruc, period, sales }) {
  const periodoStr = period.replace('-', '') + '00';
  const lines = [];

  sales.forEach((s, idx) => {
    const correlativo = String(idx + 1).padStart(8, '0');
    const cuo = `M${periodoStr}${correlativo}`;
    const row = [
      periodoStr,                              // 1
      cuo,                                     // 2
      correlativo,                             // 3
      fmt.date(s.fechaEmision),                // 4
      fmt.date(s.fechaVencimiento || ''),      // 5
      s.tipoComprobante || '01',               // 6
      s.serie || '',                           // 7
      s.numero || '',                          // 8
      s.tipoDocCliente || '6',                 // 9 (6=RUC)
      s.numeroDocCliente || '',                // 10
      fmt.s(s.clienteName),                    // 11
      fmt.num(s.exportacion || 0),             // 12
      fmt.num(s.baseImponible || 0),           // 13
      fmt.num(s.descuentoBase || 0),           // 14
      fmt.num(s.igv || 0),                     // 15
      fmt.num(s.descuentoIgv || 0),            // 16
      fmt.num(s.exoneradas || 0),              // 17
      fmt.num(s.inafectas || 0),               // 18
      fmt.num(s.isc || 0),                     // 19
      fmt.num(s.baseImpIvap || 0),             // 20
      fmt.num(s.ivap || 0),                    // 21
      fmt.num(s.otrosTributos || 0),           // 22
      fmt.num(s.total || 0),                   // 23
      s.moneda || 'PEN',                       // 24
      s.tipoCambio ? s.tipoCambio.toFixed(3) : '', // 25
      s.docModTipo || '',                      // 26
      s.docModSerie || '',                     // 27
      s.docModNumero || '',                    // 28
      s.docModFecha ? fmt.date(s.docModFecha) : '', // 29
      s.idCargo || '',                         // 30
      '0',                                     // 31 inconsistencias (0=ninguna)
      s.anulado ? '1' : '0',                   // 32
      s.indPercepcion || '0',                  // 33
    ];
    lines.push(row.join(DELIM));
  });

  return {
    filename: buildSireFilename({ ruc, period, libro: '14.1' }),
    content:  lines.join(EOL) + (lines.length ? EOL : ''),
    rowCount: lines.length,
  };
}

// ── Registro de Compras — Formato 8.1 ───────────────────────────────────────
// Columnas (orden oficial SUNAT):
// 1. Periodo
// 2. CUO
// 3. Correlativo
// 4. Fecha emisión
// 5. Fecha vencimiento o pago
// 6. Tipo CP
// 7. Serie
// 8. Año emisión DUA (solo importaciones)
// 9. Número (o número DAM)
// 10. Número final (para tickets en rangos)
// 11. Tipo doc identidad proveedor
// 12. Número doc identidad proveedor
// 13. Razón social proveedor
// 14. Base imponible adq. gravadas que da derecho a crédito
// 15. IGV/IPM
// 16. Base imponible adq. gravadas que dan derecho a crédito + no gravadas
// 17. IGV
// 18. Base imponible adq. gravadas sin derecho a crédito
// 19. IGV sin derecho
// 20. Valor adq. no gravadas
// 21. ISC
// 22. Otros tributos
// 23. Total comprobante
// 24. Moneda
// 25. Tipo de cambio
// 26-29. Datos doc modificado
// 30-33. Detracción (fecha, número, tipo CP, importe)
// 34. Marca comprobante sujeto a retención
// 35. Clasificación del bien o servicio
// 36. Identificación contrato
// 37. Error tipo 1: estado de inconsistencias
export function buildSire81({ ruc, period, purchases }) {
  const periodoStr = period.replace('-', '') + '00';
  const lines = [];

  purchases.forEach((p, idx) => {
    const correlativo = String(idx + 1).padStart(8, '0');
    const cuo = `M${periodoStr}${correlativo}`;
    const baseConDerecho = p.aceptaCreditoFiscal ? (p.baseImponible || 0) : 0;
    const igvConDerecho  = p.aceptaCreditoFiscal ? (p.igv || 0)           : 0;
    const baseSinDerecho = !p.aceptaCreditoFiscal ? (p.baseImponible || 0) : 0;
    const igvSinDerecho  = !p.aceptaCreditoFiscal ? (p.igv || 0)           : 0;

    const row = [
      periodoStr,                              // 1
      cuo,                                     // 2
      correlativo,                             // 3
      fmt.date(p.fechaEmision),                // 4
      fmt.date(p.fechaVencimiento || ''),      // 5
      p.tipoComprobante || '01',               // 6
      p.serie || '',                           // 7
      p.anioDUA || '',                         // 8
      p.numero || '',                          // 9
      p.numeroFinal || '',                     // 10
      p.tipoDocProveedor || '6',               // 11
      p.numeroDocProveedor || '',              // 12
      fmt.s(p.proveedorName),                  // 13
      fmt.num(baseConDerecho),                 // 14
      fmt.num(igvConDerecho),                  // 15
      fmt.num(0),                              // 16
      fmt.num(0),                              // 17
      fmt.num(baseSinDerecho),                 // 18
      fmt.num(igvSinDerecho),                  // 19
      fmt.num(p.noGravadas || 0),              // 20
      fmt.num(p.isc || 0),                     // 21
      fmt.num(p.otrosTributos || 0),           // 22
      fmt.num(p.total || 0),                   // 23
      p.moneda || 'PEN',                       // 24
      p.tipoCambio ? p.tipoCambio.toFixed(3) : '', // 25
      p.docModTipo || '',                      // 26
      p.docModSerie || '',                     // 27
      p.docModNumero || '',                    // 28
      p.docModFecha ? fmt.date(p.docModFecha) : '', // 29
      p.detrFecha ? fmt.date(p.detrFecha) : '',// 30
      p.detrNumero || '',                      // 31
      p.detrTipoCP || '',                      // 32
      fmt.num(p.detrImporte || 0),             // 33
      p.indRetencion || '0',                   // 34
      p.clasifBien || '',                      // 35
      p.idContrato || '',                      // 36
      '0',                                     // 37
    ];
    lines.push(row.join(DELIM));
  });

  return {
    filename: buildSireFilename({ ruc, period, libro: '8.1' }),
    content:  lines.join(EOL) + (lines.length ? EOL : ''),
    rowCount: lines.length,
  };
}
