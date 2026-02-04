export function numberToSpanishWords(n) {
    if (n === 0) return 'CERO';

    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertGroup(n) {
        let output = '';
        if (n >= 100) {
            if (n === 100) return 'CIEN';
            output += hundreds[Math.floor(n / 100)] + ' ';
            n %= 100;
        }
        if (n >= 20) {
            if (n === 20) output += 'VEINTE';
            else if (n > 20 && n < 30) output += 'VEINTI' + units[n - 20];
            else {
                output += tens[Math.floor(n / 10)];
                if (n % 10 > 0) output += ' Y ' + units[n % 10];
            }
        } else if (n >= 10) {
            output += teens[n - 10];
        } else if (n > 0) {
            output += units[n];
        }
        return output.trim();
    }

    if (n === 1000) return 'MIL';
    if (n === 1000000) return 'UN MILLON';

    let result = '';

    if (n >= 1000000) {
        const millions = Math.floor(n / 1000000);
        result += (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') + ' ';
        n %= 1000000;
    }

    if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        result += (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + ' ';
        n %= 1000;
    }

    if (n > 0) {
        result += convertGroup(n);
    }

    return result.trim().toUpperCase();
}
