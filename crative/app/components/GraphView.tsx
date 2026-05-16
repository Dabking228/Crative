'use client';

import { useEffect, useRef, useState } from 'react';
import type { GraphData, GraphNode } from '../../lib/types';

const NODE_COLORS: Record<string, string> = {
  Startup: '#2E5FAC',
  Mentor: '#0F6E56',
  Programme: '#534AB7',
  Geography: '#888780',
};

interface Props {
  data: GraphData;
}

export default function GraphView({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [visibleLabels, setVisibleLabels] = useState<Set<string>>(new Set(Object.keys(NODE_COLORS)));
  const animFrameRef = useRef<number>(0);

  const nodesRef = useRef<Array<{ node: GraphNode; x: number; y: number; vx: number; vy: number }>>([]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = container.clientHeight || 500;
    canvas.width = W;
    canvas.height = H;

    // Init node positions
    nodesRef.current = data.nodes.map((node, i) => ({
      node,
      x: W / 2 + Math.cos(i * 2.4) * (80 + i * 8),
      y: H / 2 + Math.sin(i * 2.4) * (80 + i * 8),
      vx: 0,
      vy: 0,
    }));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function findNode(id: string) {
      return nodesRef.current.find((n) => n.node.id === id);
    }

    function simulate() {
      const nodes = nodesRef.current;
      const repulsion = 800;
      const attraction = 0.04;
      const damping = 0.8;
      const centerForce = 0.002;

      for (let i = 0; i < nodes.length; i++) {
        nodes[i].vx += (W / 2 - nodes[i].x) * centerForce;
        nodes[i].vy += (H / 2 - nodes[i].y) * centerForce;

        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          nodes[i].vx -= (dx / dist) * force;
          nodes[i].vy -= (dy / dist) * force;
          nodes[j].vx += (dx / dist) * force;
          nodes[j].vy += (dy / dist) * force;
        }
      }

      for (const link of data.links) {
        const src = findNode(link.source);
        const tgt = findNode(link.target);
        if (!src || !tgt) continue;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 120;
        const force = (dist - targetDist) * attraction;
        src.vx += (dx / dist) * force;
        src.vy += (dy / dist) * force;
        tgt.vx -= (dx / dist) * force;
        tgt.vy -= (dy / dist) * force;
      }

      for (const n of nodes) {
        n.vx *= damping;
        n.vy *= damping;
        n.x = Math.max(20, Math.min(W - 20, n.x + n.vx));
        n.y = Math.max(20, Math.min(H - 20, n.y + n.vy));
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Links
      for (const link of data.links) {
        const src = findNode(link.source);
        const tgt = findNode(link.target);
        if (!src || !tgt) continue;
        if (!visibleLabels.has(src.node.label) || !visibleLabels.has(tgt.node.label)) continue;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        const score = (link.properties as Record<string, number>)?.score ?? 1;
        ctx.strokeStyle = `rgba(255,255,255,${0.08 + (score > 1 ? 0 : score) * 0.15})`;
        ctx.lineWidth = link.type === 'MATCHED_TO' ? Math.max(1, (score as number) * 2.5) : 1;
        ctx.stroke();
      }

      // Nodes
      for (const { node, x, y } of nodesRef.current) {
        if (!visibleLabels.has(node.label)) continue;
        const color = NODE_COLORS[node.label] || '#888';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name?.slice(0, 18) ?? '', x, y + 18);
      }
    }

    let ticks = 0;
    function loop() {
      if (ticks < 200) {
        simulate();
        ticks++;
      }
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    function handleClick(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const { node, x, y } of nodesRef.current) {
        if (Math.sqrt((mx - x) ** 2 + (my - y) ** 2) < 12) {
          setSelectedNode(node);
          return;
        }
      }
      setSelectedNode(null);
    }

    canvas.addEventListener('click', handleClick);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas?.removeEventListener('click', handleClick);
    };
  }, [data, visibleLabels]);

  function toggleLabel(label: string) {
    setVisibleLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Controls */}
      <div style={{
        display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>Filter:</span>
        {Object.entries(NODE_COLORS).map(([label, color]) => (
          <button
            key={label}
            onClick={() => toggleLabel(label)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: visibleLabels.has(label) ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${visibleLabels.has(label) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '999px', padding: '5px 12px',
              color: visibleLabels.has(label) ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: '0.78rem',
              opacity: visibleLabels.has(label) ? 1 : 0.5,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{
            background: 'rgba(2,8,18,0.6)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
            width: '100%',
            height: '500px',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap',
      }}>
        {Object.entries(NODE_COLORS).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </div>
        ))}
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <div style={{
          position: 'absolute', top: '48px', right: '10px',
          background: 'rgba(18,22,38,0.97)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '14px', padding: '16px',
          width: '240px', zIndex: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem',
              background: NODE_COLORS[selectedNode.label] + '33',
              color: NODE_COLORS[selectedNode.label], fontWeight: 600,
            }}>
              {selectedNode.label}
            </span>
            <button onClick={() => setSelectedNode(null)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: '0.85rem',
            }}>✕</button>
          </div>
          <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '0.92rem' }}>{selectedNode.name}</div>
          {Object.entries(selectedNode.properties)
            .filter(([k]) => !['id', 'name'].includes(k))
            .map(([k, v]) => v !== null && v !== undefined && (
              <div key={k} style={{ marginBottom: '4px', fontSize: '0.78rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}: </span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{String(v)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
