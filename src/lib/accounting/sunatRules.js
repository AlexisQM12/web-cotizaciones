// Reglas tributarias SUNAT por régimen y tipo de empresa.
// Fuente: SUNAT (emprender.sunat.gob.pe) — vigente para ejercicio 2026.

export const UIT_2026 = 5350; // S/. — actualizar anualmente

// Tipos de empresa soportados
export const COMPANY_TYPES = {
  EIRL: {
    code: 'EIRL',
    name: 'Empresa Individual de Responsabilidad Limitada',
    description: 'Un solo titular (persona natural). Patrimonio separado.',
    allowedRegimes: ['NRUS', 'RER', 'RMT', 'GENERAL'],
  },
  SAC: {
    code: 'SAC',
    name: 'Sociedad Anónima Cerrada',
    description: '2 a 20 accionistas. Persona jurídica con capital en acciones. Constitución ante notario.',
    allowedRegimes: ['RER', 'RMT', 'GENERAL'], // NRUS no aplica a personas jurídicas con socios
  },
  SACS: {
    code: 'SACS',
    name: 'Sociedad por Acciones Cerrada Simplificada',
    description: 'Constitución 100% digital vía SID-SUNARP (DL 1409). 2 a 20 accionistas, ideal para microempresas.',
    allowedRegimes: ['RER', 'RMT', 'GENERAL'], // Misma tributación que SAC; no aplica NRUS
  },
};

// Regímenes tributarios
// Fuente: https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios
export const TAX_REGIMES = {
  NRUS: {
    code: 'NRUS',
    name: 'Nuevo Régimen Único Simplificado',
    description: 'Cuota fija mensual. Solo personas naturales y EIRL pequeñas.',
    maxAnnualIncomeUIT: null, // tope por categoría
    categories: {
      1: { maxMonthlyIncome: 5000, monthlyFee: 20 },
      2: { maxMonthlyIncome: 8000, monthlyFee: 50 },
    },
    issuesIGV: false,
    incomeTaxRate: null, // no aplica
    requiresMonthlyDeclaration: true, // cuota
    requiresAnnualDeclaration: false,
    requiredBooks: [],
    canIssueFactura: false, // solo boletas y tickets
    canIssueBoleta: true,
  },
  RER: {
    code: 'RER',
    name: 'Régimen Especial de Renta',
    description: 'Tasa fija sobre ingresos. Hasta S/ 525,000 anuales.',
    maxAnnualIncome: 525000,
    issuesIGV: true,
    igvRate: 0.18,
    incomeTaxRate: 0.015, // 1.5% mensual sobre ingresos netos — definitivo
    incomeTaxIsDefinitive: true, // no hay regularización anual
    requiresMonthlyDeclaration: true,
    requiresAnnualDeclaration: false,
    requiredBooks: ['REGISTRO_VENTAS', 'REGISTRO_COMPRAS'],
    canIssueFactura: true,
    canIssueBoleta: true,
  },
  RMT: {
    code: 'RMT',
    name: 'Régimen MYPE Tributario',
    description: 'Hasta 1700 UIT anuales. Tasa progresiva sobre utilidades.',
    maxAnnualIncomeUIT: 1700,
    get maxAnnualIncome() { return this.maxAnnualIncomeUIT * UIT_2026; },
    issuesIGV: true,
    igvRate: 0.18,
    // Pago a cuenta mensual: 1% si ingresos anuales ≤ 300 UIT, o coeficiente
    monthlyPaymentRate: 0.01,
    monthlyPaymentThresholdUIT: 300,
    // Renta anual:
    // - Primeras 15 UIT de utilidad: 10%
    // - Exceso de 15 UIT: 29.5%
    incomeTaxBrackets: [
      { upToUIT: 15, rate: 0.10 },
      { upToUIT: Infinity, rate: 0.295 },
    ],
    requiresMonthlyDeclaration: true,
    requiresAnnualDeclaration: true,
    // Libros varían según ingresos
    booksByIncomeUIT: [
      { upToUIT: 300, books: ['REGISTRO_VENTAS', 'REGISTRO_COMPRAS', 'LIBRO_DIARIO_SIMPLIFICADO'] },
      { upToUIT: 500, books: ['REGISTRO_VENTAS', 'REGISTRO_COMPRAS', 'LIBRO_DIARIO', 'LIBRO_MAYOR'] },
      { upToUIT: 1700, books: ['REGISTRO_VENTAS', 'REGISTRO_COMPRAS', 'LIBRO_DIARIO', 'LIBRO_MAYOR', 'LIBRO_INVENTARIOS_BALANCES'] },
    ],
    canIssueFactura: true,
    canIssueBoleta: true,
  },
  GENERAL: {
    code: 'GENERAL',
    name: 'Régimen General',
    description: 'Sin límites de ingresos. Tasa 29.5% sobre utilidades.',
    maxAnnualIncome: null,
    issuesIGV: true,
    igvRate: 0.18,
    // Pago a cuenta: el mayor entre 1.5% de ingresos o coeficiente del ejercicio anterior
    monthlyPaymentRate: 0.015,
    incomeTaxBrackets: [
      { upToUIT: Infinity, rate: 0.295 },
    ],
    requiresMonthlyDeclaration: true,
    requiresAnnualDeclaration: true,
    booksByIncomeUIT: [
      { upToUIT: 300, books: ['REGISTRO_VENTAS', 'REGISTRO_COMPRAS', 'LIBRO_DIARIO_SIMPLIFICADO'] },
      { upToUIT: 1700, books: ['REGISTRO_VENTAS', 'REGISTRO_COMPRAS', 'LIBRO_DIARIO', 'LIBRO_MAYOR', 'LIBRO_INVENTARIOS_BALANCES'] },
      { upToUIT: Infinity, books: ['REGISTRO_VENTAS', 'REGISTRO_COMPRAS', 'LIBRO_DIARIO', 'LIBRO_MAYOR', 'LIBRO_INVENTARIOS_BALANCES', 'LIBRO_CAJA_BANCOS'] },
    ],
    canIssueFactura: true,
    canIssueBoleta: true,
  },
};

// Catálogo de libros / registros electrónicos
export const BOOKS = {
  REGISTRO_VENTAS: {
    code: '14.1',
    name: 'Registro de Ventas e Ingresos',
    sireFormat: '14.1',
    mandatorySIRE: true, // obligatorio en SIRE desde ene-2026
  },
  REGISTRO_COMPRAS: {
    code: '8.1',
    name: 'Registro de Compras',
    sireFormat: '8.1',
    mandatorySIRE: true,
  },
  LIBRO_DIARIO_SIMPLIFICADO: {
    code: '5.2',
    name: 'Libro Diario - Formato Simplificado',
    sireFormat: null, // PLE clásico
    mandatorySIRE: false,
  },
  LIBRO_DIARIO: {
    code: '5.1',
    name: 'Libro Diario',
    sireFormat: null,
    mandatorySIRE: false,
  },
  LIBRO_MAYOR: {
    code: '6.1',
    name: 'Libro Mayor',
    sireFormat: null,
    mandatorySIRE: false,
  },
  LIBRO_INVENTARIOS_BALANCES: {
    code: '3.x',
    name: 'Libro de Inventarios y Balances',
    sireFormat: null,
    mandatorySIRE: false,
  },
  LIBRO_CAJA_BANCOS: {
    code: '1.1',
    name: 'Libro Caja y Bancos',
    sireFormat: null,
    mandatorySIRE: false,
  },
};

// Tipos de comprobantes según tabla SUNAT 10
export const VOUCHER_TYPES = {
  '01': { name: 'Factura', allowsCreditFiscal: true },
  '03': { name: 'Boleta de Venta', allowsCreditFiscal: false },
  '07': { name: 'Nota de Crédito', allowsCreditFiscal: true, isReversal: true },
  '08': { name: 'Nota de Débito', allowsCreditFiscal: true },
  '12': { name: 'Ticket', allowsCreditFiscal: false },
};

// Tipos de documento de identidad — tabla SUNAT 6
export const DOC_ID_TYPES = {
  '0': 'No Domiciliado / Sin documento',
  '1': 'DNI',
  '4': 'Carnet de Extranjería',
  '6': 'RUC',
  '7': 'Pasaporte',
  'A': 'Cédula Diplomática',
};

// Dado un régimen + ingresos UIT actuales, devuelve los libros obligatorios
export function getRequiredBooks(regimeCode, annualIncomePEN = 0) {
  const regime = TAX_REGIMES[regimeCode];
  if (!regime) return [];
  if (regime.requiredBooks) return regime.requiredBooks;
  if (regime.booksByIncomeUIT) {
    const incomeUIT = annualIncomePEN / UIT_2026;
    for (const bracket of regime.booksByIncomeUIT) {
      if (incomeUIT <= bracket.upToUIT) return bracket.books;
    }
  }
  return [];
}

// Valida que un régimen sea aplicable al tipo de empresa
export function isRegimeAllowed(companyType, regimeCode) {
  return COMPANY_TYPES[companyType]?.allowedRegimes.includes(regimeCode) ?? false;
}

// Lista los regímenes disponibles para un tipo de empresa
export function getAllowedRegimes(companyType) {
  const allowed = COMPANY_TYPES[companyType]?.allowedRegimes || [];
  return allowed.map((code) => TAX_REGIMES[code]).filter(Boolean);
}
