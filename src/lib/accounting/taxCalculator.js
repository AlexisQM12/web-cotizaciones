// Calculadora mensual de impuestos (IGV y pago a cuenta de Renta) por régimen.
// Recibe un conjunto de operaciones (ventas y compras) y devuelve el resumen
// listo para llenar el Formulario Virtual 621 de SUNAT.

import { TAX_REGIMES, UIT_2026 } from './sunatRules.js';

const round2 = (n) => Math.round(n * 100) / 100;

// Calcula débito fiscal (IGV cobrado en ventas)
function calculateDebitoFiscal(sales) {
  let baseImponible = 0;
  let igv = 0;
  let exoneradas = 0;
  let inafectas = 0;
  let exportaciones = 0;

  for (const s of sales) {
    if (s.anulado) continue;
    const signo = s.tipoComprobante === '07' ? -1 : 1; // Nota de Crédito resta
    const base  = (s.baseImponible || 0) * signo;
    const igvOp = (s.igv || 0) * signo;

    switch (s.tipoOperacion || 'GRAVADA') {
      case 'GRAVADA':       baseImponible += base; igv += igvOp; break;
      case 'EXONERADA':     exoneradas    += base; break;
      case 'INAFECTA':      inafectas     += base; break;
      case 'EXPORTACION':   exportaciones += base; break;
      default:              baseImponible += base; igv += igvOp;
    }
  }

  return {
    baseImponibleGravada: round2(baseImponible),
    igvDebitoFiscal:      round2(igv),
    exoneradas:           round2(exoneradas),
    inafectas:            round2(inafectas),
    exportaciones:        round2(exportaciones),
    totalVentas:          round2(baseImponible + exoneradas + inafectas + exportaciones),
  };
}

// Calcula crédito fiscal (IGV pagado en compras con derecho a crédito)
function calculateCreditoFiscal(purchases) {
  let baseGravada = 0;
  let igvCredito = 0;
  let baseNoGravada = 0;
  let baseSinDerecho = 0; // adquisiciones gravadas sin derecho

  for (const p of purchases) {
    if (p.anulado || !p.aceptaCreditoFiscal) {
      // Compras anuladas o sin derecho (e.g. boletas de venta sin RUC, gastos no deducibles)
      baseSinDerecho += (p.baseImponible || 0);
      continue;
    }
    const signo = p.tipoComprobante === '07' ? -1 : 1;
    baseGravada  += (p.baseImponible || 0) * signo;
    igvCredito   += (p.igv || 0) * signo;
    baseNoGravada += (p.exoneradas || 0) + (p.inafectas || 0);
  }

  return {
    baseImponibleCompras: round2(baseGravada),
    igvCreditoFiscal:     round2(igvCredito),
    comprasNoGravadas:    round2(baseNoGravada),
    comprasSinDerecho:    round2(baseSinDerecho),
    totalCompras:         round2(baseGravada + baseNoGravada + baseSinDerecho),
  };
}

// Calcula IGV neto a pagar (o saldo a favor)
function calculateIGV(sales, purchases) {
  const debito  = calculateDebitoFiscal(sales);
  const credito = calculateCreditoFiscal(purchases);
  const igvNeto = round2(debito.igvDebitoFiscal - credito.igvCreditoFiscal);
  return {
    ...debito,
    ...credito,
    igvAPagar:        igvNeto > 0 ? igvNeto : 0,
    saldoAFavorIGV:   igvNeto < 0 ? -igvNeto : 0,
  };
}

// Calcula pago a cuenta del Impuesto a la Renta según régimen
function calculateRentaMensual(regimeCode, ingresosNetosMes, opciones = {}) {
  const regime = TAX_REGIMES[regimeCode];
  if (!regime) return { error: `Régimen ${regimeCode} no soportado` };

  switch (regimeCode) {
    case 'NRUS':
      return calculateNRUS(ingresosNetosMes, opciones);

    case 'RER':
      // 1.5% sobre ingresos netos mensuales — DEFINITIVO (no hay DJ anual)
      return {
        regimen: 'RER',
        ingresosNetos: round2(ingresosNetosMes),
        tasaAplicada: regime.incomeTaxRate,
        pagoMensual:  round2(ingresosNetosMes * regime.incomeTaxRate),
        esDefinitivo: true,
        nota: 'Pago definitivo. No requiere Declaración Jurada Anual.',
      };

    case 'RMT': {
      // Pago a cuenta:
      // - Si ingresos anuales acumulados ≤ 300 UIT → 1%
      // - Si supera 300 UIT → el mayor entre 1.5% o coeficiente del ejercicio anterior
      const ingresosAcumuladosUIT = (opciones.ingresosAnualesAcumulados || 0) / UIT_2026;
      let tasa = 0.01;
      let nota = 'Pago a cuenta 1% — ingresos acumulados dentro de 300 UIT.';
      if (ingresosAcumuladosUIT > 300) {
        const coef = opciones.coeficienteRenta || 0.015;
        tasa = Math.max(coef, 0.015);
        nota = `Pago a cuenta ${(tasa * 100).toFixed(2)}% — supera 300 UIT acumuladas.`;
      }
      return {
        regimen: 'RMT',
        ingresosNetos: round2(ingresosNetosMes),
        tasaAplicada:  tasa,
        pagoMensual:   round2(ingresosNetosMes * tasa),
        esDefinitivo:  false,
        nota,
      };
    }

    case 'GENERAL': {
      // Pago a cuenta: el mayor entre 1.5% o coeficiente del ejercicio anterior
      const coef = opciones.coeficienteRenta || 0.015;
      const tasa = Math.max(coef, 0.015);
      return {
        regimen: 'GENERAL',
        ingresosNetos: round2(ingresosNetosMes),
        tasaAplicada:  tasa,
        pagoMensual:   round2(ingresosNetosMes * tasa),
        esDefinitivo:  false,
        nota: `Pago a cuenta ${(tasa * 100).toFixed(2)}% — el mayor entre 1.5% y coeficiente.`,
      };
    }

    default:
      return { error: `Régimen ${regimeCode} no implementado` };
  }
}

function calculateNRUS(ingresosNetosMes, opciones) {
  const cat1 = TAX_REGIMES.NRUS.categories[1];
  const cat2 = TAX_REGIMES.NRUS.categories[2];
  const comprasMes = opciones.comprasMes || 0;
  const limite = Math.max(ingresosNetosMes, comprasMes);
  const categoria = limite <= cat1.maxMonthlyIncome ? 1 : 2;
  const cuota = categoria === 1 ? cat1.monthlyFee : cat2.monthlyFee;
  return {
    regimen:       'NRUS',
    categoria,
    ingresosNetos: round2(ingresosNetosMes),
    comprasMes:    round2(comprasMes),
    pagoMensual:   cuota,
    esDefinitivo:  true,
    nota: `Categoría ${categoria}: cuota fija S/ ${cuota}.`,
  };
}

// Renta anual (para regímenes que la requieren — solo cálculo estimado)
function calculateRentaAnual(regimeCode, utilidadNetaPEN) {
  const regime = TAX_REGIMES[regimeCode];
  if (!regime?.incomeTaxBrackets) return null;

  let impuesto = 0;
  let remaining = utilidadNetaPEN;
  let umbralAcumulado = 0;
  const desglose = [];

  for (const bracket of regime.incomeTaxBrackets) {
    if (remaining <= 0) break;
    const limite = bracket.upToUIT === Infinity ? Infinity : bracket.upToUIT * UIT_2026;
    const tramo  = limite === Infinity ? remaining : Math.min(remaining, limite - umbralAcumulado);
    const imp    = tramo * bracket.rate;
    impuesto += imp;
    desglose.push({
      hasta:       limite === Infinity ? 'sin límite' : `${bracket.upToUIT} UIT`,
      base:        round2(tramo),
      tasa:        bracket.rate,
      impuesto:    round2(imp),
    });
    remaining -= tramo;
    umbralAcumulado = limite;
  }

  return {
    utilidadNeta: round2(utilidadNetaPEN),
    impuestoAnual: round2(impuesto),
    desglose,
  };
}

// Función principal — calcula todo lo del mes
export function calculateMonthlyTaxes({ regimeCode, period, sales = [], purchases = [], opciones = {} }) {
  const regime = TAX_REGIMES[regimeCode];
  if (!regime) throw new Error(`Régimen ${regimeCode} no encontrado`);

  const igv   = regime.issuesIGV ? calculateIGV(sales, purchases) : null;
  const ingresosMes = igv ? (igv.baseImponibleGravada + igv.exoneradas + igv.inafectas + igv.exportaciones)
                          : sales.reduce((s, x) => s + (x.total || 0), 0);
  const renta = calculateRentaMensual(regimeCode, ingresosMes, opciones);

  const totalAPagar = round2((igv?.igvAPagar || 0) + (renta.pagoMensual || 0));

  return {
    period,
    regimen: regimeCode,
    igv,
    renta,
    totalAPagar,
    saldoAFavorIGV: igv?.saldoAFavorIGV || 0,
    resumenForm621: {
      casilla100_baseImponible:     igv?.baseImponibleGravada,
      casilla101_igvVentas:         igv?.igvDebitoFiscal,
      casilla105_exportaciones:     igv?.exportaciones,
      casilla106_exoneradas:        igv?.exoneradas,
      casilla109_inafectas:         igv?.inafectas,
      casilla107_baseCompras:       igv?.baseImponibleCompras,
      casilla108_igvCompras:        igv?.igvCreditoFiscal,
      casilla140_igvNeto:           igv?.igvAPagar,
      casilla301_ingresosRenta:     ingresosMes,
      casilla312_pagoRenta:         renta?.pagoMensual,
    },
  };
}

export { calculateIGV, calculateRentaMensual, calculateRentaAnual };
