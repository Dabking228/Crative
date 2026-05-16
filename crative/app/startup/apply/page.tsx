'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { submitApplication, fileToBase64 } from '../../../lib/api';
import GatekeeperStream from '../../components/GatekeeperStream';
import InterviewPanel from '../../components/InterviewPanel';
import type { SSEToken, EligibilityResult } from '../../../lib/types';

const SECTORS = ['Fintech', 'Healthtech', 'AgriTech', 'EdTech', 'SaaS', 'E-commerce', 'Other'];
const STAGES = ['CIP Spark', 'CIP Sprint'];

type Phase = 'form' | 'streaming' | 'result' | 'interview' | 'submitted';

interface FormData {
  startup_name: string;
  registration_no: string;
  sector: string;
  stage: string;
  incorporation_date: string;
  total_malaysian_ownership_pct: string;
  business_description: string;
  ssm_file: File | null;
  pitch_file: File | null;
}

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    startup_name: '',
    registration_no: '',
    sector: '',
    stage: 'CIP Spark',
    incorporation_date: '',
    total_malaysian_ownership_pct: '',
    business_description: '',
    ssm_file: null,
    pitch_file: null,
  });

  const [phase, setPhase] = useState<Phase>('form');
  const [applicationId, setApplicationId] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<SSEToken['result'] | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof FormData, value: string | File | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canProceed() {
    if (step === 1) return form.startup_name && form.registration_no && form.sector && form.stage && form.incorporation_date && form.total_malaysian_ownership_pct && form.business_description;
    if (step === 2) return !!form.ssm_file;
    if (step === 3) return !!form.pitch_file;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const ssm_b64 = form.ssm_file ? await fileToBase64(form.ssm_file) : '';
      const pitch_b64 = form.pitch_file ? await fileToBase64(form.pitch_file) : '';

      const res = await submitApplication({
        startup_name: form.startup_name,
        sector: form.sector,
        stage: form.stage,
        programme_applied: form.stage,
        registration_no: form.registration_no,
        incorporation_date: form.incorporation_date,
        total_malaysian_ownership_pct: parseFloat(form.total_malaysian_ownership_pct),
        business_description: form.business_description,
        ssm_document_base64: ssm_b64,
        pitch_deck_base64: pitch_b64,
      });

      setApplicationId(res.application_id);
      setPhase('streaming');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const handleStreamDone = useCallback(async (result: SSEToken['result']) => {
    setEligibilityResult(result);
    setPhase('result');

    if (result?.result === 'PASS' || result?.result === 'MANUAL_REVIEW') {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/interview/${applicationId}/generate`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions ?? []);
        }
      } catch {
        // questions stay empty; user can still see result
      }
    }
  }, [applicationId]);

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: 'white', padding: '0 0 60px' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 5vw',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          ← Cradle Portal
        </Link>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Startup Application</span>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px 0' }}>

        {phase === 'form' && (
          <>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
              {[1, 2, 3, 4].map((s) => (
                <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: s < step ? 'linear-gradient(135deg, #25d9ff, #1495ff)' : s === step ? 'rgba(37,217,255,0.2)' : 'rgba(255,255,255,0.08)',
                    border: s === step ? '2px solid #25d9ff' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.82rem', fontWeight: 600,
                    color: s < step ? '#021226' : s === step ? '#25d9ff' : 'rgba(255,255,255,0.35)',
                  }}>
                    {s < step ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: s === step ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>
                    {['Details', 'SSM Cert', 'Pitch Deck', 'Review'][s - 1]}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px', padding: '28px',
            }}>
              {step === 1 && (
                <div>
                  <h2 style={{ margin: '0 0 24px', fontSize: '1.1rem' }}>Company Details</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldLabel>Company Name *</FieldLabel>
                      <TextInput value={form.startup_name} onChange={(v) => update('startup_name', v)} placeholder="e.g. FinPay Sdn Bhd" />
                    </div>
                    <div>
                      <FieldLabel>Registration No. *</FieldLabel>
                      <TextInput value={form.registration_no} onChange={(v) => update('registration_no', v)} placeholder="202301012345" />
                    </div>
                    <div>
                      <FieldLabel>Incorporation Date *</FieldLabel>
                      <TextInput type="date" value={form.incorporation_date} onChange={(v) => update('incorporation_date', v)} />
                    </div>
                    <div>
                      <FieldLabel>Sector *</FieldLabel>
                      <SelectInput value={form.sector} onChange={(v) => update('sector', v)} options={SECTORS} placeholder="Select sector" />
                    </div>
                    <div>
                      <FieldLabel>Programme *</FieldLabel>
                      <SelectInput value={form.stage} onChange={(v) => update('stage', v)} options={STAGES} />
                    </div>
                    <div>
                      <FieldLabel>Malaysian Ownership % *</FieldLabel>
                      <TextInput type="number" min="0" max="100" value={form.total_malaysian_ownership_pct} onChange={(v) => update('total_malaysian_ownership_pct', v)} placeholder="e.g. 100" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldLabel>Business Description *</FieldLabel>
                      <textarea
                        value={form.business_description}
                        onChange={(e) => update('business_description', e.target.value)}
                        placeholder="Describe your product, target market, and current traction…"
                        rows={4}
                        style={textareaStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>SSM Certificate</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
                    Upload your SSM (Companies Commission of Malaysia) registration certificate. PDF only.
                  </p>
                  <FileDropZone
                    file={form.ssm_file}
                    accept=".pdf"
                    label="SSM Certificate"
                    onFile={(f) => update('ssm_file', f)}
                  />
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Pitch Deck</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
                    Upload your pitch deck. PDF only.
                  </p>
                  <FileDropZone
                    file={form.pitch_file}
                    accept=".pdf"
                    label="Pitch Deck"
                    onFile={(f) => update('pitch_file', f)}
                  />
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem' }}>Review & Submit</h2>
                  <SummaryRow label="Company" value={form.startup_name} />
                  <SummaryRow label="Registration No." value={form.registration_no} />
                  <SummaryRow label="Incorporation Date" value={form.incorporation_date} />
                  <SummaryRow label="Sector" value={form.sector} />
                  <SummaryRow label="Programme" value={form.stage} />
                  <SummaryRow label="Malaysian Ownership" value={`${form.total_malaysian_ownership_pct}%`} />
                  <SummaryRow label="SSM Certificate" value={form.ssm_file?.name ?? '—'} />
                  <SummaryRow label="Pitch Deck" value={form.pitch_file?.name ?? '—'} />
                  {error && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,71,87,0.1)', borderRadius: '10px', color: '#ff4757', fontSize: '0.85rem' }}>
                      {error}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                {step > 1 ? (
                  <button onClick={() => setStep((s) => s - 1)} style={secondaryBtnStyle}>← Back</button>
                ) : <div />}
                {step < 4 ? (
                  <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} style={canProceed() ? primaryBtnStyle : disabledBtnStyle}>
                    Continue →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} style={submitting ? disabledBtnStyle : primaryBtnStyle}>
                    {submitting ? 'Submitting…' : 'Submit Application →'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {phase === 'streaming' && (
          <div>
            <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', textAlign: 'center' }}>Eligibility Check in Progress</h2>
            <GatekeeperStream applicationId={applicationId} onComplete={handleStreamDone} />
          </div>
        )}

        {phase === 'result' && eligibilityResult && (
          <div>
            <EligibilityCard result={eligibilityResult} />
            {(eligibilityResult.result === 'PASS' || eligibilityResult.result === 'MANUAL_REVIEW') && questions.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Investment Interview</h3>
                <InterviewPanel
                  applicationId={applicationId}
                  questions={questions}
                  onComplete={() => setPhase('submitted')}
                />
              </div>
            )}
            {eligibilityResult.result === 'FAIL' && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#25d9ff', fontSize: '0.88rem' }}>← Return to home</Link>
              </div>
            )}
          </div>
        )}

        {phase === 'submitted' && (
          <div style={{
            textAlign: 'center',
            background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px', padding: '40px 28px',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✓</div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Application Submitted</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 24px' }}>
              Your answers have been submitted. The judge panel is reviewing your application.
            </p>
            <code style={{
              display: 'block', background: 'rgba(255,255,255,0.05)',
              padding: '10px', borderRadius: '8px', fontSize: '0.8rem',
              color: '#25d9ff', marginBottom: '24px',
            }}>
              Application ID: {applicationId}
            </code>
            <Link
              href={`/startup/progress?id=${applicationId}`}
              style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #25d9ff, #1495ff)',
                color: '#021226', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
              }}
            >
              Track Progress →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', marginBottom: '6px', letterSpacing: '0.3px' }}>{children}</label>;
}

function TextInput({ value, onChange, placeholder, type = 'text', min, max }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; min?: string; max?: string }) {
  return (
    <input
      type={type} value={value} min={min} max={max}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
        color: 'white', padding: '10px 12px', fontSize: '0.88rem',
        outline: 'none', boxSizing: 'border-box',
      }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', background: 'rgba(18,22,38,0.95)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
        color: value ? 'white' : 'rgba(255,255,255,0.35)',
        padding: '10px 12px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
      }}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FileDropZone({ file, accept, label, onFile }: { file: File | null; accept: string; label: string; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        border: '2px dashed rgba(255,255,255,0.2)',
        borderRadius: '14px', padding: '32px 20px', textAlign: 'center',
        cursor: 'pointer', background: file ? 'rgba(46,213,115,0.04)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {file ? (
        <>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✓</div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{file.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{(file.size / 1024).toFixed(1)} KB — click to replace</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'rgba(255,255,255,0.3)' }}>↑</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Drop {label} here or click to browse</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>PDF only</div>
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: '0.88rem' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function EligibilityCard({ result }: { result: NonNullable<SSEToken['result']> }) {
  const map: Record<EligibilityResult, { color: string; bg: string; border: string; icon: string; title: string }> = {
    PASS: { color: '#2ed573', bg: 'rgba(46,213,115,0.08)', border: 'rgba(46,213,115,0.25)', icon: '✓', title: 'Eligible' },
    FAIL: { color: '#ff4757', bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.25)', icon: '✗', title: 'Not Eligible' },
    MANUAL_REVIEW: { color: '#ffa502', bg: 'rgba(255,165,2,0.08)', border: 'rgba(255,165,2,0.25)', icon: '⚠', title: 'Manual Review Required' },
  };
  const style = map[result.result as EligibilityResult] ?? map.MANUAL_REVIEW;

  return (
    <div style={{
      background: style.bg, border: `1px solid ${style.border}`,
      borderRadius: '16px', padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '1.5rem', color: style.color }}>{style.icon}</span>
        <h3 style={{ margin: 0, color: style.color, fontSize: '1.05rem' }}>{style.title}</h3>
        {result.confidence && (
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            {(result.confidence * 100).toFixed(0)}% confidence
          </span>
        )}
      </div>
      {result.programme_recommended && (
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
          Recommended programme: <strong style={{ color: '#25d9ff' }}>{result.programme_recommended}</strong>
        </div>
      )}
      {result.flags?.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Flags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {result.flags.map((flag, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: '999px',
                background: 'rgba(255,165,2,0.12)', color: '#ffa502',
                fontSize: '0.78rem',
              }}>{flag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #25d9ff, #1495ff)',
  border: 'none', borderRadius: '10px',
  color: '#021226', padding: '10px 22px',
  cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '10px', color: 'white',
  padding: '10px 22px', cursor: 'pointer', fontSize: '0.9rem',
};

const disabledBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle, background: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed',
};

const textareaStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
  color: 'white', padding: '10px 12px', fontSize: '0.88rem',
  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', lineHeight: 1.6,
};
