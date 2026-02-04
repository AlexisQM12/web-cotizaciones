(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/settings/page.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Settings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function Settings() {
    _s();
    const [companyProfiles, setCompanyProfiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [clientProfiles, setClientProfiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [companyFormData, setCompanyFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        address: '',
        email: '',
        phone: '',
        ruc: '',
        website: '',
        accounts: [],
        conditions: '',
        isDefault: false
    });
    // Bank list
    const BANKS = [
        'BCP',
        'BBVA',
        'Interbank',
        'Scotiabank',
        'Banco de la Nación',
        'BanBif',
        'Pichincha',
        'Caja Arequipa',
        'Caja Piura',
        'Otros'
    ];
    const [clientFormData, setClientFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        ruc: '',
        address: '',
        isDefault: false
    });
    const [generalConditions, setGeneralConditions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [logoFile, setLogoFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingCompanyId, setEditingCompanyId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingClientId, setEditingClientId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Settings.useEffect": ()=>{
            fetchCompanyProfiles();
            fetchClientProfiles();
        }
    }["Settings.useEffect"], []);
    const fetchCompanyProfiles = async ()=>{
        try {
            const res = await fetch('/api/company-profiles');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCompanyProfiles(data);
            } else {
                console.error('API Error (Company Profiles):', data.error);
                setCompanyProfiles([]);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };
    const fetchClientProfiles = async ()=>{
        try {
            const res = await fetch('/api/client-profiles');
            const data = await res.json();
            if (Array.isArray(data)) {
                setClientProfiles(data);
            } else {
                console.error('API Error (Client Profiles):', data.error);
                setClientProfiles([]);
            }
        } catch (err) {
            console.error(err);
        }
    };
    const handleCompanySubmit = async (e)=>{
        e.preventDefault();
        try {
            const url = editingCompanyId ? `/api/company-profiles/${editingCompanyId}` : '/api/company-profiles';
            const method = editingCompanyId ? 'PUT' : 'POST';
            const data = new FormData();
            data.append('name', companyFormData.name);
            data.append('address', companyFormData.address);
            data.append('email', companyFormData.email);
            data.append('phone', companyFormData.phone);
            data.append('phone', companyFormData.phone);
            data.append('ruc', companyFormData.ruc);
            data.append('website', companyFormData.website);
            data.append('accounts', JSON.stringify(companyFormData.accounts));
            data.append('conditions', companyFormData.conditions);
            data.append('isDefault', companyFormData.isDefault.toString());
            if (logoFile) {
                data.append('logo', logoFile);
            }
            if (editingCompanyId) {
                data.append('existingLogoUrl', companyFormData.logoUrl || '');
            }
            const res = await fetch(url, {
                method,
                body: data
            });
            if (res.ok) {
                setCompanyFormData({
                    name: '',
                    address: '',
                    email: '',
                    phone: '',
                    ruc: '',
                    website: '',
                    accounts: [],
                    conditions: '',
                    isDefault: false
                });
                setLogoFile(null);
                setEditingCompanyId(null);
                fetchCompanyProfiles();
            }
        } catch (err) {
            console.error(err);
        }
    };
    const handleAddAccount = ()=>{
        setCompanyFormData({
            ...companyFormData,
            accounts: [
                ...companyFormData.accounts,
                {
                    bankName: '',
                    accountNumber: '',
                    cci: ''
                }
            ]
        });
    };
    const handleRemoveAccount = (index)=>{
        const newAccounts = [
            ...companyFormData.accounts
        ];
        newAccounts.splice(index, 1);
        setCompanyFormData({
            ...companyFormData,
            accounts: newAccounts
        });
    };
    const handleAccountChange = (index, field, value)=>{
        const newAccounts = [
            ...companyFormData.accounts
        ];
        newAccounts[index][field] = value;
        setCompanyFormData({
            ...companyFormData,
            accounts: newAccounts
        });
    };
    const handleClientSubmit = async (e)=>{
        e.preventDefault();
        try {
            const url = editingClientId ? `/api/client-profiles/${editingClientId}` : '/api/client-profiles';
            const method = editingClientId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientFormData)
            });
            if (res.ok) {
                setClientFormData({
                    name: '',
                    address: '',
                    email: '',
                    phone: '',
                    isDefault: false
                });
                setEditingClientId(null);
                fetchClientProfiles();
            }
        } catch (err) {
            console.error(err);
        }
    };
    const handleCompanyEdit = (profile)=>{
        setCompanyFormData({
            name: profile.name,
            address: profile.address,
            email: profile.email,
            phone: profile.phone,
            ruc: profile.ruc || '',
            website: profile.website || '',
            accounts: profile.accounts || [],
            conditions: profile.conditions || '',
            logoUrl: profile.logoUrl,
            isDefault: profile.isDefault === 1
        });
        setLogoFile(null); // Reset file input
        setEditingCompanyId(profile.id);
    };
    const handleClientEdit = (profile)=>{
        setClientFormData({
            name: profile.name,
            ruc: profile.ruc,
            address: profile.address,
            isDefault: profile.isDefault === 1
        });
        setEditingClientId(profile.id);
    };
    const handleCompanyDelete = async (id)=>{
        if (confirm('¿Estás seguro de que quieres eliminar este perfil de empresa?')) {
            try {
                await fetch(`/api/company-profiles/${id}`, {
                    method: 'DELETE'
                });
                fetchCompanyProfiles();
            } catch (err) {
                console.error(err);
            }
        }
    };
    const handleClientDelete = async (id)=>{
        if (confirm('¿Estás seguro de que quieres eliminar este perfil de cliente?')) {
            try {
                await fetch(`/api/client-profiles/${id}`, {
                    method: 'DELETE'
                });
                fetchClientProfiles();
            } catch (err) {
                console.error(err);
            }
        }
    };
    const handleCompanyCancel = ()=>{
        setCompanyFormData({
            name: '',
            address: '',
            email: '',
            phone: '',
            ruc: '',
            website: '',
            accounts: [],
            conditions: '',
            isDefault: false
        });
        setLogoFile(null);
        setEditingCompanyId(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "container",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: '2rem'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push('/'),
                        className: "btn",
                        style: {
                            marginBottom: '1rem',
                            background: '#4b5563',
                            color: 'white'
                        },
                        children: "Volver al Dashboard"
                    }, void 0, false, {
                        fileName: "[project]/src/app/settings/page.js",
                        lineNumber: 226,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        style: {
                            color: '#111827'
                        },
                        children: "Configuración de Empresa"
                    }, void 0, false, {
                        fileName: "[project]/src/app/settings/page.js",
                        lineNumber: 229,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: '#475569'
                        },
                        children: "Administra los datos de tu empresa para las cotizaciones."
                    }, void 0, false, {
                        fileName: "[project]/src/app/settings/page.js",
                        lineNumber: 230,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/settings/page.js",
                lineNumber: 225,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "content-frame",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4rem'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    style: {
                                        color: '#101828',
                                        marginBottom: '1.5rem',
                                        fontSize: '1.5rem'
                                    },
                                    children: "Perfiles de Empresa"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/settings/page.js",
                                    lineNumber: 236,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '2.5rem'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    children: editingCompanyId ? 'Editar Perfil de Empresa' : 'Añadir Nuevo Perfil de Empresa'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 239,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                    onSubmit: handleCompanySubmit,
                                                    style: {
                                                        marginTop: '2rem'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "Nombre de Empresa"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 242,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    className: "input",
                                                                    type: "text",
                                                                    required: true,
                                                                    value: companyFormData.name,
                                                                    onChange: (e)=>setCompanyFormData({
                                                                            ...companyFormData,
                                                                            name: e.target.value
                                                                        }),
                                                                    placeholder: "Ej: Mi Empresa S.A."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 243,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 241,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 1fr',
                                                                gap: '1.5rem'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "input-group",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            className: "label",
                                                                            children: "RUC"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 254,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "input",
                                                                            type: "text",
                                                                            value: companyFormData.ruc,
                                                                            onChange: (e)=>setCompanyFormData({
                                                                                    ...companyFormData,
                                                                                    ruc: e.target.value
                                                                                }),
                                                                            placeholder: "20123456789"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 255,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 253,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "input-group",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            className: "label",
                                                                            children: "Sitio Web"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 264,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "input",
                                                                            type: "text",
                                                                            value: companyFormData.website,
                                                                            onChange: (e)=>setCompanyFormData({
                                                                                    ...companyFormData,
                                                                                    website: e.target.value
                                                                                }),
                                                                            placeholder: "www.miempresa.com"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 265,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 263,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 252,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "Cuentas Bancarias"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 275,
                                                                    columnNumber: 41
                                                                }, this),
                                                                companyFormData.accounts.map((acc, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            marginBottom: '1.25rem',
                                                                            padding: '1.75rem',
                                                                            background: '#f8fafc',
                                                                            border: '1px solid #f1f5f9',
                                                                            borderRadius: '20px'
                                                                        },
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    display: 'flex',
                                                                                    gap: '0.75rem',
                                                                                    marginBottom: '0.75rem'
                                                                                },
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                                        className: "input",
                                                                                        value: acc.bankName,
                                                                                        onChange: (e)=>handleAccountChange(index, 'bankName', e.target.value),
                                                                                        style: {
                                                                                            flex: 1
                                                                                        },
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                                value: "",
                                                                                                children: "Seleccionar Banco"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                                lineNumber: 285,
                                                                                                columnNumber: 57
                                                                                            }, this),
                                                                                            BANKS.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                                    value: b,
                                                                                                    children: b
                                                                                                }, b, false, {
                                                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                                                    lineNumber: 286,
                                                                                                    columnNumber: 73
                                                                                                }, this))
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 279,
                                                                                        columnNumber: 53
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        type: "button",
                                                                                        className: "btn btn-danger",
                                                                                        style: {
                                                                                            padding: '0 14px'
                                                                                        },
                                                                                        onClick: ()=>handleRemoveAccount(index),
                                                                                        children: "✕"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 288,
                                                                                        columnNumber: 53
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 278,
                                                                                columnNumber: 49
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    display: 'grid',
                                                                                    gridTemplateColumns: '1fr 1fr',
                                                                                    gap: '0.75rem'
                                                                                },
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        className: "input",
                                                                                        type: "text",
                                                                                        value: acc.accountNumber,
                                                                                        onChange: (e)=>handleAccountChange(index, 'accountNumber', e.target.value),
                                                                                        placeholder: "Nº de Cuenta"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 293,
                                                                                        columnNumber: 53
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        className: "input",
                                                                                        type: "text",
                                                                                        value: acc.cci,
                                                                                        onChange: (e)=>handleAccountChange(index, 'cci', e.target.value),
                                                                                        placeholder: "CCI (Opcional)"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 300,
                                                                                        columnNumber: 53
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 292,
                                                                                columnNumber: 49
                                                                            }, this)
                                                                        ]
                                                                    }, index, true, {
                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                        lineNumber: 277,
                                                                        columnNumber: 45
                                                                    }, this)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    className: "btn btn-secondary",
                                                                    style: {
                                                                        width: '100%',
                                                                        fontSize: '0.9rem'
                                                                    },
                                                                    onClick: handleAddAccount,
                                                                    children: "+ Agregar Cuenta Bancaria"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 310,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 274,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "Dirección"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 315,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    className: "input",
                                                                    type: "text",
                                                                    value: companyFormData.address,
                                                                    onChange: (e)=>setCompanyFormData({
                                                                            ...companyFormData,
                                                                            address: e.target.value
                                                                        }),
                                                                    placeholder: "Calle Falsa 123"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 316,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 314,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 1fr',
                                                                gap: '1.5rem'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "input-group",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            className: "label",
                                                                            children: "Email"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 326,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "input",
                                                                            type: "email",
                                                                            value: companyFormData.email,
                                                                            onChange: (e)=>setCompanyFormData({
                                                                                    ...companyFormData,
                                                                                    email: e.target.value
                                                                                }),
                                                                            placeholder: "contacto@empresa.com"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 327,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 325,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "input-group",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            className: "label",
                                                                            children: "Teléfono"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 336,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "input",
                                                                            type: "text",
                                                                            value: companyFormData.phone,
                                                                            onChange: (e)=>setCompanyFormData({
                                                                                    ...companyFormData,
                                                                                    phone: e.target.value
                                                                                }),
                                                                            placeholder: "+51 987 654 321"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 337,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 335,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 324,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "Logo de Empresa"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 347,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '2rem'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            id: "company-logo-upload",
                                                                            type: "file",
                                                                            accept: "image/*",
                                                                            onChange: (e)=>setLogoFile(e.target.files[0]),
                                                                            style: {
                                                                                display: 'none'
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 349,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            className: "btn btn-secondary",
                                                                            onClick: ()=>document.getElementById('company-logo-upload').click(),
                                                                            children: logoFile ? logoFile.name : 'Seleccionar Archivo'
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 356,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        editingCompanyId && companyFormData.logoUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                            src: companyFormData.logoUrl,
                                                                            alt: "Logo",
                                                                            style: {
                                                                                width: '64px',
                                                                                height: '64px',
                                                                                objectFit: 'contain',
                                                                                borderRadius: '14px',
                                                                                border: '1px solid #f1f5f9'
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/settings/page.js",
                                                                            lineNumber: 364,
                                                                            columnNumber: 49
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 348,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 346,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginBottom: '2.5rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "checkbox",
                                                                    id: "companyIsDefault",
                                                                    style: {
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        cursor: 'pointer'
                                                                    },
                                                                    checked: companyFormData.isDefault,
                                                                    onChange: (e)=>setCompanyFormData({
                                                                            ...companyFormData,
                                                                            isDefault: e.target.checked
                                                                        })
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 369,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    htmlFor: "companyIsDefault",
                                                                    style: {
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500',
                                                                        color: '#64748b'
                                                                    },
                                                                    children: "Establecer como predeterminado"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 376,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 368,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "Condiciones Generales"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 379,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                    className: "input",
                                                                    rows: 5,
                                                                    value: companyFormData.conditions,
                                                                    onChange: (e)=>setCompanyFormData({
                                                                            ...companyFormData,
                                                                            conditions: e.target.value
                                                                        }),
                                                                    placeholder: "Ingrese los términos y condiciones..."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 380,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 378,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                display: 'flex',
                                                                gap: '1.25rem'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "submit",
                                                                    className: "btn btn-primary",
                                                                    style: {
                                                                        flex: 2
                                                                    },
                                                                    children: editingCompanyId ? 'Actualizar Perfil' : 'Guardar Perfil'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 389,
                                                                    columnNumber: 41
                                                                }, this),
                                                                editingCompanyId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    className: "btn btn-secondary",
                                                                    style: {
                                                                        flex: 1
                                                                    },
                                                                    onClick: handleCompanyCancel,
                                                                    children: "Cancelar"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 393,
                                                                    columnNumber: 45
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 388,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 240,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/settings/page.js",
                                            lineNumber: 238,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    style: {
                                                        marginBottom: '1.5rem'
                                                    },
                                                    children: "Perfiles Registrados"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 402,
                                                    columnNumber: 33
                                                }, this),
                                                loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: "Cargando..."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 404,
                                                    columnNumber: 37
                                                }, this) : companyProfiles.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    style: {
                                                        color: '#64748b'
                                                    },
                                                    children: "No hay perfiles configurados."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 406,
                                                    columnNumber: 37
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1.25rem'
                                                    },
                                                    children: companyProfiles.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "card",
                                                            style: {
                                                                padding: '1.75rem',
                                                                border: p.isDefault ? '1px solid #1e293b' : '1px solid #f1f5f9'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'start'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '1.25rem'
                                                                        },
                                                                        children: [
                                                                            p.logoUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                                src: p.logoUrl,
                                                                                alt: "Logo",
                                                                                style: {
                                                                                    width: '48px',
                                                                                    height: '48px',
                                                                                    objectFit: 'contain'
                                                                                }
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 414,
                                                                                columnNumber: 61
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                        style: {
                                                                                            margin: 0,
                                                                                            fontSize: '1.1rem'
                                                                                        },
                                                                                        children: p.name || 'Sin Nombre'
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 417,
                                                                                        columnNumber: 61
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        style: {
                                                                                            fontSize: '0.85rem',
                                                                                            color: '#94a3b8',
                                                                                            marginTop: '4px'
                                                                                        },
                                                                                        children: p.ruc || 'Sin RUC'
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 418,
                                                                                        columnNumber: 61
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 416,
                                                                                columnNumber: 57
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                        lineNumber: 412,
                                                                        columnNumber: 53
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'end',
                                                                            gap: '1rem'
                                                                        },
                                                                        children: [
                                                                            p.isDefault && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "status-badge",
                                                                                style: {
                                                                                    background: '#1e293b',
                                                                                    color: 'white'
                                                                                },
                                                                                children: "Default"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 423,
                                                                                columnNumber: 61
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    display: 'flex',
                                                                                    gap: '0.5rem'
                                                                                },
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        className: "btn btn-secondary",
                                                                                        style: {
                                                                                            fontSize: '0.8rem',
                                                                                            padding: '6px 10px'
                                                                                        },
                                                                                        onClick: ()=>handleCompanyEdit(p),
                                                                                        children: "Editar"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 428,
                                                                                        columnNumber: 61
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        className: "btn btn-danger",
                                                                                        style: {
                                                                                            fontSize: '0.8rem',
                                                                                            padding: '6px 10px'
                                                                                        },
                                                                                        onClick: ()=>handleCompanyDelete(p.id),
                                                                                        children: "Borrar"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 431,
                                                                                        columnNumber: 61
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 427,
                                                                                columnNumber: 57
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                        lineNumber: 421,
                                                                        columnNumber: 53
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/settings/page.js",
                                                                lineNumber: 411,
                                                                columnNumber: 49
                                                            }, this)
                                                        }, p.id, false, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 410,
                                                            columnNumber: 45
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 408,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/settings/page.js",
                                            lineNumber: 401,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/settings/page.js",
                                    lineNumber: 237,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/settings/page.js",
                            lineNumber: 235,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '4rem'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    style: {
                                        color: '#101828',
                                        marginBottom: '1.5rem',
                                        fontSize: '1.5rem'
                                    },
                                    children: "Perfiles de Cliente"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/settings/page.js",
                                    lineNumber: 446,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '2.5rem'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    children: editingClientId ? 'Editar Perfil de Cliente' : 'Añadir Nuevo Cliente'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 449,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                    onSubmit: handleClientSubmit,
                                                    style: {
                                                        marginTop: '2rem'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "Nombre de Cliente"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 452,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    className: "input",
                                                                    type: "text",
                                                                    required: true,
                                                                    value: clientFormData.name,
                                                                    onChange: (e)=>setClientFormData({
                                                                            ...clientFormData,
                                                                            name: e.target.value
                                                                        }),
                                                                    placeholder: "Ej: Juan Pérez"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 453,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 451,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "RUC / DNI"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 463,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    className: "input",
                                                                    type: "text",
                                                                    value: clientFormData.ruc,
                                                                    onChange: (e)=>setClientFormData({
                                                                            ...clientFormData,
                                                                            ruc: e.target.value
                                                                        }),
                                                                    placeholder: "12345678901"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 464,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 462,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "input-group",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "label",
                                                                    children: "Dirección"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 473,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    className: "input",
                                                                    type: "text",
                                                                    value: clientFormData.address,
                                                                    onChange: (e)=>setClientFormData({
                                                                            ...clientFormData,
                                                                            address: e.target.value
                                                                        }),
                                                                    placeholder: "Calle Falsa 123"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 474,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 472,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginBottom: '2.5rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "checkbox",
                                                                    id: "clientIsDefault",
                                                                    style: {
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        cursor: 'pointer'
                                                                    },
                                                                    checked: clientFormData.isDefault,
                                                                    onChange: (e)=>setClientFormData({
                                                                            ...clientFormData,
                                                                            isDefault: e.target.checked
                                                                        })
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 483,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    htmlFor: "clientIsDefault",
                                                                    style: {
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500',
                                                                        color: '#64748b'
                                                                    },
                                                                    children: "Establecer como predeterminado"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 490,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 482,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                display: 'flex',
                                                                gap: '1.25rem'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "submit",
                                                                    className: "btn btn-primary",
                                                                    style: {
                                                                        flex: 2
                                                                    },
                                                                    children: editingClientId ? 'Actualizar Perfil' : 'Guardar Perfil'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 493,
                                                                    columnNumber: 41
                                                                }, this),
                                                                editingClientId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    className: "btn btn-secondary",
                                                                    style: {
                                                                        flex: 1
                                                                    },
                                                                    onClick: ()=>setEditingClientId(null),
                                                                    children: "Cancelar"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/settings/page.js",
                                                                    lineNumber: 497,
                                                                    columnNumber: 45
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 492,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 450,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/settings/page.js",
                                            lineNumber: 448,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    style: {
                                                        marginBottom: '1.5rem'
                                                    },
                                                    children: "Clientes Registrados"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 506,
                                                    columnNumber: 33
                                                }, this),
                                                clientProfiles.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    style: {
                                                        color: '#64748b'
                                                    },
                                                    children: "No hay perfiles configurados."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 508,
                                                    columnNumber: 37
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1.25rem'
                                                    },
                                                    children: clientProfiles.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "card",
                                                            style: {
                                                                padding: '1.75rem',
                                                                border: p.isDefault ? '1px solid #1e293b' : '1px solid #f1f5f9'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'start'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                style: {
                                                                                    margin: 0,
                                                                                    fontSize: '1.1rem'
                                                                                },
                                                                                children: p.name || 'Sin Nombre'
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 515,
                                                                                columnNumber: 57
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                style: {
                                                                                    fontSize: '0.85rem',
                                                                                    color: '#94a3b8',
                                                                                    marginTop: '4px'
                                                                                },
                                                                                children: p.address || 'Sin Dirección'
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 516,
                                                                                columnNumber: 57
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                        lineNumber: 514,
                                                                        columnNumber: 53
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'end',
                                                                            gap: '1rem'
                                                                        },
                                                                        children: [
                                                                            p.isDefault && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "status-badge",
                                                                                style: {
                                                                                    background: '#1e293b',
                                                                                    color: 'white'
                                                                                },
                                                                                children: "Default"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 520,
                                                                                columnNumber: 61
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    display: 'flex',
                                                                                    gap: '0.5rem'
                                                                                },
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        className: "btn btn-secondary",
                                                                                        style: {
                                                                                            fontSize: '0.8rem',
                                                                                            padding: '6px 10px'
                                                                                        },
                                                                                        onClick: ()=>handleClientEdit(p),
                                                                                        children: "Editar"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 525,
                                                                                        columnNumber: 61
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        className: "btn btn-danger",
                                                                                        style: {
                                                                                            fontSize: '0.8rem',
                                                                                            padding: '6px 10px'
                                                                                        },
                                                                                        onClick: ()=>handleClientDelete(p.id),
                                                                                        children: "Borrar"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                                        lineNumber: 528,
                                                                                        columnNumber: 61
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/app/settings/page.js",
                                                                                lineNumber: 524,
                                                                                columnNumber: 57
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/settings/page.js",
                                                                        lineNumber: 518,
                                                                        columnNumber: 53
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/settings/page.js",
                                                                lineNumber: 513,
                                                                columnNumber: 49
                                                            }, this)
                                                        }, p.id, false, {
                                                            fileName: "[project]/src/app/settings/page.js",
                                                            lineNumber: 512,
                                                            columnNumber: 45
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/settings/page.js",
                                                    lineNumber: 510,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/settings/page.js",
                                            lineNumber: 505,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/settings/page.js",
                                    lineNumber: 447,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/settings/page.js",
                            lineNumber: 445,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/settings/page.js",
                    lineNumber: 234,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/settings/page.js",
                lineNumber: 233,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/settings/page.js",
        lineNumber: 224,
        columnNumber: 9
    }, this);
}
_s(Settings, "mw2SE5S/e8vNFmjC7Hg5tTcfClE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Settings;
var _c;
__turbopack_context__.k.register(_c, "Settings");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_settings_page_c69e0f94.js.map