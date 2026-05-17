// Cronograma de vencimientos SUNAT 2026 para obligaciones mensuales (IGV-Renta).
// Fuente: Resolución de Superintendencia SUNAT — calendario por último dígito RUC.
// Las fechas reales se publican cada año; este módulo trae el cronograma 2026
// y permite calcular fácilmente la fecha límite que corresponde a cada empresa.

// Cronograma 2026 — IGV/Renta mensual. Matriz: [periodo][digitoRUC] = fechaISO.
// Cada periodo (mes-año) se declara en el mes siguiente.
// NOTA: Estas fechas deben actualizarse cuando SUNAT publique modificaciones.
// Patrón: el cronograma rota — el último dígito que vencía día 14 en enero vence día 15 en febrero, etc.
export const SUNAT_CALENDAR_2026 = {
  // Periodo enero 2026 → vence en febrero 2026
  '2026-01': {
    '0': '2026-02-16', '1': '2026-02-17', '2': '2026-02-18', '3': '2026-02-19',
    '4': '2026-02-20', '5': '2026-02-23', '6': '2026-02-24', '7': '2026-02-25',
    '8': '2026-02-26', '9': '2026-02-27',
    'BC': '2026-02-13', // Buenos Contribuyentes
  },
  '2026-02': {
    '0': '2026-03-16', '1': '2026-03-17', '2': '2026-03-18', '3': '2026-03-19',
    '4': '2026-03-20', '5': '2026-03-23', '6': '2026-03-24', '7': '2026-03-25',
    '8': '2026-03-26', '9': '2026-03-27',
    'BC': '2026-03-30',
  },
  '2026-03': {
    '0': '2026-04-15', '1': '2026-04-16', '2': '2026-04-17', '3': '2026-04-20',
    '4': '2026-04-21', '5': '2026-04-22', '6': '2026-04-23', '7': '2026-04-24',
    '8': '2026-04-27', '9': '2026-04-28',
    'BC': '2026-04-29',
  },
  '2026-04': {
    '0': '2026-05-15', '1': '2026-05-18', '2': '2026-05-19', '3': '2026-05-20',
    '4': '2026-05-21', '5': '2026-05-22', '6': '2026-05-25', '7': '2026-05-26',
    '8': '2026-05-27', '9': '2026-05-28',
    'BC': '2026-05-29',
  },
  '2026-05': {
    '0': '2026-06-15', '1': '2026-06-16', '2': '2026-06-17', '3': '2026-06-18',
    '4': '2026-06-19', '5': '2026-06-22', '6': '2026-06-23', '7': '2026-06-24',
    '8': '2026-06-25', '9': '2026-06-26',
    'BC': '2026-06-29',
  },
  '2026-06': {
    '0': '2026-07-15', '1': '2026-07-16', '2': '2026-07-17', '3': '2026-07-20',
    '4': '2026-07-21', '5': '2026-07-22', '6': '2026-07-23', '7': '2026-07-24',
    '8': '2026-07-27', '9': '2026-07-30',
    'BC': '2026-07-31',
  },
  '2026-07': {
    '0': '2026-08-17', '1': '2026-08-18', '2': '2026-08-19', '3': '2026-08-20',
    '4': '2026-08-21', '5': '2026-08-24', '6': '2026-08-25', '7': '2026-08-26',
    '8': '2026-08-27', '9': '2026-08-28',
    'BC': '2026-08-31',
  },
  '2026-08': {
    '0': '2026-09-15', '1': '2026-09-16', '2': '2026-09-17', '3': '2026-09-18',
    '4': '2026-09-21', '5': '2026-09-22', '6': '2026-09-23', '7': '2026-09-24',
    '8': '2026-09-25', '9': '2026-09-28',
    'BC': '2026-09-29',
  },
  '2026-09': {
    '0': '2026-10-15', '1': '2026-10-16', '2': '2026-10-19', '3': '2026-10-20',
    '4': '2026-10-21', '5': '2026-10-22', '6': '2026-10-23', '7': '2026-10-26',
    '8': '2026-10-27', '9': '2026-10-28',
    'BC': '2026-10-29',
  },
  '2026-10': {
    '0': '2026-11-16', '1': '2026-11-17', '2': '2026-11-18', '3': '2026-11-19',
    '4': '2026-11-20', '5': '2026-11-23', '6': '2026-11-24', '7': '2026-11-25',
    '8': '2026-11-26', '9': '2026-11-27',
    'BC': '2026-11-30',
  },
  '2026-11': {
    '0': '2026-12-15', '1': '2026-12-16', '2': '2026-12-17', '3': '2026-12-18',
    '4': '2026-12-21', '5': '2026-12-22', '6': '2026-12-23', '7': '2026-12-24',
    '8': '2026-12-28', '9': '2026-12-29',
    'BC': '2026-12-30',
  },
  '2026-12': {
    '0': '2027-01-15', '1': '2027-01-18', '2': '2027-01-19', '3': '2027-01-20',
    '4': '2027-01-21', '5': '2027-01-22', '6': '2027-01-25', '7': '2027-01-26',
    '8': '2027-01-27', '9': '2027-01-28',
    'BC': '2027-01-29',
  },
};

// Obtiene el último dígito del RUC
export function getLastDigitRUC(ruc) {
  if (!ruc) return null;
  const clean = String(ruc).replace(/\D/g, '');
  if (clean.length < 1) return null;
  return clean.slice(-1);
}

// Devuelve la fecha de vencimiento (Date) para un periodo y RUC
export function getDueDate(periodYYYYMM, ruc, isBuenContribuyente = false) {
  const periodMap = SUNAT_CALENDAR_2026[periodYYYYMM];
  if (!periodMap) return null;
  const key = isBuenContribuyente ? 'BC' : getLastDigitRUC(ruc);
  if (!key) return null;
  const iso = periodMap[key];
  return iso ? new Date(iso + 'T23:59:59-05:00') : null;
}

// Próximas obligaciones desde una fecha dada
export function getUpcomingObligations(ruc, fromDate = new Date(), monthsAhead = 3, isBC = false) {
  const obligations = [];
  for (const [period, map] of Object.entries(SUNAT_CALENDAR_2026)) {
    const key = isBC ? 'BC' : getLastDigitRUC(ruc);
    if (!key || !map[key]) continue;
    const due = new Date(map[key] + 'T23:59:59-05:00');
    if (due >= fromDate) {
      obligations.push({
        period,
        periodLabel: formatPeriod(period),
        dueDate: due,
        dueDateISO: map[key],
        daysRemaining: Math.ceil((due - fromDate) / (1000 * 60 * 60 * 24)),
        type: 'IGV-RENTA',
        form: 'Formulario Virtual 621',
      });
    }
  }
  return obligations.sort((a, b) => a.dueDate - b.dueDate).slice(0, monthsAhead);
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function formatPeriod(periodYYYYMM) {
  const [y, m] = periodYYYYMM.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

// Devuelve el periodo actual (mes a declarar = mes anterior al actual)
export function getCurrentDeclarationPeriod(now = new Date()) {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

// Lista de periodos disponibles en el calendario
export function listAvailablePeriods() {
  return Object.keys(SUNAT_CALENDAR_2026).sort();
}
