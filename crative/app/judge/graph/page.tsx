'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getEcosystemGraph } from '../../../lib/api';
import GraphView from '../../../components/GraphView';
import type { GraphData } from '../../../lib/types';

export default function EcosystemGraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEcosystemGraph()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: 'white' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 5vw',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/judge/queue" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          ← Queue
        </Link>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Ecosystem Graph</span>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px 60px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.4rem' }}>Ecosystem Graph</h1>
        <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem' }}>
          Live Neo4j AuraDB data — startups, mentors, programmes, and geographies with their relationships
        </p>

        <div style={{
          background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px', padding: '20px',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Loading graph data…</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>Connecting to Neo4j AuraDB</div>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ color: '#ff4757', fontSize: '0.9rem', marginBottom: '8px' }}>Failed to load graph</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{error}</div>
              <button
                onClick={() => { setLoading(true); setError(null); getEcosystemGraph().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)); }}
                style={{
                  marginTop: '16px', background: 'linear-gradient(135deg, #25d9ff, #1495ff)',
                  border: 'none', borderRadius: '10px', color: '#021226',
                  padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                }}
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <Stat label="Nodes" value={data.nodes.length} />
                <Stat label="Relationships" value={data.links.length} />
                <Stat label="Startups" value={data.nodes.filter((n) => n.label === 'Startup').length} />
                <Stat label="Mentors" value={data.nodes.filter((n) => n.label === 'Mentor').length} />
                <Stat label="Programmes" value={data.nodes.filter((n) => n.label === 'Programme').length} />
              </div>
              <GraphView data={data} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#25d9ff' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
    </div>
  );
}
