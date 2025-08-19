'use client';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

export default function AdminOrgs() {
  const [orgId, setOrgId] = useState('demo-org');
  const [planCode, setPlanCode] = useState('free');
  const [result, setResult] = useState<any>(null);

  async function seedPlans() {
    const r = await fetch(`${API_BASE}/admin/seed-plans`, { method: 'POST' });
    const data = await r.json();
    setResult(data);
  }

  async function setPlan() {
    // Simple endpoint via Prisma (inline)
    const r = await fetch('/api/admin/set-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, planCode })
    });
    const data = await r.json();
    setResult(data);
  }

  return (
    <main>
      <h2>Organizações</h2>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button onClick={seedPlans}>Seed Plans (free/pro)</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={orgId} onChange={e=>setOrgId(e.target.value)} placeholder="Org ID" />
        <input value={planCode} onChange={e=>setPlanCode(e.target.value)} placeholder="free|pro|..." />
        <button onClick={setPlan}>Atribuir Plano</button>
      </div>
      <pre style={{ background:'#f7f7f7', padding:12 }}>{result ? JSON.stringify(result, null, 2) : 'Sem resultados ainda.'}</pre>
    </main>
  );
}
