// Generador automático de asientos contables a partir de operaciones
// de ventas y compras. Construye asientos balanceados (debe = haber)
// usando el plan de cuentas PCGE simplificado.

import { ACCOUNTS, getSalesAccount, getPurchaseAccount } from './accountChart.js';

const round2 = (n) => Math.round(n * 100) / 100;

let nextEntryNumber = 1;
function newEntryNumber() { return String(nextEntryNumber++).padStart(6, '0'); }

// Asiento de venta:
//   Debe:  Cliente (12)            total con IGV
//   Haber: Ventas (70)             base imponible
//   Haber: IGV por pagar (40111)   igv
export function buildSalesEntry(sale) {
  const baseImp = round2(sale.baseImponible || 0);
  const igv     = round2(sale.igv || 0);
  const total   = round2(sale.total || baseImp + igv);
  const account70 = getSalesAccount(sale.tipoBien || 'SERVICIO');

  return {
    number:      newEntryNumber(),
    date:        sale.fechaEmision,
    glosa:       `Por la venta según ${voucherLabel(sale)} a ${sale.clienteName || 'cliente'}`,
    sourceType:  'SALE',
    sourceId:    sale.id,
    lines: [
      { account: '1212',     accountName: ACCOUNTS['1212'].name, debit: total,   credit: 0 },
      { account: account70,  accountName: ACCOUNTS[account70].name, debit: 0,    credit: baseImp },
      ...(igv > 0 ? [{ account: '40111', accountName: 'IGV - Cuenta propia (Débito)', debit: 0, credit: igv }] : []),
    ],
    totalDebit:  total,
    totalCredit: round2(baseImp + igv),
  };
}

// Asiento de compra (servicio/mercadería):
//   Debe: Gasto/Mercadería (6x)    base imponible
//   Debe: IGV crédito (40111)      igv
//   Haber: Proveedor (4212)        total
export function buildPurchaseEntry(purchase) {
  const baseImp = round2(purchase.baseImponible || 0);
  const igv     = round2(purchase.aceptaCreditoFiscal ? (purchase.igv || 0) : 0);
  const total   = round2(purchase.total || baseImp + (purchase.igv || 0));
  const account6x = getPurchaseAccount(purchase.tipoGasto || 'SERVICIO');
  // Si la compra es sin derecho a crédito, el IGV pagado se carga al gasto
  const baseConIGVSinDerecho = !purchase.aceptaCreditoFiscal ? round2(baseImp + (purchase.igv || 0)) : baseImp;

  return {
    number:      newEntryNumber(),
    date:        purchase.fechaEmision,
    glosa:       `Por la compra según ${voucherLabel(purchase)} a ${purchase.proveedorName || 'proveedor'}`,
    sourceType:  'PURCHASE',
    sourceId:    purchase.id,
    lines: [
      { account: account6x, accountName: ACCOUNTS[account6x].name, debit: baseConIGVSinDerecho, credit: 0 },
      ...(igv > 0 ? [{ account: '40111', accountName: 'IGV - Crédito Fiscal', debit: igv, credit: 0 }] : []),
      { account: '4212', accountName: ACCOUNTS['4212'].name, debit: 0, credit: total },
    ],
    totalDebit:  round2(baseConIGVSinDerecho + igv),
    totalCredit: total,
  };
}

// Asiento de cobranza (cobramos una factura)
export function buildCollectionEntry({ saleId, fecha, monto, glosa, medio = 'BANCO' }) {
  const debit = medio === 'CAJA' ? '1011' : '1041';
  return {
    number:      newEntryNumber(),
    date:        fecha,
    glosa:       glosa || `Por la cobranza`,
    sourceType:  'COLLECTION',
    sourceId:    saleId,
    lines: [
      { account: debit,  accountName: ACCOUNTS[debit].name,  debit: monto, credit: 0 },
      { account: '1212', accountName: ACCOUNTS['1212'].name, debit: 0,     credit: monto },
    ],
    totalDebit: monto, totalCredit: monto,
  };
}

// Asiento de pago (pagamos a un proveedor)
export function buildPaymentEntry({ purchaseId, fecha, monto, glosa, medio = 'BANCO' }) {
  const credit = medio === 'CAJA' ? '1011' : '1041';
  return {
    number:      newEntryNumber(),
    date:        fecha,
    glosa:       glosa || `Por el pago a proveedor`,
    sourceType:  'PAYMENT',
    sourceId:    purchaseId,
    lines: [
      { account: '4212', accountName: ACCOUNTS['4212'].name, debit: monto, credit: 0 },
      { account: credit, accountName: ACCOUNTS[credit].name, debit: 0,     credit: monto },
    ],
    totalDebit: monto, totalCredit: monto,
  };
}

function voucherLabel(op) {
  const t = op.tipoComprobante || '01';
  const map = { '01': 'Factura', '03': 'Boleta', '07': 'Nota de Crédito', '08': 'Nota de Débito' };
  return `${map[t] || 'Comprobante'} ${op.serie || ''}-${op.numero || ''}`;
}

// Construye el Libro Mayor (resumen por cuenta)
export function buildLibroMayor(entries) {
  const accounts = {};
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!accounts[line.account]) {
        accounts[line.account] = {
          account: line.account,
          name:    line.accountName,
          movements: [],
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
        };
      }
      accounts[line.account].movements.push({
        date:   entry.date,
        number: entry.number,
        glosa:  entry.glosa,
        debit:  line.debit,
        credit: line.credit,
      });
      accounts[line.account].totalDebit  += line.debit;
      accounts[line.account].totalCredit += line.credit;
    }
  }
  for (const acc of Object.values(accounts)) {
    acc.totalDebit  = round2(acc.totalDebit);
    acc.totalCredit = round2(acc.totalCredit);
    acc.balance     = round2(acc.totalDebit - acc.totalCredit);
  }
  return Object.values(accounts).sort((a, b) => a.account.localeCompare(b.account));
}

// Construye Libro Diario (lista cronológica con número de asiento secuencial)
export function buildLibroDiario(entries) {
  return [...entries].sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date);
    if (da - db !== 0) return da - db;
    return a.number.localeCompare(b.number);
  });
}

// Resetea el contador (para periodos nuevos)
export function resetEntryNumber(start = 1) { nextEntryNumber = start; }
