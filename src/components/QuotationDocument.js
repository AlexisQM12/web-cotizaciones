import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { numberToSpanishWords } from '@/lib/numberToWords';

// Register fonts if needed (we'll stick to standard ones for now to ensure speed)
// Ideally, we would register a bold font, but Helvetica-Bold is standard.

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40, // More padding for a professional look
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#111',
    },
    // Header Section
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    companyColumn: {
        width: '60%',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    logo: {
        height: 50,
        maxWidth: 150,
        objectFit: 'contain',
        objectPosition: 'left',
        marginBottom: 5,
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#333', // Soften black to dark gray
    },
    companyDetails: {
        fontSize: 8,
        color: '#444',
        marginBottom: 2,
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
    },
    // Quotation Box (Right side)
    quotationBox: {
        width: '40%',
        backgroundColor: '#f3f4f6', // Light gray background
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quotationBoxInner: {
        width: '100%',
        paddingVertical: 15,
        alignItems: 'center',
    },
    rucText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    docTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    docNumber: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Info Strip (Date, Currency)
    infoStrip: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 4,
        marginBottom: 10,
        borderTopWidth: 2,
        borderTopColor: '#007acc', // Blue accent line
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    infoItem: {
        marginRight: 40,
        flexDirection: 'row',
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    // Section Headers (1. CLIENTE, 2. DETALLES...)
    sectionHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#007acc',
        marginBottom: 3,
        marginTop: 6,
        textTransform: 'uppercase',
    },
    // Client Section
    clientContainer: {
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    clientRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    clientLabel: {
        fontWeight: 'bold',
        width: 100,
    },
    // Table
    table: {
        width: '100%',
        marginTop: 5,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    th: {
        fontWeight: 'bold',
        fontSize: 7,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 2, // Even less vertical padding
        paddingHorizontal: 4,
        minHeight: 20, // Lower min height
        alignItems: 'center',
    },
    // Columns (Flexible widths)
    colCode: { width: '8%' },
    colDesc: { width: '62%' }, // Increased width
    // colUnit removed
    colQty: { width: '10%', textAlign: 'center' },
    // colVal removed
    colPrice: { width: '10%', textAlign: 'right' }, // Precio.U
    colTotal: { width: '10%', textAlign: 'right' },

    // Description Cell
    descContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    itemImage: {
        width: 30,
        height: 30,
        marginRight: 5,
        objectFit: 'cover',
        borderRadius: 2,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 8,
        marginBottom: 2,
    },
    itemDescText: {
        fontSize: 7,
        color: '#555',
    },

    // Totals Section
    totalsContainer: {
        marginTop: 10,
        alignSelf: 'flex-end',
        width: '35%',
        paddingTop: 5,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderTopWidth: 1,
        borderTopColor: '#000',
        marginTop: 2,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    totalValue: {
        textAlign: 'right',
    },
    totalAmountText: {
        fontSize: 8,
        marginTop: 5,
        textAlign: 'right',
        fontStyle: 'italic',
        width: '100%',
    },

    // Footer / Notes
    footerContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 10,
    },
    notesText: {
        fontSize: 7,
        lineHeight: 1.4,
        textAlign: 'justify',
        color: '#444',
    },
    paymentContainer: {
        marginTop: 10,
        backgroundColor: '#f9fafb',
        padding: 10,
        borderRadius: 4,
    },
    paymentRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    paymentLabel: {
        fontWeight: 'bold',
        width: 120,
        fontSize: 7,
    },
    paymentVal: {
        fontSize: 7,
    },
});

export const QuotationDocument = ({ data }) => {
    // Destructure properties from data or set defaults
    const {
        clientName = '',
        clientRuc = '',
        clientAddress = '',
        code = '0000',
        items = [],
        company = {},
        date = new Date().toLocaleDateString(),
        currency = 'Soles', // Default currency
        notes = '', // Default notes
        serviceDescription = '', // Default service description
    } = data;

    // Calculate totals
    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price || 0) * parseFloat(item.quantity || 1)), 0);
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

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* 1. Header Section */}
                <View style={styles.headerContainer}>
                    <View style={styles.companyColumn}>
                        {company.logoUrl && (
                            <Image src={company.logoUrl} style={styles.logo} />
                        )}
                        <Text style={styles.companyName}>{company.name || 'MI EMPRESA S.A.C.'}</Text>
                        <View style={{ height: 5 }} />

                        <Text style={styles.companyDetails}>{company.address || 'Av. Principal 123, Lima, Perú'}</Text>
                        <Text style={styles.companyDetails}>RUC: {company.ruc || '20123456789'}</Text>
                        <Text style={styles.companyDetails}>{company.email || 'ventas@miempresa.com'} | {company.phone || '999 888 777'}</Text>
                        <Text style={[styles.companyDetails, styles.link]}>{company.website || 'www.miempresa.com'}</Text>
                    </View>

                    <View style={styles.quotationBox}>
                        <View style={styles.quotationBoxInner}>
                            <Text style={styles.rucText}>RUC {company.ruc || '20000000001'}</Text>
                            <Text style={styles.docTitle}>COTIZACIÓN</Text>
                            <Text style={styles.docNumber}>{code}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Info Strip */}
                <View style={styles.infoStrip}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>FECHA EMISIÓN:</Text>
                        <Text>{date}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>MONEDA:</Text>
                        <Text>{currency}</Text>
                    </View>
                </View>

                {/* 1. Client Section */}
                <Text style={styles.sectionHeader}>1. CLIENTE</Text>
                <View style={styles.clientContainer}>
                    <View style={styles.clientRow}>
                        <Text style={styles.clientLabel}>Razón Social:</Text>
                        <Text style={{ flex: 1 }}>{clientName}</Text>
                    </View>
                    {clientRuc && (
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>RUC:</Text>
                            <Text style={{ flex: 1 }}>{clientRuc}</Text>
                        </View>
                    )}
                    {clientAddress && (
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>Dirección:</Text>
                            <Text style={{ flex: 1 }}>{clientAddress}</Text>
                        </View>
                    )}
                </View>

                {/* 2. Service Description Section */}
                {serviceDescription && (
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.sectionHeader}>2. DESCRIPCIÓN DEL SERVICIO O PRODUCTO</Text>
                        <View style={{ padding: 10, border: '1px solid #eee', borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, lineHeight: 1.4, color: '#444' }}>
                                {serviceDescription}
                            </Text>
                        </View>
                    </View>
                )}

                {/* 3. Details Section (Table) */}
                <Text style={styles.sectionHeader}>3. DETALLES DEL PRESUPUESTO</Text>
                <View style={styles.table}>
                    {/* Header */}
                    {/* Header */}
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colCode]}>ITEM</Text>
                        <Text style={[styles.th, styles.colDesc]}>DESCRIPCIÓN</Text>
                        <Text style={[styles.th, styles.colQty]}>CANT</Text>
                        <Text style={[styles.th, styles.colPrice]}>PRECIO.U</Text>
                        <Text style={[styles.th, styles.colTotal]}>SUBTOTAL</Text>
                    </View>

                    {/* Body */}
                    {items.map((item, index) => {
                        const itemPrice = parseFloat(item.price || 0);
                        const itemQty = parseFloat(item.quantity || 1);
                        const itemSubtotal = itemPrice * itemQty;
                        // Match the form price directly
                        const itemPrecioU = itemPrice;

                        return (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.colCode, { fontSize: 8 }]}>{index + 1}</Text>

                                <View style={styles.colDesc}>
                                    <View style={styles.descContainer}>
                                        {/* Placeholder for item image if we ever implement it in data */}
                                        {item.imageUrl && (
                                            <Image src={item.imageUrl} style={styles.itemImage} />
                                        )}
                                        <View style={styles.itemTextContainer}>
                                            <Text style={styles.itemTitle}>{item.name || item.description}</Text>
                                            {item.details && item.details !== (item.name || item.description) && (
                                                <Text style={styles.itemDescText}>{item.details}</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <Text style={[styles.colQty, { fontSize: 8 }]}>{itemQty.toFixed(2)}</Text>
                                <Text style={[styles.colPrice, { fontSize: 8 }]}>S/ {itemPrecioU.toFixed(2)}</Text>
                                <Text style={[styles.colTotal, { fontSize: 8 }]}>S/ {itemSubtotal.toFixed(2)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* 5. Totals */}
                <View style={styles.totalsContainer}>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { fontSize: 8 }]}>Subtotal</Text>
                        <Text style={[styles.totalValue, { fontSize: 8 }]}>S/ {subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { fontSize: 8 }]}>IGV (18%)</Text>
                        <Text style={[styles.totalValue, { fontSize: 8 }]}>S/ {igv.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRowFinal}>
                        <Text style={[styles.totalLabel, { fontSize: 10 }]}>IMPORTE TOTAL</Text>
                        <Text style={[styles.totalValue, { fontSize: 10, fontWeight: 'bold' }]}>S/ {total.toFixed(2)}</Text>
                    </View>
                </View>
                <Text style={styles.totalAmountText}>
                    Importe en letras: SON {numberToSpanishWords(Math.floor(total))} CON {Math.round((total % 1) * 100)}/100 SOLES
                </Text>

                {/* 6. Notes */}
                <Text style={[styles.sectionHeader, { marginTop: 10 }]}>4. NOTAS</Text>
                <View style={{ borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 5 }}>
                    <Text style={styles.notesText}>{notes}</Text>
                </View>

                {/* 7. Conditions */}
                <Text style={styles.sectionHeader}>5. CONDICIONES DE PAGO</Text>
                <View style={styles.paymentContainer}>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>CUENTAS BANCARIAS:</Text>
                        <View style={{ flex: 1 }}>
                            {/* If dynamic accounts exist, render them. Else fallback to placeholders but usually empty */}
                            {company.accounts && company.accounts.length > 0 ? (
                                company.accounts.map((acc, i) => (
                                    <View key={i} style={{ marginBottom: 4 }}>
                                        <Text style={[styles.paymentVal, { fontWeight: 'bold' }]}>{acc.bankName} - Cuenta Corriente - Soles</Text>
                                        <Text style={styles.paymentVal}>Nº: {acc.accountNumber}</Text>
                                        {acc.cci && <Text style={styles.paymentVal}>CCI: {acc.cci}</Text>}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.paymentVal}>No hay cuentas configuradas.</Text>
                            )}
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
