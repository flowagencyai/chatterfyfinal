'use client';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

export default function AdminUsage() {
  const [org, setOrg] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    const qs = new URLSearchParams({ ...(org?{org}:{}), ...(from?{from}:{}), ...(to?{to}:{}) });
    const r = await fetch(`${API_BASE}/admin/usage?` + qs.toString());
    const data = await r.json();
    setRows(data.data || []);
  }
  useEffect(()=>{ load(); }, []);

  return (
    <main>
      <h2>Relatório de Uso</h2>
      <div style={{ display:'flex', gap:8, marginBottom: 12 }}>
        <input placeholder="Org ID" value={org} onChange={e=>setOrg(e.target.value)} />
        <input placeholder="from YYYY-MM-DD" value={from} onChange={e=>setFrom(e.target.value)} />
        <input placeholder="to YYYY-MM-DD" value={to} onChange={e=>setTo(e.target.value)} />
        <button onClick={load}>Buscar</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr><th style={{textAlign:'left'}}>Dia</th><th>Org</th><th>Prompt</th><th>Completion</th><th>Total</th><th>Custo USD</th></tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td>{new Date(r.day).toISOString().slice(0,10)}</td>
              <td>{r.orgId}</td>
              <td>{r.prompt_tokens}</td>
              <td>{r.completion_tokens}</td>
              <td>{r.total_tokens}</td>
              <td>{Number(r.cost_usd).toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
