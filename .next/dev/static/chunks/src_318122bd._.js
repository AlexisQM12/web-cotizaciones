(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/numberToWords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "numberToSpanishWords",
    ()=>numberToSpanishWords
]);
function numberToSpanishWords(n) {
    if (n === 0) return 'CERO';
    const units = [
        '',
        'UN',
        'DOS',
        'TRES',
        'CUATRO',
        'CINCO',
        'SEIS',
        'SIETE',
        'OCHO',
        'NUEVE'
    ];
    const teens = [
        'DIEZ',
        'ONCE',
        'DOCE',
        'TRECE',
        'CATORCE',
        'QUINCE',
        'DIECISEIS',
        'DIECISIETE',
        'DIECIOCHO',
        'DIECINUEVE'
    ];
    const tens = [
        '',
        '',
        'VEINTE',
        'TREINTA',
        'CUARENTA',
        'CINCUENTA',
        'SESENTA',
        'SETENTA',
        'OCHENTA',
        'NOVENTA'
    ];
    const hundreds = [
        '',
        'CIENTO',
        'DOSCIENTOS',
        'TRESCIENTOS',
        'CUATROCIENTOS',
        'QUINIENTOS',
        'SEISCIENTOS',
        'SETECIENTOS',
        'OCHOCIENTOS',
        'NOVECIENTOS'
    ];
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/QuotationDocument.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "QuotationDocument",
    ()=>QuotationDocument
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$renderer$2f$lib$2f$react$2d$pdf$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-pdf/renderer/lib/react-pdf.browser.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-pdf/primitives/lib/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$numberToWords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/numberToWords.js [app-client] (ecmascript)");
;
;
;
;
// Register fonts if needed (we'll stick to standard ones for now to ensure speed)
// Ideally, we would register a bold font, but Helvetica-Bold is standard.
const styles = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$renderer$2f$lib$2f$react$2d$pdf$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["StyleSheet"].create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#111'
    },
    // Header Section
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    companyColumn: {
        width: '60%',
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    logo: {
        height: 50,
        maxWidth: 150,
        objectFit: 'contain',
        objectPosition: 'left',
        marginBottom: 5
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#333'
    },
    companyDetails: {
        fontSize: 8,
        color: '#444',
        marginBottom: 2
    },
    link: {
        color: '#007bff',
        textDecoration: 'none'
    },
    // Quotation Box (Right side)
    quotationBox: {
        width: '40%',
        backgroundColor: '#f3f4f6',
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    quotationBoxInner: {
        width: '100%',
        paddingVertical: 15,
        alignItems: 'center'
    },
    rucText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5
    },
    docTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5
    },
    docNumber: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    // Info Strip (Date, Currency)
    infoStrip: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 4,
        marginBottom: 10,
        borderTopWidth: 2,
        borderTopColor: '#007acc',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    infoItem: {
        marginRight: 40,
        flexDirection: 'row'
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 5
    },
    // Section Headers (1. CLIENTE, 2. DETALLES...)
    sectionHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#007acc',
        marginBottom: 3,
        marginTop: 6,
        textTransform: 'uppercase'
    },
    // Client Section
    clientContainer: {
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    clientRow: {
        flexDirection: 'row',
        marginBottom: 3
    },
    clientLabel: {
        fontWeight: 'bold',
        width: 100
    },
    // Table
    table: {
        width: '100%',
        marginTop: 5
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 6,
        paddingHorizontal: 4
    },
    th: {
        fontWeight: 'bold',
        fontSize: 7,
        textTransform: 'uppercase'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 2,
        paddingHorizontal: 4,
        minHeight: 20,
        alignItems: 'center'
    },
    // Columns (Flexible widths)
    colCode: {
        width: '8%'
    },
    colDesc: {
        width: '62%'
    },
    // colUnit removed
    colQty: {
        width: '10%',
        textAlign: 'center'
    },
    // colVal removed
    colPrice: {
        width: '10%',
        textAlign: 'right'
    },
    colTotal: {
        width: '10%',
        textAlign: 'right'
    },
    // Description Cell
    descContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    itemImage: {
        width: 30,
        height: 30,
        marginRight: 5,
        objectFit: 'cover',
        borderRadius: 2
    },
    itemTextContainer: {
        flex: 1
    },
    itemTitle: {
        fontSize: 8,
        marginBottom: 2
    },
    itemDescText: {
        fontSize: 7,
        color: '#555'
    },
    // Totals Section
    totalsContainer: {
        marginTop: 10,
        alignSelf: 'flex-end',
        width: '35%',
        paddingTop: 5
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3
    },
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderTopWidth: 1,
        borderTopColor: '#000',
        marginTop: 2
    },
    totalLabel: {
        fontWeight: 'bold'
    },
    totalValue: {
        textAlign: 'right'
    },
    totalAmountText: {
        fontSize: 8,
        marginTop: 5,
        textAlign: 'right',
        fontStyle: 'italic',
        width: '100%'
    },
    // Footer / Notes
    footerContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 10
    },
    notesText: {
        fontSize: 7,
        lineHeight: 1.4,
        textAlign: 'justify',
        color: '#444'
    },
    paymentContainer: {
        marginTop: 10,
        backgroundColor: '#f9fafb',
        padding: 10,
        borderRadius: 4
    },
    paymentRow: {
        flexDirection: 'row',
        marginBottom: 2
    },
    paymentLabel: {
        fontWeight: 'bold',
        width: 120,
        fontSize: 7
    },
    paymentVal: {
        fontSize: 7
    }
});
const QuotationDocument = ({ data })=>{
    // Destructure properties from data or set defaults
    const { clientName = '', clientRuc = '', clientAddress = '', code = '0000', items = [], company = {}, date = new Date().toLocaleDateString(), currency = 'Soles', notes = '', serviceDescription = '' } = data;
    // Calculate totals
    const subtotal = items.reduce((acc, item)=>acc + parseFloat(item.price || 0) * parseFloat(item.quantity || 1), 0);
    const igvRate = 0.18;
    // Assuming the input price is the UNIT PRICE (Inc IGV) or UNIT VALUE (Ex IGV)? 
    // Usually in these systems, you simplify. Let's assume input price is "Valor U" (Ex IGV) for the calculation flow:
    // Subtotal = Sum(Qty * Price)
    // IGV = Subtotal * 0.18
    // Total = Subtotal + IGV
    // Note: The reference image shows "Valor.U" and "Precio.U". 
    // Valor.U usually means base price. Precio.U usually means price including tax.
    const igv = subtotal * igvRate;
    const total = subtotal + igv;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Document"], {
        title: code || 'cotizacion',
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Page"], {
            size: "A4",
            style: styles.page,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: styles.headerContainer,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.companyColumn,
                            children: [
                                company.logoUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Image"], {
                                    src: company.logoUrl,
                                    style: styles.logo
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 284,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.companyName,
                                    children: company.name || 'MI EMPRESA S.A.C.'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 286,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                    style: {
                                        height: 5
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 287,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.companyDetails,
                                    children: company.address || 'Av. Principal 123, Lima, Perú'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 289,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.companyDetails,
                                    children: [
                                        "RUC: ",
                                        company.ruc || '20123456789'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 290,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.companyDetails,
                                    children: [
                                        company.email || 'ventas@miempresa.com',
                                        " | ",
                                        company.phone || '999 888 777'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 291,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.companyDetails,
                                        styles.link
                                    ],
                                    children: company.website || 'www.miempresa.com'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 292,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 282,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.quotationBox,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                style: styles.quotationBoxInner,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        style: styles.rucText,
                                        children: [
                                            "RUC ",
                                            company.ruc || '20000000001'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 297,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        style: styles.docTitle,
                                        children: "COTIZACIÓN"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 298,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        style: styles.docNumber,
                                        children: code
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 299,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/QuotationDocument.js",
                                lineNumber: 296,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 295,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 281,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: styles.infoStrip,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.infoItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.infoLabel,
                                    children: "FECHA EMISIÓN:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 307,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    children: date
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 308,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 306,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.infoItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.infoLabel,
                                    children: "MONEDA:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 311,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    children: currency
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 312,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 310,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 305,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    style: styles.sectionHeader,
                    children: "1. CLIENTE"
                }, void 0, false, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 317,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: styles.clientContainer,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.clientRow,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.clientLabel,
                                    children: "Razón Social:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 320,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: {
                                        flex: 1
                                    },
                                    children: clientName
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 321,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 319,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        clientRuc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.clientRow,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.clientLabel,
                                    children: "RUC:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 325,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: {
                                        flex: 1
                                    },
                                    children: clientRuc
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 326,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 324,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        clientAddress && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.clientRow,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.clientLabel,
                                    children: "Dirección:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 331,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: {
                                        flex: 1
                                    },
                                    children: clientAddress
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 332,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 330,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 318,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                serviceDescription && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: {
                        marginBottom: 10
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                            style: styles.sectionHeader,
                            children: "2. DESCRIPCIÓN DEL SERVICIO O PRODUCTO"
                        }, void 0, false, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 340,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: {
                                padding: 10,
                                border: '1px solid #eee',
                                borderRadius: 4
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                style: {
                                    fontSize: 9,
                                    lineHeight: 1.4,
                                    color: '#444'
                                },
                                children: serviceDescription
                            }, void 0, false, {
                                fileName: "[project]/src/components/QuotationDocument.js",
                                lineNumber: 342,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 341,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 339,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    style: styles.sectionHeader,
                    children: "3. DETALLES DEL PRESUPUESTO"
                }, void 0, false, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 350,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: styles.table,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.tableHeader,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.th,
                                        styles.colCode
                                    ],
                                    children: "ITEM"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 356,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.th,
                                        styles.colDesc
                                    ],
                                    children: "DESCRIPCIÓN"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 357,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.th,
                                        styles.colQty
                                    ],
                                    children: "CANT"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 358,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.th,
                                        styles.colPrice
                                    ],
                                    children: "PRECIO.U"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 359,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.th,
                                        styles.colTotal
                                    ],
                                    children: "SUBTOTAL"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 360,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 355,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        items.map((item, index)=>{
                            const itemPrice = parseFloat(item.price || 0);
                            const itemQty = parseFloat(item.quantity || 1);
                            const itemSubtotal = itemPrice * itemQty;
                            // Match the form price directly
                            const itemPrecioU = itemPrice;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                style: styles.tableRow,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        style: [
                                            styles.colCode,
                                            {
                                                fontSize: 8
                                            }
                                        ],
                                        children: index + 1
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 373,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                        style: styles.colDesc,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                            style: styles.descContainer,
                                            children: [
                                                item.imageUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Image"], {
                                                    src: item.imageUrl,
                                                    style: styles.itemImage
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/QuotationDocument.js",
                                                    lineNumber: 379,
                                                    columnNumber: 45
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                                    style: styles.itemTextContainer,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            style: styles.itemTitle,
                                                            children: item.name || item.description
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/QuotationDocument.js",
                                                            lineNumber: 382,
                                                            columnNumber: 45
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        item.details && item.details !== (item.name || item.description) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            style: styles.itemDescText,
                                                            children: item.details
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/QuotationDocument.js",
                                                            lineNumber: 384,
                                                            columnNumber: 49
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/QuotationDocument.js",
                                                    lineNumber: 381,
                                                    columnNumber: 41
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/QuotationDocument.js",
                                            lineNumber: 376,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 375,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        style: [
                                            styles.colQty,
                                            {
                                                fontSize: 8
                                            }
                                        ],
                                        children: itemQty.toFixed(2)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 390,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        style: [
                                            styles.colPrice,
                                            {
                                                fontSize: 8
                                            }
                                        ],
                                        children: [
                                            "S/ ",
                                            itemPrecioU.toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 391,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        style: [
                                            styles.colTotal,
                                            {
                                                fontSize: 8
                                            }
                                        ],
                                        children: [
                                            "S/ ",
                                            itemSubtotal.toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 392,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, index, true, {
                                fileName: "[project]/src/components/QuotationDocument.js",
                                lineNumber: 372,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0));
                        })
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 351,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: styles.totalsContainer,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.totalRow,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.totalLabel,
                                        {
                                            fontSize: 8
                                        }
                                    ],
                                    children: "Subtotal"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 401,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.totalValue,
                                        {
                                            fontSize: 8
                                        }
                                    ],
                                    children: [
                                        "S/ ",
                                        subtotal.toFixed(2)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 402,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 400,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.totalRow,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.totalLabel,
                                        {
                                            fontSize: 8
                                        }
                                    ],
                                    children: "IGV (18%)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 405,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.totalValue,
                                        {
                                            fontSize: 8
                                        }
                                    ],
                                    children: [
                                        "S/ ",
                                        igv.toFixed(2)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 406,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 404,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                            style: styles.totalRowFinal,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.totalLabel,
                                        {
                                            fontSize: 10
                                        }
                                    ],
                                    children: "IMPORTE TOTAL"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 409,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: [
                                        styles.totalValue,
                                        {
                                            fontSize: 10,
                                            fontWeight: 'bold'
                                        }
                                    ],
                                    children: [
                                        "S/ ",
                                        total.toFixed(2)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 410,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/QuotationDocument.js",
                            lineNumber: 408,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 399,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    style: styles.totalAmountText,
                    children: [
                        "Importe en letras: SON ",
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$numberToWords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToSpanishWords"])(Math.floor(total)),
                        " CON ",
                        Math.round(total % 1 * 100),
                        "/100 SOLES"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 413,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    style: [
                        styles.sectionHeader,
                        {
                            marginTop: 10
                        }
                    ],
                    children: "4. NOTAS"
                }, void 0, false, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 418,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: {
                        borderTopWidth: 1,
                        borderTopColor: '#eee',
                        paddingTop: 5
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                        style: styles.notesText,
                        children: notes
                    }, void 0, false, {
                        fileName: "[project]/src/components/QuotationDocument.js",
                        lineNumber: 420,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 419,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    style: styles.sectionHeader,
                    children: "5. CONDICIONES DE PAGO"
                }, void 0, false, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 424,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                    style: styles.paymentContainer,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                        style: styles.paymentRow,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                style: styles.paymentLabel,
                                children: "CUENTAS BANCARIAS:"
                            }, void 0, false, {
                                fileName: "[project]/src/components/QuotationDocument.js",
                                lineNumber: 427,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                style: {
                                    flex: 1
                                },
                                children: company.accounts && company.accounts.length > 0 ? company.accounts.map((acc, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                        style: {
                                            marginBottom: 4
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                style: [
                                                    styles.paymentVal,
                                                    {
                                                        fontWeight: 'bold'
                                                    }
                                                ],
                                                children: [
                                                    acc.bankName,
                                                    " - Cuenta Corriente - Soles"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/QuotationDocument.js",
                                                lineNumber: 433,
                                                columnNumber: 41
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                style: styles.paymentVal,
                                                children: [
                                                    "Nº: ",
                                                    acc.accountNumber
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/QuotationDocument.js",
                                                lineNumber: 434,
                                                columnNumber: 41
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            acc.cci && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                style: styles.paymentVal,
                                                children: [
                                                    "CCI: ",
                                                    acc.cci
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/QuotationDocument.js",
                                                lineNumber: 435,
                                                columnNumber: 53
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/src/components/QuotationDocument.js",
                                        lineNumber: 432,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    style: styles.paymentVal,
                                    children: "No hay cuentas configuradas."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/QuotationDocument.js",
                                    lineNumber: 439,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/QuotationDocument.js",
                                lineNumber: 428,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/QuotationDocument.js",
                        lineNumber: 426,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/QuotationDocument.js",
                    lineNumber: 425,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/QuotationDocument.js",
            lineNumber: 278,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/QuotationDocument.js",
        lineNumber: 277,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_c = QuotationDocument;
var _c;
__turbopack_context__.k.register(_c, "QuotationDocument");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ProtectedRoute.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProtectedRoute",
    ()=>ProtectedRoute
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function ProtectedRoute({ children }) {
    _s();
    const { user, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProtectedRoute.useEffect": ()=>{
            if (!loading && !user) {
                router.push('/login');
            }
        }
    }["ProtectedRoute.useEffect"], [
        user,
        loading,
        router
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#fafafa'
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    fontSize: '1.1rem',
                    color: '#667085'
                },
                children: "Cargando..."
            }, void 0, false, {
                fileName: "[project]/src/components/ProtectedRoute.js",
                lineNumber: 25,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/ProtectedRoute.js",
            lineNumber: 18,
            columnNumber: 13
        }, this);
    }
    if (!user) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(ProtectedRoute, "Zr2WDa/YWeMetzDhcnOimt0LiKE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = ProtectedRoute;
var _c;
__turbopack_context__.k.register(_c, "ProtectedRoute");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/UserSidebar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserSidebar",
    ()=>UserSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function UserSidebar({ activeUsers = [] }) {
    _s();
    const { user, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleSignOut = async ()=>{
        await signOut();
        router.push('/login');
    };
    if (!user) return null;
    // Filter out current user from active users
    const otherUsers = activeUsers?.filter((u)=>u.uid !== user?.uid) || [];
    const uniqueUsers = Array.from(new Map(otherUsers.map((u)=>[
            u.uid,
            u
        ])).values());
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '80px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.5rem 0',
            gap: '1.5rem',
            zIndex: 100,
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
            transition: 'width 0.3s ease'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    width: '100%'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: 'relative'
                        },
                        children: [
                            user.photoURL ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: user.photoURL,
                                alt: user.displayName || user.firstName || 'User',
                                style: {
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    border: '2px solid #10b981',
                                    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                                },
                                title: `${user.displayName || user.firstName || 'Usuario'}\n${user.email}`
                            }, void 0, false, {
                                fileName: "[project]/src/components/UserSidebar.js",
                                lineNumber: 50,
                                columnNumber: 25
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    border: '2px solid #10b981',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                                },
                                title: `${user.displayName || user.firstName || 'Usuario'}\n${user.email}`,
                                children: (user.displayName || user.firstName || user.email || '?')[0].toUpperCase()
                            }, void 0, false, {
                                fileName: "[project]/src/components/UserSidebar.js",
                                lineNumber: 63,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    border: '2px solid #f8fafc',
                                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/UserSidebar.js",
                                lineNumber: 83,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/UserSidebar.js",
                        lineNumber: 48,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: '0.65rem',
                            color: '#64748b',
                            fontWeight: '500',
                            textAlign: 'center',
                            maxWidth: '60px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        },
                        children: "Tú"
                    }, void 0, false, {
                        fileName: "[project]/src/components/UserSidebar.js",
                        lineNumber: 95,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/UserSidebar.js",
                lineNumber: 39,
                columnNumber: 13
            }, this),
            uniqueUsers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    width: '100%',
                    flex: 1,
                    overflowY: 'auto',
                    paddingBottom: '1rem'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: '0.65rem',
                            color: '#64748b',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            textAlign: 'center'
                        },
                        children: "Editando"
                    }, void 0, false, {
                        fileName: "[project]/src/components/UserSidebar.js",
                        lineNumber: 121,
                        columnNumber: 21
                    }, this),
                    uniqueUsers.map((activeUser, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.25rem'
                            },
                            children: [
                                activeUser.photoURL ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: activeUser.photoURL,
                                    alt: activeUser.displayName || activeUser.firstName || 'User',
                                    style: {
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: '2px solid #667eea',
                                        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                    },
                                    title: activeUser.displayName || activeUser.firstName || activeUser.email
                                }, void 0, false, {
                                    fileName: "[project]/src/components/UserSidebar.js",
                                    lineNumber: 143,
                                    columnNumber: 33
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: '2px solid #667eea',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                    },
                                    title: activeUser.displayName || activeUser.firstName || activeUser.email,
                                    children: (activeUser.displayName || activeUser.firstName || activeUser.email || '?')[0].toUpperCase()
                                }, void 0, false, {
                                    fileName: "[project]/src/components/UserSidebar.js",
                                    lineNumber: 156,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        position: 'absolute',
                                        bottom: '18px',
                                        right: '8px',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: '#667eea',
                                        border: '2px solid #f8fafc',
                                        boxShadow: '0 0 6px rgba(102, 126, 234, 0.6)'
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/UserSidebar.js",
                                    lineNumber: 176,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        fontSize: '0.6rem',
                                        color: '#64748b',
                                        fontWeight: '500',
                                        textAlign: 'center',
                                        maxWidth: '60px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    },
                                    children: (activeUser.displayName || activeUser.firstName || activeUser.email?.split('@')[0] || '').substring(0, 8)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/UserSidebar.js",
                                    lineNumber: 187,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, `sidebar-user-${activeUser.uid}-${index}`, true, {
                            fileName: "[project]/src/components/UserSidebar.js",
                            lineNumber: 132,
                            columnNumber: 25
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/UserSidebar.js",
                lineNumber: 111,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleSignOut,
                style: {
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    transition: 'all 0.2s',
                    marginTop: 'auto'
                },
                onMouseOver: (e)=>{
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#ef4444';
                },
                onMouseOut: (e)=>{
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                },
                title: "Cerrar Sesión",
                children: "🚪"
            }, void 0, false, {
                fileName: "[project]/src/components/UserSidebar.js",
                lineNumber: 205,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/UserSidebar.js",
        lineNumber: 21,
        columnNumber: 9
    }, this);
}
_s(UserSidebar, "p25EqY+ph/7kPIJ5Ow6afH+fokk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = UserSidebar;
var _c;
__turbopack_context__.k.register(_c, "UserSidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/firestoreClient.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clientDb",
    ()=>clientDb,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// Firestore Client for Browser (Realtime Listeners)
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyAZ4t2IgeCSBCA_7Di9HvE3KC1WzrsH3q0"),
    authDomain: ("TURBOPACK compile-time value", "web-cot-aya.firebaseapp.com"),
    projectId: ("TURBOPACK compile-time value", "web-cot-aya") || 'web-cot-aya',
    storageBucket: ("TURBOPACK compile-time value", "web-cot-aya.firebasestorage.app") || 'web-cot-aya.firebasestorage.app',
    messagingSenderId: ("TURBOPACK compile-time value", "58467911514"),
    appId: ("TURBOPACK compile-time value", "1:58467911514:web:1c96e90359f42befac5563")
};
// Initialize Firebase for client-side Firestore
let clientApp;
let clientDb;
if ("TURBOPACK compile-time truthy", 1) {
    clientApp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApps"])().length === 0 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApps"])()[0];
    clientDb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFirestore"])(clientApp);
    // Enable offline persistence to avoid BloomFilter errors
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enableIndexedDbPersistence"])(clientDb).catch((err)=>{
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence not supported in this browser');
        }
    });
} else {
    clientApp = null;
    clientDb = null;
}
;
const __TURBOPACK__default__export__ = clientApp;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useRealtimeQuotation.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useRealtimeQuotation",
    ()=>useRealtimeQuotation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firestoreClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function useRealtimeQuotation(quotationId) {
    _s();
    const [quotation, setQuotation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [companyProfiles, setCompanyProfiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [clientProfiles, setClientProfiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [activeUsers, setActiveUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useRealtimeQuotation.useEffect": ()=>{
            if (!quotationId || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientDb"]) return;
            // Listen to quotation changes
            const quotationRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientDb"], 'quotations', quotationId);
            const unsubscribeQuotation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onSnapshot"])(quotationRef, {
                "useRealtimeQuotation.useEffect.unsubscribeQuotation": (snapshot)=>{
                    if (snapshot.exists()) {
                        setQuotation({
                            id: snapshot.id,
                            ...snapshot.data()
                        });
                        setError(null);
                    } else {
                        setError('Quotation not found');
                    }
                    setLoading(false);
                }
            }["useRealtimeQuotation.useEffect.unsubscribeQuotation"], {
                "useRealtimeQuotation.useEffect.unsubscribeQuotation": (err)=>{
                    console.error('Error listening to quotation:', err);
                    setError(err.message);
                    setLoading(false);
                }
            }["useRealtimeQuotation.useEffect.unsubscribeQuotation"]);
            // Listen to company profiles
            const companyProfilesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientDb"], 'company_profiles');
            const unsubscribeCompanyProfiles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onSnapshot"])(companyProfilesRef, {
                "useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles": (snapshot)=>{
                    const profiles = snapshot.docs.map({
                        "useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles.profiles": (doc)=>({
                                id: doc.id,
                                ...doc.data()
                            })
                    }["useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles.profiles"]);
                    // Sort: defaults first, then alphabetically by name
                    profiles.sort({
                        "useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles": (a, b)=>{
                            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
                            return (a.name || '').localeCompare(b.name || '');
                        }
                    }["useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles"]);
                    console.log('🏢 Company Profiles Loaded:', profiles.length);
                    setCompanyProfiles(profiles);
                }
            }["useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles"], {
                "useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles": (error)=>{
                    console.error('Error loading company profiles:', error);
                    setCompanyProfiles([]);
                }
            }["useRealtimeQuotation.useEffect.unsubscribeCompanyProfiles"]);
            // Listen to client profiles
            const clientProfilesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientDb"], 'client_profiles');
            const unsubscribeClientProfiles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onSnapshot"])(clientProfilesRef, {
                "useRealtimeQuotation.useEffect.unsubscribeClientProfiles": (snapshot)=>{
                    const profiles = snapshot.docs.map({
                        "useRealtimeQuotation.useEffect.unsubscribeClientProfiles.profiles": (doc)=>({
                                id: doc.id,
                                ...doc.data()
                            })
                    }["useRealtimeQuotation.useEffect.unsubscribeClientProfiles.profiles"]);
                    // Sort: defaults first, then alphabetically by name
                    profiles.sort({
                        "useRealtimeQuotation.useEffect.unsubscribeClientProfiles": (a, b)=>{
                            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
                            return (a.name || '').localeCompare(b.name || '');
                        }
                    }["useRealtimeQuotation.useEffect.unsubscribeClientProfiles"]);
                    console.log('👤 Client Profiles Loaded:', profiles.length);
                    setClientProfiles(profiles);
                }
            }["useRealtimeQuotation.useEffect.unsubscribeClientProfiles"], {
                "useRealtimeQuotation.useEffect.unsubscribeClientProfiles": (error)=>{
                    console.error('Error loading client profiles:', error);
                    setClientProfiles([]);
                }
            }["useRealtimeQuotation.useEffect.unsubscribeClientProfiles"]);
            // Listen to active users
            const activeUsersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientDb"], 'quotations', quotationId, 'activeUsers');
            const unsubscribeUsers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onSnapshot"])(activeUsersRef, {
                "useRealtimeQuotation.useEffect.unsubscribeUsers": (snapshot)=>{
                    const users = snapshot.docs.map({
                        "useRealtimeQuotation.useEffect.unsubscribeUsers.users": (doc)=>({
                                id: doc.id,
                                ...doc.data()
                            })
                    }["useRealtimeQuotation.useEffect.unsubscribeUsers.users"]);
                    setActiveUsers(users);
                }
            }["useRealtimeQuotation.useEffect.unsubscribeUsers"]);
            // Add current user to active users with proper cleanup
            let userDocRef;
            let heartbeatInterval;
            let isCleanedUp = false;
            if (user) {
                // Use user.uid as document ID so re-mounting overwrites instead of creating duplicates
                const userDocFixed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(activeUsersRef, user.uid);
                userDocRef = userDocFixed;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setDoc"])(userDocFixed, {
                    uid: user.uid,
                    displayName: user.displayName || user.email,
                    firstName: user.firstName,
                    photoURL: user.photoURL,
                    email: user.email,
                    joinedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
                    lastSeen: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
                }, {
                    merge: true
                }).then({
                    "useRealtimeQuotation.useEffect": ()=>{
                        // Heartbeat to update lastSeen
                        heartbeatInterval = setInterval({
                            "useRealtimeQuotation.useEffect": ()=>{
                                if (userDocRef && !isCleanedUp) {
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setDoc"])(userDocFixed, {
                                        lastSeen: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
                                    }, {
                                        merge: true
                                    }).catch({
                                        "useRealtimeQuotation.useEffect": (err)=>{
                                            if (err.code !== 'not-found') {
                                                console.error('Heartbeat error:', err);
                                            }
                                        }
                                    }["useRealtimeQuotation.useEffect"]);
                                }
                            }
                        }["useRealtimeQuotation.useEffect"], 30000);
                    }
                }["useRealtimeQuotation.useEffect"]).catch({
                    "useRealtimeQuotation.useEffect": (err)=>{
                        console.error('Error adding user to active users:', err);
                    }
                }["useRealtimeQuotation.useEffect"]);
            }
            return ({
                "useRealtimeQuotation.useEffect": ()=>{
                    isCleanedUp = true;
                    unsubscribeQuotation();
                    unsubscribeCompanyProfiles();
                    unsubscribeClientProfiles();
                    unsubscribeUsers();
                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval);
                    }
                    if (userDocRef) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteDoc"])(userDocRef).catch({
                            "useRealtimeQuotation.useEffect": (err)=>{
                                // Silently ignore if document doesn't exist
                                if (err.code !== 'not-found') {
                                    console.error('Error removing user:', err);
                                }
                            }
                        }["useRealtimeQuotation.useEffect"]);
                    }
                }
            })["useRealtimeQuotation.useEffect"];
        }
    }["useRealtimeQuotation.useEffect"], [
        quotationId,
        user
    ]);
    const updateQuotation = async (updates)=>{
        if (!quotationId || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientDb"]) return;
        try {
            const quotationRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestoreClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientDb"], 'quotations', quotationId);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateDoc"])(quotationRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error updating quotation:', err);
            throw err;
        }
    };
    return {
        quotation,
        companyProfiles,
        clientProfiles,
        activeUsers,
        loading,
        error,
        updateQuotation
    };
}
_s(useRealtimeQuotation, "kiOfkbgY5bc4nRttYlIR0St2Iyc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/quotations/[id]/page.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>QuotationEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$QuotationDocument$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/QuotationDocument.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProtectedRoute$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProtectedRoute.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UserSidebar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/UserSidebar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useRealtimeQuotation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useRealtimeQuotation.js [app-client] (ecmascript)");
;
;
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
// Import PDFViewer dynamically to avoid SSR issues
const PDFViewer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/node_modules/@react-pdf/renderer/lib/react-pdf.browser.js [app-client] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.PDFViewer), {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/@react-pdf/renderer/lib/react-pdf.browser.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: "Cargando previsualización..."
        }, void 0, false, {
            fileName: "[project]/src/app/quotations/[id]/page.js",
            lineNumber: 14,
            columnNumber: 34
        }, ("TURBOPACK compile-time value", void 0))
});
_c = PDFViewer;
const PDFDownloadLink = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/node_modules/@react-pdf/renderer/lib/react-pdf.browser.js [app-client] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.PDFDownloadLink), {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/@react-pdf/renderer/lib/react-pdf.browser.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
_c1 = PDFDownloadLink;
// Memoized PDF component — only re-renders when dataForPdf reference changes
const PdfPreview = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(function PdfPreview({ dataForPdf }) {
    if (!dataForPdf) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                color: '#94a3b8',
                textAlign: 'center'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        fontSize: '2rem',
                        marginBottom: '0.5rem'
                    },
                    children: "📄"
                }, void 0, false, {
                    fileName: "[project]/src/app/quotations/[id]/page.js",
                    lineNumber: 27,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "Cargando vista previa..."
                }, void 0, false, {
                    fileName: "[project]/src/app/quotations/[id]/page.js",
                    lineNumber: 28,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/quotations/[id]/page.js",
            lineNumber: 26,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PDFViewer, {
        width: "100%",
        height: "100%",
        style: {
            border: 'none'
        },
        showToolbar: true,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$QuotationDocument$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QuotationDocument"], {
            data: dataForPdf
        }, void 0, false, {
            fileName: "[project]/src/app/quotations/[id]/page.js",
            lineNumber: 34,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/quotations/[id]/page.js",
        lineNumber: 33,
        columnNumber: 9
    }, this);
});
_c2 = PdfPreview;
function QuotationEditor() {
    _s();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = params;
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    // Use Firestore realtime hook
    const { quotation, companyProfiles, clientProfiles, activeUsers: realtimeUsers, loading, error, updateQuotation } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useRealtimeQuotation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRealtimeQuotation"])(id);
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        clientName: '',
        clientRuc: '',
        clientAddress: '',
        code: '',
        items: [
            {
                description: 'Servicio Ejemplo',
                quantity: 1,
                price: 100
            }
        ],
        globalProfitPercentage: '',
        globalOtherCosts: '',
        companyProfiles: [],
        clientProfiles: []
    });
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [autoSaving, setAutoSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeUsers, setActiveUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [remoteFocus, setRemoteFocus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({}); // { fieldName: userObject }
    const isRemoteUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Separate state for PDF - only updated manually via button
    const [pdfData, setPdfData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const pdfUpdateTimeout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const autoSaveTimeout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pdfInitialized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false); // tracks if PDF was loaded at least once
    // Reset PDF state whenever we navigate to a different quotation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "QuotationEditor.useEffect": ()=>{
            pdfInitialized.current = false;
            setPdfData(null);
        }
    }["QuotationEditor.useEffect"], [
        id
    ]);
    // Update local data when Firestore quotation changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "QuotationEditor.useEffect": ()=>{
            if (quotation && companyProfiles && clientProfiles) {
                isRemoteUpdate.current = true;
                // Auto-select default company profile if none is selected
                const selectedCompanyProfileId = quotation.companyProfileId || companyProfiles.find({
                    "QuotationEditor.useEffect": (cp)=>cp.isDefault
                }["QuotationEditor.useEffect"])?.id || null;
                // Auto-select default client profile if none is selected
                const selectedClientProfileId = quotation.clientProfileId || clientProfiles.find({
                    "QuotationEditor.useEffect": (cp)=>cp.isDefault
                }["QuotationEditor.useEffect"])?.id || null;
                const newData = {
                    "QuotationEditor.useEffect.newData": (prevData)=>({
                            ...quotation,
                            companyProfiles,
                            clientProfiles,
                            companyProfileId: selectedCompanyProfileId,
                            clientProfileId: selectedClientProfileId,
                            clientName: quotation.clientName || prevData.clientName || '',
                            clientRuc: quotation.clientRuc || prevData.clientRuc || '',
                            clientAddress: quotation.clientAddress || prevData.clientAddress || '',
                            items: quotation.items && quotation.items.length > 0 ? quotation.items : [
                                {
                                    description: '',
                                    quantity: 1,
                                    price: 0
                                }
                            ],
                            globalProfitPercentage: quotation.globalProfitPercentage || '',
                            globalOtherCosts: quotation.globalOtherCosts || ''
                        })
                }["QuotationEditor.useEffect.newData"];
                setData(newData);
                // Only initialize pdfData once companyProfiles has actual data loaded
                // companyProfiles starts as [] (truthy but empty), which caused company to be missing
                if (!pdfInitialized.current && companyProfiles.length > 0) {
                    pdfInitialized.current = true;
                    setPdfData(newData({
                        clientName: '',
                        clientRuc: '',
                        clientAddress: ''
                    }));
                }
            }
        }
    }["QuotationEditor.useEffect"], [
        quotation,
        companyProfiles,
        clientProfiles
    ]);
    const handleFocus = (field)=>{
    // Focus tracking removed - not needed with Firestore
    };
    const handleBlur = (field)=>{
    // Blur tracking removed - not needed with Firestore
    };
    const getInputStyle = (field, baseStyle = {})=>{
        const focusUser = remoteFocus[field];
        if (focusUser) {
            return {
                ...baseStyle,
                borderColor: focusUser.color || '#3b82f6',
                boxShadow: `0 0 0 2px ${focusUser.color || '#3b82f6'}20`,
                transition: 'all 0.2s',
                position: 'relative'
            };
        }
        return {
            ...baseStyle,
            width: '100%',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #ccc'
        };
    };
    const renderRemoteCursorLabel = (field)=>{
        const focusUser = remoteFocus[field];
        if (focusUser) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    top: '-18px',
                    right: '0',
                    background: focusUser.color || '#3b82f6',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px 4px 0 0',
                    zIndex: 10
                },
                children: focusUser.firstName
            }, void 0, false, {
                fileName: "[project]/src/app/quotations/[id]/page.js",
                lineNumber: 147,
                columnNumber: 17
            }, this);
        }
        return null;
    };
    const handleChange = async (field, value)=>{
        const newData = {
            ...data,
            [field]: value
        };
        setData(newData);
        // Clear existing timeout
        if (autoSaveTimeout.current) {
            clearTimeout(autoSaveTimeout.current);
        }
        // Set auto-saving indicator immediately
        setAutoSaving(true);
        // Debounce Firestore update - only save after user stops typing for 500ms
        autoSaveTimeout.current = setTimeout(async ()=>{
            if (id && updateQuotation) {
                try {
                    await updateQuotation({
                        [field]: value
                    });
                    setAutoSaving(false);
                } catch (err) {
                    console.error('Error updating quotation:', err);
                    setAutoSaving(false);
                }
            }
        }, 500);
        // Debounce PDF update - auto-refresh 2s after user stops typing
        // Uses current data state, NOT triggered by Firestore (avoids flickering)
        if (pdfUpdateTimeout.current) {
            clearTimeout(pdfUpdateTimeout.current);
        }
        pdfUpdateTimeout.current = setTimeout(()=>{
            setData((currentData)=>{
                setPdfData({
                    ...currentData,
                    [field]: value
                });
                return currentData;
            });
        }, 2000);
    };
    const handleClientProfileChange = async (clientProfileId)=>{
        console.log('🔍 Client Profile Change:', clientProfileId);
        console.log('Available profiles:', data.clientProfiles);
        // Don't use parseInt - IDs can be Firestore strings or numbers
        const selectedClient = data.clientProfiles?.find((p)=>String(p.id) === String(clientProfileId));
        console.log('Selected client:', selectedClient);
        const newData = {
            ...data,
            clientProfileId: clientProfileId,
            clientName: selectedClient ? selectedClient.name || '' : '',
            clientRuc: selectedClient ? selectedClient.ruc || '' : '',
            clientAddress: selectedClient ? selectedClient.address || '' : ''
        };
        console.log('New data:', {
            clientName: newData.clientName,
            clientRuc: newData.clientRuc,
            clientAddress: newData.clientAddress
        });
        setData(newData);
        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    clientProfileId: newData.clientProfileId,
                    clientName: newData.clientName,
                    clientRuc: newData.clientRuc,
                    clientAddress: newData.clientAddress
                });
            } catch (err) {
                console.error('Error updating client profile:', err);
            }
        }
    };
    const handleCompanyProfileChange = async (companyProfileId)=>{
        console.log('🏢 Company Profile Change:', companyProfileId);
        console.log('Available company profiles:', data.companyProfiles);
        // Don't use parseInt - IDs can be Firestore strings or numbers
        const selectedCompany = data.companyProfiles?.find((p)=>String(p.id) === String(companyProfileId));
        console.log('Selected company:', selectedCompany);
        const newData = {
            ...data,
            companyProfileId: companyProfileId,
            // Copy company conditions to notes field
            notes: selectedCompany?.conditions || data.notes || ''
        };
        console.log('New notes:', newData.notes);
        setData(newData);
        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    companyProfileId: newData.companyProfileId,
                    notes: newData.notes
                });
            } catch (err) {
                console.error('Error updating company profile:', err);
            }
        }
    };
    const handleItemChange = async (index, field, value)=>{
        const newItems = [
            ...data.items
        ];
        newItems[index][field] = value;
        const newData = {
            ...data,
            items: newItems
        };
        setData(newData);
        // Update Firestore directly with auto-save indicator
        if (id && updateQuotation) {
            try {
                setAutoSaving(true);
                await updateQuotation({
                    items: newItems
                });
                setAutoSaving(false);
            } catch (err) {
                console.error('Error updating items:', err);
                setAutoSaving(false);
            }
        }
    };
    const addItem = async ()=>{
        const newItems = [
            ...data.items,
            {
                description: '',
                quantity: 1,
                price: 0
            }
        ];
        const newData = {
            ...data,
            items: newItems
        };
        setData(newData);
        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    items: newItems
                });
            } catch (err) {
                console.error('Error adding item:', err);
            }
        }
    };
    const removeItem = async (index)=>{
        if (data.items.length <= 1) return; // keep at least one item
        const newItems = data.items.filter((_, i)=>i !== index);
        const newData = {
            ...data,
            items: newItems
        };
        setData(newData);
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    items: newItems
                });
            } catch (err) {
                console.error('Error removing item:', err);
            }
        }
    };
    const duplicateItem = async (index)=>{
        const itemToCopy = {
            ...data.items[index]
        };
        const newItems = [
            ...data.items.slice(0, index + 1),
            itemToCopy,
            ...data.items.slice(index + 1)
        ];
        const newData = {
            ...data,
            items: newItems
        };
        setData(newData);
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    items: newItems
                });
            } catch (err) {
                console.error('Error duplicating item:', err);
            }
        }
    };
    const saveQuotation = async ()=>{
        setSaving(true);
        try {
            // First update the quotation data
            if (updateQuotation) {
                await updateQuotation(data);
            }
            // If not published, publish it and assign code
            if (!data.isPublished && !quotation.isPublished) {
                const res = await fetch('/api/quotations/publish', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        quotationId: id
                    })
                });
                const result = await res.json();
                if (result.success) {
                    // Refresh page to get the new code
                    window.location.reload();
                }
            }
            setSaving(false);
        } catch (e) {
            console.error(e);
            setSaving(false);
        }
    };
    const total = data.items ? data.items.reduce((acc, item)=>acc + item.quantity * item.price, 0) : 0;
    // Find the selected company profile data
    const selectedCompany = data.companyProfiles?.find((p)=>String(p.id) === String(data.companyProfileId)) || data.companyProfiles?.find((p)=>p.isDefault) || {};
    // Find the selected client profile data
    const selectedClient = data.clientProfiles?.find((p)=>String(p.id) === String(data.clientProfileId)) || data.clientProfiles?.find((p)=>p.isDefault) || {};
    // Memoize dataForPdf so it ONLY recomputes when pdfData changes (via button click)
    // This prevents PDFViewer from re-rendering on every keystroke
    const dataForPdf = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "QuotationEditor.useMemo[dataForPdf]": ()=>{
            const safePdfData = pdfData || {};
            const pdfTotal = safePdfData.items ? safePdfData.items.reduce({
                "QuotationEditor.useMemo[dataForPdf]": (acc, item)=>acc + item.quantity * item.price
            }["QuotationEditor.useMemo[dataForPdf]"], 0) : 0;
            const pdfSelectedCompany = safePdfData.companyProfiles?.find({
                "QuotationEditor.useMemo[dataForPdf]": (p)=>String(p.id) === String(safePdfData.companyProfileId)
            }["QuotationEditor.useMemo[dataForPdf]"]) || safePdfData.companyProfiles?.find({
                "QuotationEditor.useMemo[dataForPdf]": (p)=>p.isDefault
            }["QuotationEditor.useMemo[dataForPdf]"]) || {};
            const pdfSelectedClient = safePdfData.clientProfiles?.find({
                "QuotationEditor.useMemo[dataForPdf]": (p)=>String(p.id) === String(safePdfData.clientProfileId)
            }["QuotationEditor.useMemo[dataForPdf]"]) || safePdfData.clientProfiles?.find({
                "QuotationEditor.useMemo[dataForPdf]": (p)=>p.isDefault
            }["QuotationEditor.useMemo[dataForPdf]"]) || {};
            return {
                ...safePdfData,
                total: pdfTotal,
                company: pdfSelectedCompany,
                clientName: pdfSelectedClient.name || safePdfData.clientName || '',
                clientRuc: pdfSelectedClient.ruc || safePdfData.clientRuc || '',
                clientAddress: pdfSelectedClient.address || safePdfData.clientAddress || '',
                notes: safePdfData.notes !== undefined ? safePdfData.notes : safePdfData.generalConditions?.text || ''
            };
        }
    }["QuotationEditor.useMemo[dataForPdf]"], [
        pdfData
    ]); // ONLY recomputes when user presses the refresh button
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProtectedRoute$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProtectedRoute"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UserSidebar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserSidebar"], {
                activeUsers: activeUsers
            }, void 0, false, {
                fileName: "[project]/src/app/quotations/[id]/page.js",
                lineNumber: 401,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    height: '100vh',
                    overflow: 'hidden',
                    marginLeft: '80px'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: '50%',
                            padding: '2rem',
                            overflowY: 'auto',
                            borderRight: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '2rem'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        style: {
                                            color: '#1e293b'
                                        },
                                        children: "Editor de Cotización"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 406,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: '15px',
                                            alignItems: 'center'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn",
                                                style: {
                                                    background: '#64748b',
                                                    color: 'white'
                                                },
                                                onClick: ()=>router.push('/'),
                                                children: "← Menú Principal"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 408,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: '0.8rem',
                                                    color: autoSaving ? '#f59e0b' : '#22c55e',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: autoSaving ? '#f59e0b' : '#22c55e'
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                        lineNumber: 412,
                                                        columnNumber: 33
                                                    }, this),
                                                    autoSaving ? 'Guardando...' : 'Guardado'
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 411,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn btn-primary",
                                                onClick: saveQuotation,
                                                disabled: saving,
                                                children: saving ? 'Guardando...' : 'Guardar Cambios'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 415,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 407,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 405,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "card-editor",
                                style: {
                                    marginBottom: '1.5rem',
                                    position: 'relative'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        style: {
                                            display: 'block',
                                            fontWeight: 'bold',
                                            marginBottom: '0.5rem',
                                            color: '#1e293b'
                                        },
                                        children: "Empresa Emisora"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 422,
                                        columnNumber: 25
                                    }, this),
                                    renderRemoteCursorLabel('companyProfileId'),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: data.companyProfileId || '',
                                        onChange: (e)=>handleCompanyProfileChange(e.target.value),
                                        onFocus: ()=>handleFocus('companyProfileId'),
                                        onBlur: ()=>handleBlur('companyProfileId'),
                                        style: getInputStyle('companyProfileId'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Seleccionar Empresa..."
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 431,
                                                columnNumber: 29
                                            }, this),
                                            data.companyProfiles && data.companyProfiles.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: p.id,
                                                    children: [
                                                        p.name,
                                                        " ",
                                                        p.isDefault ? '(Predeterminada)' : ''
                                                    ]
                                                }, p.id, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 433,
                                                    columnNumber: 33
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 424,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 421,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "card-editor",
                                style: {
                                    marginBottom: '1.5rem',
                                    position: 'relative'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        style: {
                                            display: 'block',
                                            fontWeight: 'bold',
                                            marginBottom: '0.5rem',
                                            color: '#1e293b'
                                        },
                                        children: "Perfil de Cliente"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 439,
                                        columnNumber: 25
                                    }, this),
                                    renderRemoteCursorLabel('clientProfileId'),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: data.clientProfileId || '',
                                        onChange: (e)=>handleClientProfileChange(e.target.value),
                                        onFocus: ()=>handleFocus('clientProfileId'),
                                        onBlur: ()=>handleBlur('clientProfileId'),
                                        style: getInputStyle('clientProfileId'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Seleccionar Cliente..."
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 448,
                                                columnNumber: 29
                                            }, this),
                                            data.clientProfiles && data.clientProfiles.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: p.id,
                                                    children: [
                                                        p.name,
                                                        " ",
                                                        p.isDefault ? '(Predeterminado)' : ''
                                                    ]
                                                }, p.id, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 450,
                                                    columnNumber: 33
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 441,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 438,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "card-editor",
                                style: {
                                    marginBottom: '2rem'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr',
                                        gap: '1rem'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                position: 'relative'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        display: 'block',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                        color: '#1e293b'
                                                    },
                                                    children: "Nombre de Cliente"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 458,
                                                    columnNumber: 33
                                                }, this),
                                                renderRemoteCursorLabel('clientName'),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: data.clientName || '',
                                                    onChange: (e)=>handleChange('clientName', e.target.value),
                                                    onFocus: ()=>handleFocus('clientName'),
                                                    onBlur: ()=>handleBlur('clientName'),
                                                    style: getInputStyle('clientName'),
                                                    placeholder: "Juan Pérez"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 460,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 457,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                position: 'relative'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        display: 'block',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                        color: '#1e293b'
                                                    },
                                                    children: "RUC"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 471,
                                                    columnNumber: 33
                                                }, this),
                                                renderRemoteCursorLabel('clientRuc'),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: data.clientRuc || '',
                                                    onChange: (e)=>handleChange('clientRuc', e.target.value),
                                                    onFocus: ()=>handleFocus('clientRuc'),
                                                    onBlur: ()=>handleBlur('clientRuc'),
                                                    style: getInputStyle('clientRuc'),
                                                    placeholder: "12345678901"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 473,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 470,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                position: 'relative'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        display: 'block',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                        color: '#1e293b'
                                                    },
                                                    children: "Dirección"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 484,
                                                    columnNumber: 33
                                                }, this),
                                                renderRemoteCursorLabel('clientAddress'),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: data.clientAddress || '',
                                                    onChange: (e)=>handleChange('clientAddress', e.target.value),
                                                    onFocus: ()=>handleFocus('clientAddress'),
                                                    onBlur: ()=>handleBlur('clientAddress'),
                                                    style: getInputStyle('clientAddress'),
                                                    placeholder: "Calle Falsa 123"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 486,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 483,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                gridColumn: 'span 3',
                                                marginTop: '1rem',
                                                position: 'relative'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        display: 'block',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                        color: '#1e293b'
                                                    },
                                                    children: "2. Descripción del Servicio o Producto"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 497,
                                                    columnNumber: 33
                                                }, this),
                                                renderRemoteCursorLabel('serviceDescription'),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                    value: data.serviceDescription || '',
                                                    onChange: (e)=>handleChange('serviceDescription', e.target.value),
                                                    onFocus: ()=>handleFocus('serviceDescription'),
                                                    onBlur: ()=>handleBlur('serviceDescription'),
                                                    style: getInputStyle('serviceDescription', {
                                                        minHeight: '80px'
                                                    }),
                                                    placeholder: "Describa brevemente el servicio o producto a cotizar..."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 499,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 496,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                    lineNumber: 456,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 455,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    color: '#1e293b'
                                },
                                children: "Configuración Global de Precios (Interno)"
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 511,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "card-editor",
                                style: {
                                    marginBottom: '2rem',
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr 1fr',
                                            gap: '1rem',
                                            alignItems: 'flex-end'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    position: 'relative'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: {
                                                            display: 'block',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            marginBottom: '0.5rem',
                                                            color: '#1e293b'
                                                        },
                                                        children: "% Ganancia Global"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                        lineNumber: 515,
                                                        columnNumber: 33
                                                    }, this),
                                                    renderRemoteCursorLabel('globalProfitPercentage'),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        value: data.globalProfitPercentage || '',
                                                        onChange: (e)=>handleChange('globalProfitPercentage', e.target.value),
                                                        onFocus: ()=>handleFocus('globalProfitPercentage'),
                                                        onBlur: ()=>handleBlur('globalProfitPercentage'),
                                                        style: getInputStyle('globalProfitPercentage'),
                                                        placeholder: "0"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                        lineNumber: 517,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 514,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    position: 'relative'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: {
                                                            display: 'block',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            marginBottom: '0.5rem',
                                                            color: '#1e293b'
                                                        },
                                                        children: "% Otros Global"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                        lineNumber: 528,
                                                        columnNumber: 33
                                                    }, this),
                                                    renderRemoteCursorLabel('globalOtherCosts'),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        value: data.globalOtherCosts || '',
                                                        onChange: (e)=>handleChange('globalOtherCosts', e.target.value),
                                                        onFocus: ()=>handleFocus('globalOtherCosts'),
                                                        onBlur: ()=>handleBlur('globalOtherCosts'),
                                                        style: getInputStyle('globalOtherCosts'),
                                                        placeholder: "0"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                        lineNumber: 530,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 527,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn",
                                                style: {
                                                    background: '#334155',
                                                    color: 'white',
                                                    padding: '0.75rem'
                                                },
                                                onClick: ()=>{
                                                    const gp = parseFloat(data.globalProfitPercentage || 0);
                                                    const go = parseFloat(data.globalOtherCosts || 0);
                                                    const newItems = data.items.map((item)=>{
                                                        const bp = parseFloat(item.basePrice || 0);
                                                        const finalPrice = bp * (1 + (gp + go) / 100);
                                                        return {
                                                            ...item,
                                                            profitPercentage: data.globalProfitPercentage,
                                                            otherCosts: data.globalOtherCosts,
                                                            price: finalPrice.toFixed(2)
                                                        };
                                                    });
                                                    handleChange('items', newItems);
                                                },
                                                children: "Aplicar a todos los ítems"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 540,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 513,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            fontSize: '0.7rem',
                                            color: '#64748b',
                                            marginTop: '0.75rem'
                                        },
                                        children: "* Esto actualizará los porcentajes y recalculará el Precio U. de cada ítem basado en su Costo Base."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 562,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 512,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    color: '#1e293b'
                                },
                                children: "Ítems"
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 567,
                                columnNumber: 21
                            }, this),
                            data.items && data.items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "card-editor",
                                    style: {
                                        marginBottom: '1rem',
                                        padding: '1.25rem'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.5rem'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        fontSize: '0.7rem',
                                                        fontWeight: '700',
                                                        color: '#94a3b8',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    },
                                                    children: [
                                                        "Ítem #",
                                                        index + 1
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 572,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        gap: '0.4rem'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>duplicateItem(index),
                                                            title: "Duplicar ítem",
                                                            style: {
                                                                background: '#e0f2fe',
                                                                border: 'none',
                                                                color: '#0369a1',
                                                                cursor: 'pointer',
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            },
                                                            onMouseOver: (e)=>e.currentTarget.style.background = '#bae6fd',
                                                            onMouseOut: (e)=>e.currentTarget.style.background = '#e0f2fe',
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                                        x: "9",
                                                                        y: "9",
                                                                        width: "13",
                                                                        height: "13",
                                                                        rx: "2",
                                                                        ry: "2"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 582,
                                                                        columnNumber: 219
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 582,
                                                                        columnNumber: 276
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                lineNumber: 582,
                                                                columnNumber: 41
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 575,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>removeItem(index),
                                                            title: "Eliminar ítem",
                                                            disabled: data.items.length <= 1,
                                                            style: {
                                                                background: data.items.length <= 1 ? '#f1f5f9' : '#fee2e2',
                                                                border: 'none',
                                                                color: data.items.length <= 1 ? '#cbd5e1' : '#dc2626',
                                                                cursor: data.items.length <= 1 ? 'not-allowed' : 'pointer',
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            },
                                                            onMouseOver: (e)=>{
                                                                if (data.items.length > 1) e.currentTarget.style.background = '#fecaca';
                                                            },
                                                            onMouseOut: (e)=>{
                                                                if (data.items.length > 1) e.currentTarget.style.background = '#fee2e2';
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                        points: "3 6 5 6 21 6"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 593,
                                                                        columnNumber: 219
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 593,
                                                                        columnNumber: 253
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M10 11v6"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 593,
                                                                        columnNumber: 311
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M14 11v6"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 593,
                                                                        columnNumber: 332
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 593,
                                                                        columnNumber: 353
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                lineNumber: 593,
                                                                columnNumber: 41
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 585,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 573,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 571,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                                                gap: '0.75rem',
                                                marginBottom: '0.75rem'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        gridColumn: 'span 5',
                                                        position: 'relative'
                                                    },
                                                    children: [
                                                        renderRemoteCursorLabel(`item_${index}_description`),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            placeholder: "Descripción del ítem",
                                                            style: getInputStyle(`item_${index}_description`, {
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ccc'
                                                            }),
                                                            value: item.description,
                                                            onChange: (e)=>handleItemChange(index, 'description', e.target.value),
                                                            onFocus: ()=>handleFocus(`item_${index}_description`),
                                                            onBlur: ()=>handleBlur(`item_${index}_description`)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 600,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 598,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        position: 'relative'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: '0.7rem',
                                                                color: '#334155',
                                                                display: 'block',
                                                                fontWeight: 'bold'
                                                            },
                                                            children: "Cant."
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 611,
                                                            columnNumber: 37
                                                        }, this),
                                                        renderRemoteCursorLabel(`item_${index}_quantity`),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            style: getInputStyle(`item_${index}_quantity`, {
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ccc'
                                                            }),
                                                            value: item.quantity,
                                                            onChange: (e)=>handleItemChange(index, 'quantity', e.target.value),
                                                            onFocus: ()=>handleFocus(`item_${index}_quantity`),
                                                            onBlur: ()=>handleBlur(`item_${index}_quantity`)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 613,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 610,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        position: 'relative'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: '0.7rem',
                                                                color: '#334155',
                                                                display: 'block',
                                                                fontWeight: 'bold'
                                                            },
                                                            children: "Costo Base"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 624,
                                                            columnNumber: 37
                                                        }, this),
                                                        renderRemoteCursorLabel(`item_${index}_basePrice`),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            placeholder: "0.00",
                                                            style: getInputStyle(`item_${index}_basePrice`, {
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ccc'
                                                            }),
                                                            value: item.basePrice || '',
                                                            onChange: (e)=>{
                                                                const bp = parseFloat(e.target.value) || 0;
                                                                const profit = parseFloat(item.profitPercentage) || 0;
                                                                const others = parseFloat(item.otherCosts) || 0;
                                                                const finalPrice = bp * (1 + (profit + others) / 100);
                                                                handleItemChange(index, 'basePrice', e.target.value);
                                                                handleItemChange(index, 'price', finalPrice.toFixed(2));
                                                            },
                                                            onFocus: ()=>handleFocus(`item_${index}_basePrice`),
                                                            onBlur: ()=>handleBlur(`item_${index}_basePrice`)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 626,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 623,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        position: 'relative'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: '0.7rem',
                                                                color: '#334155',
                                                                display: 'block',
                                                                fontWeight: 'bold'
                                                            },
                                                            children: "% Gan."
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 646,
                                                            columnNumber: 37
                                                        }, this),
                                                        renderRemoteCursorLabel(`item_${index}_profitPercentage`),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            placeholder: "0",
                                                            style: getInputStyle(`item_${index}_profitPercentage`, {
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ccc'
                                                            }),
                                                            value: item.profitPercentage || '',
                                                            onChange: (e)=>{
                                                                const profit = parseFloat(e.target.value) || 0;
                                                                const bp = parseFloat(item.basePrice || 0);
                                                                const others = parseFloat(item.otherCosts || 0);
                                                                const finalPrice = bp * (1 + (profit + others) / 100);
                                                                handleItemChange(index, 'profitPercentage', e.target.value);
                                                                handleItemChange(index, 'price', finalPrice.toFixed(2));
                                                            },
                                                            onFocus: ()=>handleFocus(`item_${index}_profitPercentage`),
                                                            onBlur: ()=>handleBlur(`item_${index}_profitPercentage`)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 648,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 645,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        position: 'relative'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: '0.7rem',
                                                                color: '#334155',
                                                                display: 'block',
                                                                fontWeight: 'bold'
                                                            },
                                                            children: "% Otros"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 668,
                                                            columnNumber: 37
                                                        }, this),
                                                        renderRemoteCursorLabel(`item_${index}_otherCosts`),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            placeholder: "0",
                                                            style: getInputStyle(`item_${index}_otherCosts`, {
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ccc'
                                                            }),
                                                            value: item.otherCosts || '',
                                                            onChange: (e)=>{
                                                                const profit = parseFloat(item.profitPercentage || 0);
                                                                const bp = parseFloat(item.basePrice || 0);
                                                                const others = parseFloat(e.target.value) || 0;
                                                                const finalPrice = bp * (1 + (profit + others) / 100);
                                                                handleItemChange(index, 'otherCosts', e.target.value);
                                                                handleItemChange(index, 'price', finalPrice.toFixed(2));
                                                            },
                                                            onFocus: ()=>handleFocus(`item_${index}_otherCosts`),
                                                            onBlur: ()=>handleBlur(`item_${index}_otherCosts`)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 670,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 667,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        position: 'relative'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: '0.7rem',
                                                                color: '#334155',
                                                                display: 'block',
                                                                fontWeight: 'bold'
                                                            },
                                                            children: "Precio U."
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 690,
                                                            columnNumber: 37
                                                        }, this),
                                                        renderRemoteCursorLabel(`item_${index}_price`),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            step: "0.01",
                                                            style: getInputStyle(`item_${index}_price`, {
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '4px',
                                                                border: '1px solid #22c55e',
                                                                backgroundColor: '#f0fdf4'
                                                            }),
                                                            value: item.price,
                                                            onChange: (e)=>handleItemChange(index, 'price', e.target.value),
                                                            onFocus: ()=>handleFocus(`item_${index}_price`),
                                                            onBlur: ()=>handleBlur(`item_${index}_price`)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                                            lineNumber: 692,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 689,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 597,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, index, true, {
                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                    lineNumber: 569,
                                    columnNumber: 25
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: addItem,
                                className: "btn",
                                style: {
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    marginBottom: '2rem'
                                },
                                children: "+ Agregar Ítem"
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 705,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    color: '#1e293b'
                                },
                                children: "Notas / Condiciones"
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 709,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "card-editor",
                                style: {
                                    position: 'relative'
                                },
                                children: [
                                    renderRemoteCursorLabel('notes'),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        value: data.notes !== undefined ? data.notes : data.generalConditions?.text || '',
                                        onChange: (e)=>handleChange('notes', e.target.value),
                                        onFocus: ()=>handleFocus('notes'),
                                        onBlur: ()=>handleBlur('notes'),
                                        rows: 6,
                                        style: getInputStyle('notes', {
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ccc',
                                            fontFamily: 'inherit'
                                        }),
                                        placeholder: "Notas adicionales para esta cotización..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 712,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 710,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/quotations/[id]/page.js",
                        lineNumber: 404,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: '50%',
                            backgroundColor: '#525659',
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#3a3c3e',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: '#cbd5e1',
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        },
                                        children: "Vista Previa del PDF"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 728,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: '0.5rem'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setPdfData({
                                                        ...data
                                                    }),
                                                style: {
                                                    background: '#475569',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '0.4rem 0.9rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem'
                                                },
                                                onMouseOver: (e)=>e.currentTarget.style.background = '#334155',
                                                onMouseOut: (e)=>e.currentTarget.style.background = '#475569',
                                                children: "🔄 Actualizar"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 730,
                                                columnNumber: 29
                                            }, this),
                                            dataForPdf && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PDFDownloadLink, {
                                                document: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$QuotationDocument$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QuotationDocument"], {
                                                    data: dataForPdf
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                                    lineNumber: 740,
                                                    columnNumber: 47
                                                }, void 0),
                                                fileName: `${dataForPdf.code || 'cotizacion'}.pdf`,
                                                style: {
                                                    textDecoration: 'none'
                                                },
                                                children: ({ loading })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        style: {
                                                            background: '#16a34a',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '0.4rem 0.9rem',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            cursor: loading ? 'wait' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            opacity: loading ? 0.7 : 1
                                                        },
                                                        onMouseOver: (e)=>{
                                                            if (!loading) e.currentTarget.style.background = '#15803d';
                                                        },
                                                        onMouseOut: (e)=>{
                                                            if (!loading) e.currentTarget.style.background = '#16a34a';
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                width: "13",
                                                                height: "13",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2.5",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 750,
                                                                        columnNumber: 225
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                        points: "7 10 12 15 17 10"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 750,
                                                                        columnNumber: 279
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                        x1: "12",
                                                                        y1: "15",
                                                                        x2: "12",
                                                                        y2: "3"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                        lineNumber: 750,
                                                                        columnNumber: 317
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                                lineNumber: 750,
                                                                columnNumber: 45
                                                            }, this),
                                                            loading ? 'Generando...' : 'Descargar PDF'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                        lineNumber: 745,
                                                        columnNumber: 41
                                                    }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 739,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 729,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 727,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PdfPreview, {
                                    dataForPdf: dataForPdf
                                }, void 0, false, {
                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                    lineNumber: 759,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 758,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/quotations/[id]/page.js",
                        lineNumber: 726,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/quotations/[id]/page.js",
                lineNumber: 402,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/quotations/[id]/page.js",
        lineNumber: 400,
        columnNumber: 9
    }, this);
}
_s(QuotationEditor, "PO9o9FV0BN1adOcRqru//+0kap8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useRealtimeQuotation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRealtimeQuotation"]
    ];
});
_c3 = QuotationEditor;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "PDFViewer");
__turbopack_context__.k.register(_c1, "PDFDownloadLink");
__turbopack_context__.k.register(_c2, "PdfPreview");
__turbopack_context__.k.register(_c3, "QuotationEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_318122bd._.js.map