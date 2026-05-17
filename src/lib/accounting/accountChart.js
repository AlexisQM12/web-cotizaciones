// Plan Contable General Empresarial (PCGE 2019) — cuentas básicas usadas
// por el generador automático de asientos. Subset focalizado en operaciones
// típicas de PYME: ventas, compras, IGV, caja, clientes, proveedores, tributos.

export const ACCOUNTS = {
  // Caja y bancos
  '1011': { name: 'Caja', nature: 'ACTIVO' },
  '1041': { name: 'Cuentas corrientes operativas', nature: 'ACTIVO' },

  // Cuentas por cobrar comerciales (clientes)
  '1212': { name: 'Facturas, boletas y otros comprobantes por cobrar - Emitidas', nature: 'ACTIVO' },

  // Tributos por cobrar / pagar
  '40111': { name: 'IGV - Cuenta propia', nature: 'PASIVO', subtype: 'TRIBUTO' },
  '40171': { name: 'Renta de Tercera Categoría', nature: 'PASIVO', subtype: 'TRIBUTO' },
  '40172': { name: 'Renta de Tercera - Pagos a cuenta', nature: 'PASIVO', subtype: 'TRIBUTO' },

  // Cuentas por pagar comerciales (proveedores)
  '4212': { name: 'Facturas, boletas y otros comprobantes por pagar - Emitidas', nature: 'PASIVO' },

  // Compras
  '6011': { name: 'Mercaderías - Compras nacionales', nature: 'GASTO' },
  '6311': { name: 'Servicios prestados por terceros', nature: 'GASTO' },
  '6591': { name: 'Otros gastos de gestión', nature: 'GASTO' },

  // Ventas
  '7011': { name: 'Mercaderías - Ventas nacionales', nature: 'INGRESO' },
  '7041': { name: 'Servicios - Ventas', nature: 'INGRESO' },

  // Resultado
  '8911': { name: 'Determinación del Resultado del Ejercicio', nature: 'RESULTADO' },
};

// Cuenta de IGV crédito fiscal (compras)
export const IGV_CREDITO_FISCAL = '40111'; // se diferencia por movimiento débito/haber

// Naturalezas
export const NATURE = {
  ACTIVO: 'ACTIVO',
  PASIVO: 'PASIVO',
  PATRIMONIO: 'PATRIMONIO',
  INGRESO: 'INGRESO',
  GASTO: 'GASTO',
  RESULTADO: 'RESULTADO',
};

// Devuelve la cuenta de venta según el tipo de operación
export function getSalesAccount(type = 'SERVICIO') {
  return type === 'MERCADERIA' ? '7011' : '7041';
}

// Devuelve la cuenta de compra según el tipo de gasto
export function getPurchaseAccount(type = 'SERVICIO') {
  if (type === 'MERCADERIA') return '6011';
  if (type === 'SERVICIO') return '6311';
  return '6591';
}

export function getAccountName(code) {
  return ACCOUNTS[code]?.name || code;
}
