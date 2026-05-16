'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type RoadmapNode = {
    id: string;
    date: string;
    title: string;
    description: string;
};

export type RoadmapData = {
    applicationId: string;
    nodes: RoadmapNode[];
    confirmed: boolean;
    confirmedAt?: string;
};

function loadRoadmap(appId: string): RoadmapData {
    if (typeof window === 'undefined') return { applicationId: appId, nodes: [], confirmed: false };
    const raw = localStorage.getItem(`roadmap_${appId}`);
    if (raw) return JSON.parse(raw) as RoadmapData;
    const defaults: RoadmapData = {
        applicationId: appId,
        confirmed: false,
        nodes: [
            { id: '1', date: '', title: 'Kickoff Meeting', description: 'Initial meeting with mentor to align on goals and programme requirements.' },
            { id: '2', date: '', title: 'MVP Launch', description: 'Core product features deployed and demonstrated to target users.' },
            { id: '3', date: '', title: 'First Paying Customers', description: 'Acquire first 10 paying customers with documented invoices.' },
        ],
    };
    localStorage.setItem(`roadmap_${appId}`, JSON.stringify(defaults));
    return defaults;
}

function saveRoadmap(data: RoadmapData) {
    localStorage.setItem(`roadmap_${data.applicationId}`, JSON.stringify(data));
}

function genId() {
    return Math.random().toString(36).slice(2, 9);
}

function RoadmapContent() {
    const params = useSearchParams();
    const router = useRouter();
    const appId = params.get('id') ?? '';
    const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState<RoadmapNode[]>([]);
    const [confirmDialog, setConfirmDialog] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!appId) return;
        const data = loadRoadmap(appId);
        setRoadmap(data);
        setDraft(data.nodes);
    }, [appId]);

    if (!appId) return (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>
            No application ID provided.
        </div>
    );

    if (!roadmap) return (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
    );

    const sorted = [...(editMode ? draft : roadmap.nodes)].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
    });

    const updateNode = (id: string, field: keyof RoadmapNode, value: string) => {
        setDraft((prev) => prev.map((n) => n.id === id ? { ...n, [field]: value } : n));
    };

    const addNode = () => {
        setDraft((prev) => [...prev, { id: genId(), date: '', title: '', description: '' }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const removeNode = (id: string) => {
        setDraft((prev) => prev.filter((n) => n.id !== id));
    };

    const handleSave = () => {
        if (!roadmap) return;
        const updated: RoadmapData = { ...roadmap, nodes: draft };
        saveRoadmap(updated);
        setRoadmap(updated);
        setEditMode(false);
    };

    const handleConfirm = () => {
        if (!roadmap) return;
        const updated: RoadmapData = { ...roadmap, nodes: draft, confirmed: true, confirmedAt: new Date().toISOString() };
        saveRoadmap(updated);
        setRoadmap(updated);
        setEditMode(false);
        setConfirmDialog(false);
    };

    const accentColor = '#25d9ff';
    const nodeCard = (node: RoadmapNode, idx: number, isEdit: boolean): React.ReactNode => (
        <div key={node.id} style={{ display: 'flex', gap: '0', position: 'relative' }}>
            {/* Timeline spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
                <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: roadmap.confirmed ? 'linear-gradient(135deg,#25d9ff,#1495ff)' : 'rgba(37,217,255,0.15)',
                    border: `2px solid ${accentColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, color: roadmap.confirmed ? '#021226' : accentColor,
                }}>
                    {idx + 1}
                </div>
                {idx < sorted.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: 'rgba(37,217,255,0.2)', minHeight: '40px' }} />
                )}
            </div>

            {/* Card */}
            <div style={{
                flex: 1, marginLeft: '16px', marginBottom: '24px',
                background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '18px',
            }}>
                {isEdit ? (
                    <>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <input
                                type="date"
                                value={node.date}
                                onChange={(e) => updateNode(node.id, 'date', e.target.value)}
                                style={{ flex: '0 0 160px', padding: '7px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '0.85rem' }}
                            />
                            <input
                                type="text"
                                value={node.title}
                                placeholder="Milestone title"
                                onChange={(e) => updateNode(node.id, 'title', e.target.value)}
                                style={{ flex: 1, minWidth: '160px', padding: '7px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '0.85rem' }}
                            />
                            <button
                                onClick={() => removeNode(node.id)}
                                style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Remove
                            </button>
                        </div>
                        <textarea
                            value={node.description}
                            placeholder="What needs to be achieved at this milestone…"
                            onChange={(e) => updateNode(node.id, 'description', e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{node.title || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Untitled milestone</span>}</span>
                            {node.date && (
                                <span style={{ padding: '2px 10px', borderRadius: '999px', background: 'rgba(37,217,255,0.1)', color: accentColor, fontSize: '0.75rem', border: `1px solid rgba(37,217,255,0.25)` }}>
                                    {new Date(node.date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                            {node.description || <span style={{ color: 'rgba(255,255,255,0.25)' }}>No description.</span>}
                        </p>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px 80px' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Development Roadmap</h1>
                    {roadmap.confirmed && (
                        <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(46,213,115,0.12)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.3)', fontSize: '0.75rem', fontWeight: 600 }}>
                            Confirmed — Locked
                        </span>
                    )}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
                    Application: <code style={{ color: accentColor }}>{appId}</code>
                </div>
                {roadmap.confirmed && roadmap.confirmedAt && (
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                        Confirmed on {new Date(roadmap.confirmedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                )}
                {!roadmap.confirmed && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)', fontSize: '0.82rem', color: 'rgba(255,200,100,0.85)' }}>
                        This roadmap is a draft. Both you and your mentor must agree on the plan before confirming. Once confirmed, it cannot be changed.
                    </div>
                )}
            </div>

            {/* Roadmap nodes */}
            <div>
                {sorted.length === 0 && !editMode && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                        No milestones yet. Click Edit to add your first milestone.
                    </div>
                )}
                {sorted.map((node, idx) => nodeCard(node, idx, editMode && !roadmap.confirmed))}
                <div ref={bottomRef} />
            </div>

            {/* Actions */}
            {!roadmap.confirmed && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {!editMode ? (
                        <button
                            onClick={() => setEditMode(true)}
                            style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Edit Roadmap
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={addNode}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid rgba(37,217,255,0.3)`, background: 'rgba(37,217,255,0.08)', color: accentColor, fontWeight: 600, cursor: 'pointer' }}
                            >
                                + Add Milestone
                            </button>
                            <button
                                onClick={handleSave}
                                style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#25d9ff,#1495ff)', color: '#021226', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                            >
                                Save Draft
                            </button>
                            <button
                                onClick={() => setConfirmDialog(true)}
                                style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Confirm Roadmap
                            </button>
                            <button
                                onClick={() => { setEditMode(false); setDraft(roadmap.nodes); }}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Confirm dialog */}
            {confirmDialog && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#0e1220', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '100%' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Confirm Roadmap?</h3>
                        <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                            Once confirmed, this roadmap is <strong style={{ color: 'white' }}>locked</strong> and cannot be edited by anyone. Your team must follow the development stages and upload proof at each milestone. Cradle judges will monitor your progress.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleConfirm}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg,#2ed573,#0F6E56)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                            >
                                Yes, Confirm &amp; Lock
                            </button>
                            <button
                                onClick={() => setConfirmDialog(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StartupRoadmapPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#050508', color: 'white' }}>
            <nav style={{
                position: 'sticky', top: 0, zIndex: 10, padding: '16px 5vw',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <BackBtn />
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Development Roadmap</span>
            </nav>
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading…</div>}>
                <RoadmapContent />
            </Suspense>
        </div>
    );
}

function BackBtn() {
    const params = useSearchParams();
    const id = params.get('id') ?? '';
    return (
        <Link href={`/startup/progress?id=${id}`} style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            ← Back
        </Link>
    );
}
