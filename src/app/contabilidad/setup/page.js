'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import { authFetch } from '@/lib/authFetch';
import Icon from '@/components/icons/Icon';
import { COMPANY_TYPES, TAX_REGIMES, getAllowedRegimes, getRequiredBooks } from '@/lib/accounting/sunatRules';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { useAuth } from '@/contexts/AuthContext';

export default function SetupPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const { config, exists, companyProfileId, error: cfgError, reload } = useAccountingConfig(selectedProfileId);
    const [profiles, setProfiles]   = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        companyType: '',
        taxRegime: '',
        ruc: '',
        razonSocial: '',
        direccionFiscal: '',
        fechaInicioActividades: '',
        esBuenContribuyente: false,
        tieneTrabajadores: false,
        ingresosAnualesProyectados: '',
        coeficienteRenta: '0.015',
        clientId: '',
        clientSecret: '',
        solUser: '',
        solPass: ''
    });
    const [saving, setSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);

    useEffect(() => {
        if (!user?.empresaId) return;
        (async () => {
            try {
                const r = await fetch(`/api/company-profiles?empresaId=${user.empresaId}`);
                const data = await r.json();
                setProfiles(Array.isArray(data) ? data : []);
            } catch {} finally { setLoadingProfiles(false); }
        })();
    }, [user?.empresaId]);

    // Pre-cargar valores existentes o desde el perfil de empresa
    useEffect(() => {
        if (exists && config) {
            setForm({
                companyType: config.companyType || '',
                taxRegime: config.taxRegime || '',
                ruc: config.ruc || '',
                razonSocial: config.razonSocial || '',
                direccionFiscal: config.direccionFiscal || '',
                fechaInicioActividades: config.fechaInicioActividades || '',
                esBuenContribuyente: !!config.esBuenContribuyente,
                tieneTrabajadores: !!config.tieneTrabajadores,
                ingresosAnualesProyectados: config.ingresosAnualesProyectados || '',
                coeficienteRenta: config.coeficienteRenta || '0.015',
                // El servidor ya no devuelve las credenciales. Vacío = conservar
                // las que ya están guardadas (ver PUT en api/accounting/config).
                clientId: '',
                clientSecret: '',
                solUser: '',
                solPass: ''
            });
        } else if (companyProfileId) {
            const profile = profiles.find(p => p.id === companyProfileId);
            if (profile) {
                setForm(f => ({
                    ...f,
                    ruc: f.ruc || profile.ruc || '',
                    razonSocial: f.razonSocial || profile.name || '',
                    direccionFiscal: f.direccionFiscal || profile.address || '',
                }));
            }
        }
    }, [exists, config, companyProfileId, profiles]);

    useEffect(() => {
        if (!form.companyType) return;
        const allowed = COMPANY_TYPES[form.companyType]?.allowedRegimes || [];
        if (form.taxRegime && !allowed.includes(form.taxRegime)) {
            setForm((f) => ({ ...f, taxRegime: '' }));
        }
    }, [form.companyType, form.taxRegime]);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const allowedRegimes = form.companyType ? getAllowedRegimes(form.companyType) : [];
    const selectedRegime = form.taxRegime ? TAX_REGIMES[form.taxRegime] : null;
    const previewBooks   = form.taxRegime
        ? getRequiredBooks(form.taxRegime, parseFloat(form.ingresosAnualesProyectados) || 0)
        : [];

    const canContinue1 = !!form.companyType;
    const canContinue2 = !!form.taxRegime;
    const canSave = canContinue1 && canContinue2
        && /^\d{11}$/.test(form.ruc)
        && form.razonSocial.trim().length > 0;

    const [searchingRuc, setSearchingRuc] = useState(false);
    const [sunatStatus, setSunatStatus] = useState(null);

    const searchRuc = async () => {
        if (!/^\d{11}$/.test(form.ruc)) {
            alert('Por favor, ingresa un RUC válido de 11 dígitos.');
            return;
        }
        setSearchingRuc(true);
        setSunatStatus(null);
        try {
            const res = await fetch(`/api/sunat/ruc?ruc=${form.ruc}`);
            if (res.ok) {
                const data = await res.json();
                const rs = data.razonSocial || data.nombre || '';
                
                let detectedType = form.companyType;
                if (form.ruc.startsWith('10')) detectedType = 'NATURAL';
                else if (/\bS\.?A\.?C\.?\b/i.test(rs)) detectedType = 'SAC';
                else if (/\bE\.?I\.?R\.?L\.?\b/i.test(rs)) detectedType = 'EIRL';
                else if (/\bS\.?R\.?L\.?\b/i.test(rs)) detectedType = 'SRL';
                else if (/\bS\.?A\.?\b/i.test(rs)) detectedType = 'SA';

                setForm(f => ({
                    ...f,
                    razonSocial: rs || f.razonSocial,
                    direccionFiscal: data.direccion || f.direccionFiscal,
                    companyType: detectedType || f.companyType
                }));

                if (data.estado || data.condicion) {
                    setSunatStatus({
                        estado: data.estado,
                        condicion: data.condicion
                    });
                    if (data.estado !== 'ACTIVO' || data.condicion !== 'HABIDO') {
                        alert(`¡Atención! Según SUNAT, el estado es ${data.estado} y la condición es ${data.condicion}.`);
                    }
                }
            } else {
                alert('No se pudo encontrar el RUC en SUNAT o hay un error de conexión.');
            }
        } catch (error) {
            console.error(error);
            alert('Error interno al conectar con SUNAT.');
        } finally {
            setSearchingRuc(false);
        }
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const resolvedId = companyProfileId || user?.empresaId;
            const r = await authFetch('/api/accounting/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, companyProfileId: resolvedId, empresaId: resolvedId }),
            });
            if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                alert(data.error || 'Error al guardar');
                return;
            }
            setSavedOk(true);
            await reload();
            setTimeout(() => router.push('/contabilidad'), 1000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AccountingShell requireSetup={false}>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="settings" size={26} />
                        Configuración del Centro Contable
                    </h1>
                    <p className="acc-page-subtitle">
                        Antes de calcular impuestos y generar libros, definimos el tipo de empresa y el régimen tributario vigente en SUNAT.
                    </p>
                </div>
            </div>

            {!loadingProfiles && profiles.length === 0 && (
                <div className="acc-alert acc-alert-warn">
                    <Icon name="alert" size={16} />
                    <span>No tienes ningún perfil de empresa creado. Ve a <a href="/settings" style={{ color: '#92400e', textDecoration: 'underline', fontWeight: 600 }}>Configuración de Cotizaciones</a> y crea al menos uno antes de continuar.</span>
                </div>
            )}

            {!loadingProfiles && profiles.length > 0 && (
                <div className="acc-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <Icon name="building" size={18} />
                    </div>
                    <div>
                        <div className="acc-kpi-label">Configurando empresa</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                            {profiles.find(p => p.id === companyProfileId)?.name || 'Sin seleccionar'}
                        </div>
                    </div>
                    {profiles.length > 1 && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label className="acc-kpi-label">Cambiar a:</label>
                            <select className="acc-select" style={{ width: 260 }}
                                    value={selectedProfileId || companyProfileId || ''}
                                    onChange={e => setSelectedProfileId(e.target.value)}>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}{p.isDefault ? ' (predeterminada)' : ''}{p.ruc ? ` · RUC ${p.ruc}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {cfgError && (
                <div className="acc-alert acc-alert-warn">
                    <Icon name="alert" size={16} />
                    <span>{cfgError}</span>
                </div>
            )}

            <div className="setup-wizard">
                <div className="setup-steps">
                    <Step n={1} label="Tipo de empresa" active={step === 1} done={step > 1} />
                    <StepDivider />
                    <Step n={2} label="Régimen tributario" active={step === 2} done={step > 2} />
                    <StepDivider />
                    <Step n={3} label="Datos fiscales" active={step === 3} done={step > 3} />
                    <StepDivider />
                    <Step n={4} label="Confirmar" active={step === 4} done={false} />
                </div>

                {step === 1 && (
                    <div className="acc-card">
                        <h2 className="acc-section-title">¿Qué tipo de empresa es?</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                            Cada tipo de empresa tiene reglas y regímenes tributarios distintos.
                        </p>
                        <div className="opt-grid">
                            {Object.values(COMPANY_TYPES).map((t) => (
                                <div
                                    key={t.code}
                                    onClick={() => update('companyType', t.code)}
                                    className={`opt-card ${form.companyType === t.code ? 'selected' : ''}`}
                                >
                                    <div className="opt-icon"><Icon name="building" size={18} /></div>
                                    <div className="opt-title">{t.code}</div>
                                    <div className="opt-name">{t.name}</div>
                                    <div className="opt-desc">{t.description}</div>
                                    <div className="opt-meta">
                                        Regímenes: {t.allowedRegimes.join(' · ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <WizardButtons onBack={null} onNext={() => setStep(2)} disabledNext={!canContinue1} />
                    </div>
                )}

                {step === 2 && (
                    <div className="acc-card">
                        <h2 className="acc-section-title">¿En qué régimen tributario está acogida?</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                            Si no estás seguro, revisa tu Ficha RUC en SUNAT — figura como "Régimen".
                        </p>
                        <div className="opt-grid">
                            {allowedRegimes.map((r) => (
                                <div
                                    key={r.code}
                                    onClick={() => update('taxRegime', r.code)}
                                    className={`opt-card ${form.taxRegime === r.code ? 'selected' : ''}`}
                                >
                                    <div className="opt-icon"><Icon name="receipt" size={18} /></div>
                                    <div className="opt-title">{r.code}</div>
                                    <div className="opt-name">{r.name}</div>
                                    <div className="opt-desc">{r.description}</div>
                                    <div className="opt-meta">
                                        {r.maxAnnualIncome
                                            ? `Tope: S/ ${r.maxAnnualIncome.toLocaleString()}/año`
                                            : r.maxAnnualIncomeUIT
                                                ? `Tope: ${r.maxAnnualIncomeUIT} UIT/año`
                                                : 'Sin límite de ingresos'}
                                        {' · '}
                                        IGV: {r.issuesIGV ? '18%' : 'No aplica'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <WizardButtons onBack={() => setStep(1)} onNext={() => setStep(3)} disabledNext={!canContinue2} />
                    </div>
                )}

                {step === 3 && (
                    <div className="acc-card">
                        <h2 className="acc-section-title">Datos fiscales</h2>
                        <div className="form-grid">
                            <Field label="RUC (11 dígitos)" required>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input className="acc-input" value={form.ruc}
                                        style={{ flex: 1 }}
                                        onChange={(e) => update('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        placeholder="20XXXXXXXXX" />
                                    <button 
                                        onClick={searchRuc}
                                        disabled={searchingRuc || form.ruc.length !== 11}
                                        className="btn btn-secondary" 
                                        style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #cbd5e1' }}
                                        title="Buscar en SUNAT"
                                    >
                                        <Icon name="search" size={16} />
                                        <span>{searchingRuc ? 'Buscando...' : 'SUNAT'}</span>
                                    </button>
                                </div>
                                {sunatStatus && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '1rem' }}>
                                        <span style={{ color: sunatStatus.estado === 'ACTIVO' ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                                            Estado: {sunatStatus.estado}
                                        </span>
                                        <span style={{ color: sunatStatus.condicion === 'HABIDO' ? '#16a34a' : '#eab308', fontWeight: 600 }}>
                                            Condición: {sunatStatus.condicion}
                                        </span>
                                    </div>
                                )}
                            </Field>
                            <Field label="Razón social" required>
                                <input className="acc-input" value={form.razonSocial}
                                    onChange={(e) => update('razonSocial', e.target.value)} />
                            </Field>
                            <Field label="Dirección fiscal" full>
                                <input className="acc-input" value={form.direccionFiscal}
                                    onChange={(e) => update('direccionFiscal', e.target.value)} />
                            </Field>
                            <Field label="Fecha inicio actividades">
                                <input type="date" className="acc-input" value={form.fechaInicioActividades || ''}
                                    onChange={(e) => update('fechaInicioActividades', e.target.value)} />
                            </Field>
                            <Field label="Ingresos anuales proyectados (S/)">
                                <input type="number" className="acc-input" value={form.ingresosAnualesProyectados}
                                    onChange={(e) => update('ingresosAnualesProyectados', e.target.value)} />
                            </Field>
                            {(form.taxRegime === 'RMT' || form.taxRegime === 'GENERAL') && (
                                <Field label="Coeficiente Renta (ejercicio anterior)">
                                    <input type="number" step="0.0001" className="acc-input" value={form.coeficienteRenta}
                                        onChange={(e) => update('coeficienteRenta', e.target.value)} />
                                </Field>
                            )}
                            <div className="form-checkbox-row">
                                <label className="acc-check-row">
                                    <input type="checkbox" checked={form.esBuenContribuyente}
                                        onChange={(e) => update('esBuenContribuyente', e.target.checked)} />
                                    Soy Buen Contribuyente (cronograma especial)
                                </label>
                                <label className="acc-check-row">
                                    <input type="checkbox" checked={form.tieneTrabajadores}
                                        onChange={(e) => update('tieneTrabajadores', e.target.checked)} />
                                    Tengo trabajadores (activa PLAME en el futuro)
                                </label>
                            </div>
                        </div>

                        <hr style={{ margin: '2rem 0', borderColor: '#e2e8f0' }} />
                        <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icon name="shield-check" size={20} />
                            Credenciales Oficiales SUNAT (SIRE / Facturación)
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Para conectar la contabilidad directamente con SUNAT y extraer las propuestas del SIRE, necesitas generar tus credenciales OAuth en el portal SOL. Si no las tienes ahora, puedes dejarlas en blanco y el sistema usará el simulador.
                        </p>
                        {config?.tieneCredencialesSunat && (
                            <div className="acc-alert acc-alert-info" style={{ marginBottom: '1.5rem' }}>
                                <Icon name="shield-check" size={16} />
                                <span>
                                    Ya hay credenciales SUNAT guardadas. Por seguridad no se muestran:
                                    el servidor nunca las devuelve al navegador. <strong>Deja los campos en
                                    blanco para conservarlas</strong> y complétalos sólo si quieres reemplazarlas.
                                </span>
                            </div>
                        )}
                        <div className="form-grid">
                            <Field label="Usuario SOL">
                                <input className="acc-input" value={form.solUser} onChange={(e) => update('solUser', e.target.value)} placeholder={config?.tieneCredencialesSunat ? "(guardado — escribe para reemplazar)" : "Ej. JPEREZ12"} />
                            </Field>
                            <Field label="Clave SOL">
                                <input type="password" className="acc-input" value={form.solPass} onChange={(e) => update('solPass', e.target.value)} placeholder={config?.tieneCredencialesSunat ? "(guardada — escribe para reemplazar)" : "••••••••"} />
                            </Field>
                            <Field label="Client ID (ID de Cliente SUNAT)">
                                <input className="acc-input" value={form.clientId} onChange={(e) => update('clientId', e.target.value)} placeholder={config?.tieneCredencialesSunat ? "(guardado — escribe para reemplazar)" : "00000000-0000-0000-0000-000000000000"} />
                            </Field>
                            <Field label="Client Secret (Clave Secreta SUNAT)">
                                <input type="password" className="acc-input" value={form.clientSecret} onChange={(e) => update('clientSecret', e.target.value)} placeholder={config?.tieneCredencialesSunat ? "(guardado — escribe para reemplazar)" : "••••••••"} />
                            </Field>
                        </div>

                        <WizardButtons onBack={() => setStep(2)} onNext={() => setStep(4)}
                            disabledNext={!/^\d{11}$/.test(form.ruc) || !form.razonSocial.trim()} />
                    </div>
                )}

                {step === 4 && (
                    <div className="acc-card">
                        <h2 className="acc-section-title">Revisar y confirmar</h2>
                        <div className="summary-grid">
                            <SummaryRow label="Tipo de empresa" value={`${form.companyType} — ${COMPANY_TYPES[form.companyType]?.name}`} />
                            <SummaryRow label="Régimen" value={`${form.taxRegime} — ${selectedRegime?.name}`} />
                            <SummaryRow label="RUC" value={form.ruc} />
                            <SummaryRow label="Razón social" value={form.razonSocial} />
                            <SummaryRow label="Dirección fiscal" value={form.direccionFiscal || '—'} />
                            <SummaryRow label="Buen Contribuyente" value={form.esBuenContribuyente ? 'Sí' : 'No'} />
                            <SummaryRow label="Tiene trabajadores" value={form.tieneTrabajadores ? 'Sí' : 'No'} />
                        </div>

                        <div className="acc-card-sm" style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                <Icon name="book" size={16} />
                                <strong style={{ fontSize: '0.9rem' }}>Libros obligatorios para este régimen</strong>
                            </div>
                            {previewBooks.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Ningún libro contable obligatorio (NRUS).</p>
                            ) : (
                                <ul style={{ paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
                                    {previewBooks.map((b) => <li key={b}>{b.replace(/_/g, ' ')}</li>)}
                                </ul>
                            )}
                        </div>

                        {selectedRegime?.requiresMonthlyDeclaration && (
                            <div className="acc-alert acc-alert-info" style={{ marginTop: '1rem', marginBottom: 0 }}>
                                <Icon name="info" size={16} />
                                <span>
                                    Este régimen requiere declaración mensual mediante <strong>Formulario Virtual 621</strong>.
                                    {selectedRegime.requiresAnnualDeclaration && ' Además requiere DJ Anual de Renta.'}
                                </span>
                            </div>
                        )}

                        <WizardButtons
                            onBack={() => setStep(3)}
                            onNext={handleSave}
                            nextLabel={saving ? 'Guardando...' : (savedOk ? 'Guardado' : 'Guardar configuración')}
                            nextIcon={savedOk ? 'check' : null}
                            disabledNext={saving || !canSave}
                        />
                    </div>
                )}
            </div>

            <style jsx>{`
                .setup-wizard { display: flex; flex-direction: column; gap: 1.5rem; max-width: 920px; }
                .setup-steps {
                    display: flex; align-items: center; gap: 0.5rem;
                    padding: 1rem 1.25rem;
                    background: #fff; border-radius: 16px; border: 1px solid var(--border);
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.1rem;
                }
                .form-grid .full { grid-column: span 2; }
                .form-checkbox-row {
                    grid-column: span 2;
                    display: flex; gap: 1.5rem; flex-wrap: wrap;
                    padding-top: 0.5rem;
                }
                .opt-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (max-width: 700px) {
                    .form-grid, .opt-grid { grid-template-columns: 1fr; }
                    .form-grid .full, .form-checkbox-row { grid-column: 1; }
                }
                .opt-card {
                    padding: 1.25rem;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    cursor: pointer;
                    background: #fff;
                    transition: all 0.2s;
                    display: flex; flex-direction: column; gap: 0.4rem;
                }
                .opt-card:hover { border-color: #cbd5e1; transform: translateY(-1px); }
                .opt-card.selected {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.08);
                }
                .opt-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: #f1f5f9; color: var(--primary);
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 0.25rem;
                }
                .opt-card.selected .opt-icon { background: var(--primary); color: #fff; }
                .opt-title { font-size: 0.8rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
                .opt-name { font-weight: 700; color: var(--text-main); font-size: 0.95rem; }
                .opt-desc { color: #475569; font-size: 0.85rem; line-height: 1.4; }
                .opt-meta { color: #94a3b8; font-size: 0.75rem; margin-top: 0.2rem; }
                .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem 1.5rem; }
                @media (max-width: 600px) { .summary-grid { grid-template-columns: 1fr; gap: 0.4rem; } }
            `}</style>
        </AccountingShell>
    );
}

function Step({ n, label, active, done }) {
    return (
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', opacity: active || done ? 1 : 0.5 }}>
            <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: done ? 'var(--primary)' : active ? 'var(--primary)' : '#e2e8f0',
                color: done || active ? 'white' : '#64748b',
                fontSize: '0.85rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {done ? <Icon name="check" size={14} strokeWidth={3} /> : n}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500, color: 'var(--text-main)' }}>{label}</div>
        </div>
    );
}

function StepDivider() {
    return <div style={{ flex: 1, height: 1, background: '#e2e8f0', minWidth: 20 }} />;
}

function Field({ label, children, required, full }) {
    return (
        <div className={`acc-field ${full ? 'full' : ''}`}>
            <label className="acc-field-label">
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {children}
        </div>
    );
}

function WizardButtons({ onBack, onNext, nextLabel = 'Siguiente', nextIcon, disabledNext }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.75rem' }}>
            {onBack ? (
                <button className="btn btn-secondary" onClick={onBack}>
                    <Icon name="arrow-left" size={16} /> <span style={{ marginLeft: '0.4rem' }}>Atrás</span>
                </button>
            ) : <span />}
            <button className="btn btn-primary" onClick={onNext} disabled={disabledNext}
                    style={{ opacity: disabledNext ? 0.5 : 1, cursor: disabledNext ? 'not-allowed' : 'pointer' }}>
                <span style={{ marginRight: '0.4rem' }}>{nextLabel}</span>
                <Icon name={nextIcon || 'arrow-right'} size={16} />
            </button>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <>
            <div className="acc-kpi-label">{label}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{value}</div>
        </>
    );
}
