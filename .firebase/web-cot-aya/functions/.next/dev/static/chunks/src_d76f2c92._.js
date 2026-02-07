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
"[project]/src/components/ActiveUsers.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActiveUsers",
    ()=>ActiveUsers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function ActiveUsers({ users, currentUser }) {
    _s();
    const [typingUsers, setTypingUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Map());
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: ("TURBOPACK compile-time truthy", 1) ? window.innerWidth - 350 : "TURBOPACK unreachable",
        y: 20
    });
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragStart, setDragStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [isMinimized, setIsMinimized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Filter out current user and remove duplicates
    const otherUsers = users?.filter((u)=>u.uid !== currentUser?.uid) || [];
    const uniqueUsers = Array.from(new Map(otherUsers.map((u)=>[
            u.uid,
            u
        ])).values());
    const handleMouseDown = (e)=>{
        if (e.target.closest('.drag-handle-users')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };
    const handleMouseMove = (e)=>{
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    const handleMouseUp = ()=>{
        setIsDragging(false);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ActiveUsers.useEffect": ()=>{
            if (isDragging) {
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                return ({
                    "ActiveUsers.useEffect": ()=>{
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                    }
                })["ActiveUsers.useEffect"];
            }
        }
    }["ActiveUsers.useEffect"], [
        isDragging,
        dragStart
    ]);
    if (uniqueUsers.length === 0) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 1000,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            minWidth: isMinimized ? '150px' : '300px'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "drag-handle-users",
                onMouseDown: handleMouseDown,
                style: {
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "👥 Editando"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ActiveUsers.js",
                        lineNumber: 86,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setIsMinimized(!isMinimized),
                        style: {
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                        },
                        title: isMinimized ? 'Maximizar' : 'Minimizar',
                        children: isMinimized ? '▢' : '−'
                    }, void 0, false, {
                        fileName: "[project]/src/components/ActiveUsers.js",
                        lineNumber: 87,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ActiveUsers.js",
                lineNumber: 68,
                columnNumber: 13
            }, this),
            !isMinimized && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '12px',
                    background: '#ffffff'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '-0.5rem'
                        },
                        children: uniqueUsers.map((user, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    position: 'relative',
                                    marginLeft: index > 0 ? '-8px' : '0'
                                },
                                title: user.displayName || user.firstName || user.email,
                                children: user.photoURL ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: user.photoURL,
                                    alt: user.firstName || 'User',
                                    style: {
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: '2px solid #ffffff',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ActiveUsers.js",
                                    lineNumber: 128,
                                    columnNumber: 37
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: '2px solid #ffffff',
                                        background: '#4f46e5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    },
                                    children: (user.displayName || user.firstName || user.email || '?')[0].toUpperCase()
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ActiveUsers.js",
                                    lineNumber: 140,
                                    columnNumber: 37
                                }, this)
                            }, `avatar-${user.uid}-${index}`, false, {
                                fileName: "[project]/src/components/ActiveUsers.js",
                                lineNumber: 119,
                                columnNumber: 29
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/ActiveUsers.js",
                        lineNumber: 117,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            marginLeft: '0.5rem'
                        },
                        children: uniqueUsers.map((user, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: '0.75rem',
                                    color: '#101828',
                                    fontWeight: '500'
                                },
                                children: user.displayName || user.firstName || user.email?.split('@')[0]
                            }, `name-${user.uid}-${index}`, false, {
                                fileName: "[project]/src/components/ActiveUsers.js",
                                lineNumber: 167,
                                columnNumber: 29
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/ActiveUsers.js",
                        lineNumber: 160,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ActiveUsers.js",
                lineNumber: 110,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ActiveUsers.js",
        lineNumber: 54,
        columnNumber: 9
    }, this);
}
_s(ActiveUsers, "OtC8+hTE6oyQ3yHuwF1czok0lX8=");
_c = ActiveUsers;
var _c;
__turbopack_context__.k.register(_c, "ActiveUsers");
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
"[project]/src/components/NavBar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NavBar",
    ()=>NavBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function NavBar() {
    _s();
    const { user, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 20,
        y: 20
    });
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragStart, setDragStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [isMinimized, setIsMinimized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleSignOut = async ()=>{
        await signOut();
        router.push('/login');
    };
    const handleMouseDown = (e)=>{
        if (e.target.closest('.drag-handle-navbar')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };
    const handleMouseMove = (e)=>{
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    const handleMouseUp = ()=>{
        setIsDragging(false);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NavBar.useEffect": ()=>{
            if (isDragging) {
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                return ({
                    "NavBar.useEffect": ()=>{
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                    }
                })["NavBar.useEffect"];
            }
        }
    }["NavBar.useEffect"], [
        isDragging,
        dragStart
    ]);
    if (!user) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 1000,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            minWidth: isMinimized ? '150px' : '250px'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "drag-handle-navbar",
                onMouseDown: handleMouseDown,
                style: {
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "👤 Mi Perfil"
                    }, void 0, false, {
                        fileName: "[project]/src/components/NavBar.js",
                        lineNumber: 88,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setIsMinimized(!isMinimized),
                        style: {
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                        },
                        title: isMinimized ? 'Maximizar' : 'Minimizar',
                        children: isMinimized ? '▢' : '−'
                    }, void 0, false, {
                        fileName: "[project]/src/components/NavBar.js",
                        lineNumber: 89,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/NavBar.js",
                lineNumber: 70,
                columnNumber: 13
            }, this),
            !isMinimized && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '12px',
                    background: '#ffffff'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        },
                        children: [
                            user.photoURL && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: user.photoURL,
                                alt: user.firstName || 'User',
                                style: {
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '2px solid #f1f5f9'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/NavBar.js",
                                lineNumber: 125,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: '#101828'
                                        },
                                        children: user.displayName || user.firstName || 'Usuario'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/NavBar.js",
                                        lineNumber: 137,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: '0.75rem',
                                            color: '#667085'
                                        },
                                        children: user.email
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/NavBar.js",
                                        lineNumber: 144,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/NavBar.js",
                                lineNumber: 136,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/NavBar.js",
                        lineNumber: 119,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleSignOut,
                        style: {
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#667085',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            transition: 'all 0.2s',
                            fontWeight: '500'
                        },
                        onMouseOver: (e)=>{
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#ef4444';
                        },
                        onMouseOut: (e)=>{
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#667085';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        },
                        children: "🚪 Cerrar Sesión"
                    }, void 0, false, {
                        fileName: "[project]/src/components/NavBar.js",
                        lineNumber: 152,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/NavBar.js",
                lineNumber: 112,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/NavBar.js",
        lineNumber: 56,
        columnNumber: 9
    }, this);
}
_s(NavBar, "d9zqXvi2AA+dFu4fPz19L8OEFr8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = NavBar;
var _c;
__turbopack_context__.k.register(_c, "NavBar");
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
            // Add current user to active users
            let userDocRef;
            if (user) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDoc"])(activeUsersRef, {
                    uid: user.uid,
                    displayName: user.displayName || user.email,
                    photoURL: user.photoURL,
                    joinedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
                    lastSeen: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
                }).then({
                    "useRealtimeQuotation.useEffect": (docRef)=>{
                        userDocRef = docRef;
                        // Heartbeat to update lastSeen
                        const heartbeat = setInterval({
                            "useRealtimeQuotation.useEffect.heartbeat": ()=>{
                                if (userDocRef) {
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateDoc"])(userDocRef, {
                                        lastSeen: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
                                    }).catch({
                                        "useRealtimeQuotation.useEffect.heartbeat": (err)=>console.error('Heartbeat error:', err)
                                    }["useRealtimeQuotation.useEffect.heartbeat"]);
                                }
                            }
                        }["useRealtimeQuotation.useEffect.heartbeat"], 30000); // Every 30 seconds
                        // Cleanup on unmount
                        return ({
                            "useRealtimeQuotation.useEffect": ()=>{
                                clearInterval(heartbeat);
                                if (userDocRef) {
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteDoc"])(userDocRef).catch({
                                        "useRealtimeQuotation.useEffect": (err)=>console.error('Error removing user:', err)
                                    }["useRealtimeQuotation.useEffect"]);
                                }
                            }
                        })["useRealtimeQuotation.useEffect"];
                    }
                }["useRealtimeQuotation.useEffect"]);
            }
            return ({
                "useRealtimeQuotation.useEffect": ()=>{
                    unsubscribeQuotation();
                    unsubscribeUsers();
                    if (userDocRef) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteDoc"])(userDocRef).catch({
                            "useRealtimeQuotation.useEffect": (err)=>console.error('Error removing user:', err)
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
        activeUsers,
        loading,
        error,
        updateQuotation
    };
}
_s(useRealtimeQuotation, "biUJvUN3N184H5Ot5fUDcJZEGpQ=", false, function() {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ActiveUsers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ActiveUsers.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProtectedRoute$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProtectedRoute.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$NavBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/NavBar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useRealtimeQuotation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useRealtimeQuotation.js [app-client] (ecmascript)");
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
            lineNumber: 15,
            columnNumber: 34
        }, ("TURBOPACK compile-time value", void 0))
});
_c = PDFViewer;
function QuotationEditor() {
    _s();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = params;
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    // Use Firestore realtime hook
    const { quotation, activeUsers: realtimeUsers, loading, error, updateQuotation } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useRealtimeQuotation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRealtimeQuotation"])(id);
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
        ]
    });
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeUsers, setActiveUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [remoteFocus, setRemoteFocus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({}); // { fieldName: userObject }
    const isRemoteUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Update local data when Firestore quotation changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "QuotationEditor.useEffect": ()=>{
            if (quotation) {
                isRemoteUpdate.current = true;
                setData({
                    ...quotation,
                    clientName: quotation.clientName || '',
                    clientRuc: quotation.clientRuc || '',
                    clientAddress: quotation.clientAddress || '',
                    items: quotation.items && quotation.items.length > 0 ? quotation.items : [
                        {
                            description: '',
                            quantity: 1,
                            price: 0
                        }
                    ]
                });
            }
        }
    }["QuotationEditor.useEffect"], [
        quotation
    ]);
    // Update active users from Firestore
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "QuotationEditor.useEffect": ()=>{
            if (realtimeUsers) {
                setActiveUsers(realtimeUsers);
            }
        }
    }["QuotationEditor.useEffect"], [
        realtimeUsers
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
                lineNumber: 92,
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
        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    [field]: value
                });
            } catch (err) {
                console.error('Error updating quotation:', err);
            }
        }
    };
    const handleClientProfileChange = async (clientProfileId)=>{
        const selectedClient = data.clientProfiles?.find((p)=>p.id === parseInt(clientProfileId));
        const newData = {
            ...data,
            clientProfileId: clientProfileId ? parseInt(clientProfileId) : null,
            clientName: selectedClient ? selectedClient.name || '' : '',
            clientRuc: selectedClient ? selectedClient.ruc || '' : '',
            clientAddress: selectedClient ? selectedClient.address || '' : ''
        };
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
        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    items: newItems
                });
            } catch (err) {
                console.error('Error updating items:', err);
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
    const saveQuotation = async ()=>{
        setSaving(true);
        try {
            // Use Firestore updateQuotation instead of API
            if (updateQuotation) {
                await updateQuotation(data);
            }
            setSaving(false);
        } catch (e) {
            console.error(e);
            setSaving(false);
        }
    };
    const total = data.items ? data.items.reduce((acc, item)=>acc + item.quantity * item.price, 0) : 0;
    // Find the selected company profile data
    const selectedCompany = data.companyProfiles?.find((p)=>p.id === data.companyProfileId) || data.companyProfiles?.find((p)=>p.isDefault) || {};
    const dataForPdf = {
        ...data,
        total,
        company: selectedCompany,
        notes: data.notes !== undefined ? data.notes : data.generalConditions?.text || ''
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProtectedRoute$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProtectedRoute"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$NavBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavBar"], {}, void 0, false, {
                fileName: "[project]/src/app/quotations/[id]/page.js",
                lineNumber: 210,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    height: '100vh',
                    overflow: 'hidden'
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
                                        lineNumber: 215,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: '15px',
                                            alignItems: 'center'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ActiveUsers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActiveUsers"], {
                                                users: activeUsers,
                                                currentUser: user
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 217,
                                                columnNumber: 29
                                            }, this),
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
                                                lineNumber: 218,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: '0.8rem',
                                                    color: '#22c55e',
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
                                                            background: '#22c55e'
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                                        lineNumber: 222,
                                                        columnNumber: 33
                                                    }, this),
                                                    "Sincronizado"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 221,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn btn-primary",
                                                onClick: saveQuotation,
                                                disabled: saving,
                                                children: saving ? 'Guardando...' : 'Guardar Cambios'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 225,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 216,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 214,
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
                                        lineNumber: 232,
                                        columnNumber: 25
                                    }, this),
                                    renderRemoteCursorLabel('companyProfileId'),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: data.companyProfileId || '',
                                        onChange: (e)=>handleChange('companyProfileId', parseInt(e.target.value)),
                                        onFocus: ()=>handleFocus('companyProfileId'),
                                        onBlur: ()=>handleBlur('companyProfileId'),
                                        style: getInputStyle('companyProfileId'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Seleccionar Empresa..."
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 241,
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
                                                    lineNumber: 243,
                                                    columnNumber: 33
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 234,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 231,
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
                                        lineNumber: 249,
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
                                                lineNumber: 258,
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
                                                    lineNumber: 260,
                                                    columnNumber: 33
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 251,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 248,
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
                                                    lineNumber: 268,
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
                                                    lineNumber: 270,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 267,
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
                                                    lineNumber: 281,
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
                                                    lineNumber: 283,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 280,
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
                                                    lineNumber: 294,
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
                                                    lineNumber: 296,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 293,
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
                                                    lineNumber: 307,
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
                                                    lineNumber: 309,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/quotations/[id]/page.js",
                                            lineNumber: 306,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                    lineNumber: 266,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 265,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    color: '#1e293b'
                                },
                                children: "Configuración Global de Precios (Interno)"
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 321,
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
                                                        lineNumber: 325,
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
                                                        lineNumber: 327,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 324,
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
                                                        lineNumber: 338,
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
                                                        lineNumber: 340,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 337,
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
                                                lineNumber: 350,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 323,
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
                                        lineNumber: 372,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 322,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    color: '#1e293b'
                                },
                                children: "Ítems"
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 377,
                                columnNumber: 21
                            }, this),
                            data.items && data.items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "card-editor",
                                    style: {
                                        marginBottom: '1rem',
                                        padding: '1.25rem'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                                        lineNumber: 383,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 381,
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
                                                        lineNumber: 394,
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
                                                        lineNumber: 396,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 393,
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
                                                        lineNumber: 407,
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
                                                        lineNumber: 409,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 406,
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
                                                        lineNumber: 429,
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
                                                        lineNumber: 431,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 428,
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
                                                        lineNumber: 451,
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
                                                        lineNumber: 453,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 450,
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
                                                        lineNumber: 473,
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
                                                        lineNumber: 475,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                                lineNumber: 472,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/quotations/[id]/page.js",
                                        lineNumber: 380,
                                        columnNumber: 29
                                    }, this)
                                }, index, false, {
                                    fileName: "[project]/src/app/quotations/[id]/page.js",
                                    lineNumber: 379,
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
                                lineNumber: 488,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    color: '#1e293b'
                                },
                                children: "Notas / Condiciones"
                            }, void 0, false, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 492,
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
                                        lineNumber: 495,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/quotations/[id]/page.js",
                                lineNumber: 493,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/quotations/[id]/page.js",
                        lineNumber: 213,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: '50%',
                            backgroundColor: '#525659',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PDFViewer, {
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
                                lineNumber: 511,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/quotations/[id]/page.js",
                            lineNumber: 510,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/quotations/[id]/page.js",
                        lineNumber: 509,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/quotations/[id]/page.js",
                lineNumber: 211,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/quotations/[id]/page.js",
        lineNumber: 209,
        columnNumber: 9
    }, this);
}
_s(QuotationEditor, "sMpD0EYMhA0wBRfzhj4p309aSHI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useRealtimeQuotation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRealtimeQuotation"]
    ];
});
_c1 = QuotationEditor;
var _c, _c1;
__turbopack_context__.k.register(_c, "PDFViewer");
__turbopack_context__.k.register(_c1, "QuotationEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_d76f2c92._.js.map