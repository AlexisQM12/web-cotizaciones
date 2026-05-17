'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/icons/Icon';
import { COMPANY_TYPES, TAX_REGIMES, getAllowedRegimes, getRequiredBooks } from '@/lib/accounting/sunatRules';

export default function OnboardingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
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
    });
    const [logoFile, setLogoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [error, setError] = useState(null);

    // If user already has an empresaId, they shouldn't be here
    useEffect(() => {
        if (!authLoading && user?.empresaId) {
            router.replace('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!form.companyType) return;
        const allowed = COMPANY_TYPES[form.companyType]?.allowedRegimes || [];
        if (form.taxRegime && !allowed.includes(form.taxRegime)) {
            setForm((f) => ({ ...f, taxRegime: '' }));
        }
    }, [form.companyType, form.taxRegime]);

    if (authLoading || (user && user.empresaId)) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Cargando...</div>;
    }

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const allowedRegimes = form.companyType ? getAllowedRegimes(form.companyType) : [];
    const selectedRegime = form.taxRegime ? TAX_REGIMES[form.taxRegime] : null;
    const previewBooks = form.taxRegime
        ? getRequiredBooks(form.taxRegime, parseFloat(form.ingresosAnualesProyectados) || 0)
        : [];

    const canContinue1 = !!form.companyType;
    const canContinue2 = !!form.taxRegime;
    const canSave = canContinue1 && canContinue2
        && /^\d{11}$/.test(form.ruc)
        && form.razonSocial.trim().length > 0;

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        setError(null);
        
        try {
            const formData = new FormData();
            formData.append('userId', user.uid);
            
            Object.keys(form).forEach(key => {
                formData.append(key, form[key]);
            });
            
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const r = await fetch('/api/onboarding', {
                method: 'POST',
                body: formData, // Sending as FormData because of the logo
            });
            
            const data = await r.json();
            
            if (!r.ok) {
                setError(data.error || 'Error al guardar');
                setSaving(false);
                return;
            }
            
            setSavedOk(true);
            // Force a hard reload so the AuthContext fetches the updated user document with empresaId
            setTimeout(() => window.location.href = '/', 1500);
        } catch (e) {
            setError(e.message);
            setSaving(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '3rem 1rem' }}>
            <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '0.5rem' }}>Configura tu Empresa</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>¡Bienvenido! Para empezar a usar el sistema, necesitamos algunos datos.</p>
                    </div>

                    {error && (
                        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: 12, display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Icon name="alert" size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="setup-steps">
                        <Step n={1} label="Tipo" active={step === 1} done={step > 1} />
                        <StepDivider />
                        <Step n={2} label="Régimen" active={step === 2} done={step > 2} />
                        <StepDivider />
                        <Step n={3} label="Datos" active={step === 3} done={step > 3} />
                        <StepDivider />
                        <Step n={4} label="Confirmar" active={step === 4} done={false} />
                    </div>

                    {step === 1 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#1e293b' }}>¿Qué tipo de empresa es?</h2>
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
                                        <div className="opt-meta">Regímenes: {t.allowedRegimes.join(' · ')}</div>
                                    </div>
                                ))}
                            </div>
                            <WizardButtons onBack={null} onNext={() => setStep(2)} disabledNext={!canContinue1} />
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#1e293b' }}>¿En qué régimen tributario está acogida?</h2>
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
                                    </div>
                                ))}
                            </div>
                            <WizardButtons onBack={() => setStep(1)} onNext={() => setStep(3)} disabledNext={!canContinue2} />
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#1e293b' }}>Datos de la empresa</h2>
                            <div className="form-grid">
                                <div className="full" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ 
                                        width: 80, height: 80, borderRadius: 16, background: '#f1f5f9', border: '2px dashed #cbd5e1',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                    }}>
                                        {logoFile ? (
                                            <img src={URL.createObjectURL(logoFile)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <Icon name="image" size={32} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Logo de la Empresa (Opcional)</label>
                                        <button className="btn btn-secondary" onClick={() => document.getElementById('logo-upload').click()}>
                                            Seleccionar Imagen
                                        </button>
                                        <input 
                                            id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }}
                                            onChange={(e) => setLogoFile(e.target.files[0])}
                                        />
                                    </div>
                                </div>

                                <Field label="RUC (11 dígitos)" required>
                                    <input className="input" value={form.ruc}
                                        onChange={(e) => update('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        placeholder="20XXXXXXXXX" />
                                </Field>
                                <Field label="Razón social" required>
                                    <input className="input" value={form.razonSocial}
                                        onChange={(e) => update('razonSocial', e.target.value)} />
                                </Field>
                                <Field label="Dirección fiscal" full>
                                    <input className="input" value={form.direccionFiscal}
                                        onChange={(e) => update('direccionFiscal', e.target.value)} />
                                </Field>
                                <Field label="Fecha inicio actividades">
                                    <input type="date" className="input" value={form.fechaInicioActividades || ''}
                                        onChange={(e) => update('fechaInicioActividades', e.target.value)} />
                                </Field>
                                <Field label="Ingresos anuales (S/)">
                                    <input type="number" className="input" value={form.ingresosAnualesProyectados}
                                        onChange={(e) => update('ingresosAnualesProyectados', e.target.value)} />
                                </Field>
                                {(form.taxRegime === 'RMT' || form.taxRegime === 'GENERAL') && (
                                    <Field label="Coeficiente Renta (ejercicio anterior)">
                                        <input type="number" step="0.0001" className="input" value={form.coeficienteRenta}
                                            onChange={(e) => update('coeficienteRenta', e.target.value)} />
                                    </Field>
                                )}
                                <div className="full" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#475569' }}>
                                        <input type="checkbox" checked={form.esBuenContribuyente}
                                            onChange={(e) => update('esBuenContribuyente', e.target.checked)} style={{ width: 18, height: 18 }} />
                                        Soy Buen Contribuyente
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#475569' }}>
                                        <input type="checkbox" checked={form.tieneTrabajadores}
                                            onChange={(e) => update('tieneTrabajadores', e.target.checked)} style={{ width: 18, height: 18 }} />
                                        Tengo trabajadores
                                    </label>
                                </div>
                            </div>
                            <WizardButtons onBack={() => setStep(2)} onNext={() => setStep(4)}
                                disabledNext={!/^\d{11}$/.test(form.ruc) || !form.razonSocial.trim()} />
                        </div>
                    )}

                    {step === 4 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#1e293b' }}>Revisar y confirmar</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: 16 }}>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TIPO</div><div style={{ fontWeight: 500 }}>{form.companyType}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>RÉGIMEN</div><div style={{ fontWeight: 500 }}>{form.taxRegime}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>RUC</div><div style={{ fontWeight: 500 }}>{form.ruc}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>RAZÓN SOCIAL</div><div style={{ fontWeight: 500 }}>{form.razonSocial}</div></div>
                            </div>

                            <WizardButtons
                                onBack={() => setStep(3)}
                                onNext={handleSave}
                                nextLabel={saving ? 'Creando Empresa...' : (savedOk ? '¡Listo!' : 'Empezar a usar el sistema')}
                                disabledNext={saving || !canSave}
                            />
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .setup-steps {
                    display: flex; align-items: center; gap: 0.5rem;
                    background: #f1f5f9; border-radius: 100px; padding: 0.5rem 1rem;
                }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
                .form-grid .full { grid-column: span 2; }
                .opt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
                @media (max-width: 600px) { .form-grid, .opt-grid { grid-template-columns: 1fr; } .form-grid .full { grid-column: 1; } }
                .opt-card { padding: 1.25rem; border: 1px solid #e2e8f0; border-radius: 16px; cursor: pointer; transition: all 0.2s; }
                .opt-card.selected { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(30,41,59,0.1); }
                .opt-icon { width: 36px; height: 36px; border-radius: 10px; background: #f1f5f9; color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
                .opt-card.selected .opt-icon { background: var(--primary); color: #fff; }
                .opt-title { font-size: 0.75rem; font-weight: 700; color: #64748b; }
                .opt-name { font-weight: 700; color: #0f172a; margin: 0.25rem 0; }
                .opt-desc { font-size: 0.85rem; color: #475569; }
                .opt-meta { font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; }
                .btn { padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 0.5rem; }
                .btn-primary { background: var(--primary); color: #fff; }
                .btn-secondary { background: #f1f5f9; color: #334155; }
                .input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 1rem; outline: none; }
                .input:focus { border-color: var(--primary); }
            `}</style>
        </div>
    );
}

function Step({ n, label, active, done }) {
    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: active || done ? 1 : 0.5 }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done || active ? 'var(--primary)' : '#cbd5e1',
                color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {done ? <Icon name="check" size={14} strokeWidth={3} /> : n}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500, color: '#1e293b' }}>{label}</div>
        </div>
    );
}

function StepDivider() {
    return <div style={{ flex: 1, height: 2, background: '#cbd5e1', minWidth: 10, opacity: 0.5 }} />;
}

function Field({ label, children, required, full }) {
    return (
        <div className={full ? 'full' : ''}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {children}
        </div>
    );
}

function WizardButtons({ onBack, onNext, nextLabel = 'Siguiente', disabledNext }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            {onBack ? (
                <button className="btn btn-secondary" onClick={onBack}>Atrás</button>
            ) : <span />}
            <button className="btn btn-primary" onClick={onNext} disabled={disabledNext} style={{ opacity: disabledNext ? 0.5 : 1 }}>
                {nextLabel}
            </button>
        </div>
    );
}
