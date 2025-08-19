'use client';
import { useState, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

export default function Page() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Logue-se e envie mensagem/arquivos.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState('demo-org');
  const [userId, setUserId] = useState('demo-user');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<any[]>([]);
  const [useS3, setUseS3] = useState(true);

  async function uploadDirectS3() {
    if (!fileRef.current || !fileRef.current.files) return;
    const fs = Array.from(fileRef.current.files);
    const acc: any[] = [];
    for (const f of fs) {
      // presign
      const pre = await fetch(`${API_BASE}/v1/files/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Org-Id': orgId, 'X-User-Id': userId },
        body: JSON.stringify({ filename: f.name, mime: f.type || 'application/octet-stream', sizeBytes: f.size })
      });
      const preData = await pre.json();
      if (!pre.ok) throw new Error(preData?.error || 'presign failed');

      // post to S3
      const fd = new FormData();
      Object.entries(preData.fields).forEach(([k,v]) => fd.append(k, v as any));
      fd.append('Content-Type', f.type || 'application/octet-stream');
      fd.append('file', f);
      const up = await fetch(preData.url, { method: 'POST', body: fd });
      if (!(up.status === 204 || up.ok)) throw new Error('S3 upload failed');

      // confirm
      const conf = await fetch(`${API_BASE}/v1/files/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Org-Id': orgId, 'X-User-Id': userId },
        body: JSON.stringify({ key: preData.key, filename: f.name, mime: f.type || 'application/octet-stream', sizeBytes: f.size })
      });
      const cdata = await conf.json();
      if (!conf.ok) throw new Error(cdata?.error || 'confirm failed');
      acc.push(cdata);
    }
    setUploaded(acc);
  }

  async function uploadLegacy() {
    if (!fileRef.current || !fileRef.current.files) return;
    const fd = new FormData();
    Array.from(fileRef.current.files).forEach(f => fd.append('files', f));
    const r = await fetch(`${API_BASE}/v1/files`, {
      method: 'POST',
      headers: { 'X-Org-Id': orgId, 'X-User-Id': userId },
      body: fd
    });
    const data = await r.json();
    setUploaded(data.uploaded || []);
  }

  async function send() {
    if (!input.trim() && uploaded.length === 0) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const content: any[] = [];
    if (input.trim()) content.push(input.trim());
    for (const f of uploaded) content.push({ type: 'file_id', id: f.id });

    try {
      const r = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Org-Id': orgId, 'X-User-Id': userId },
        body: JSON.stringify({
          provider: 'openai',
          model: 'gpt-4o-mini',
          stream: true,
          messages: [...newMessages.slice(1), { role: 'user', content }]
        })
      });
      if (r.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = (r.body as any).getReader();
        const decoder = new TextDecoder('utf-8');
        let acc = '';
        let assistantMsg = { role: 'assistant', content: '' as string };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const parts = acc.split('\n\n');
          acc = parts.pop() || '';
          for (const part of parts) {
            const lines = part.split('\n');
            let event: string | null = null;
            let data: string | null = null;
            for (const ln of lines) {
              if (ln.startsWith('event:')) event = ln.slice(6).trim();
              if (ln.startsWith('data:')) data = ln.slice(5).trim();
            }
            if (event === 'token' && data) {
              try {
                const payload = JSON.parse(data);
                assistantMsg.content += payload.content;
                setMessages([...newMessages, assistantMsg]);
              } catch {}
            }
            if (event === 'done') {
              setMessages([...newMessages, assistantMsg]);
              setLoading(false);
              setUploaded([]);
              if (fileRef.current) fileRef.current.value = '';
              return;
            }
          }
        }
      } else {
        const data = await r.json();
        const text = data?.choices?.[0]?.message?.content || 'Sem resposta';
        setMessages([...newMessages, { role: 'assistant', content: text }]);
      }
    } catch (e:any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Erro: ' + (e?.message || 'falha') }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Chat SaaS (Auth + S3 Upload)</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={orgId} onChange={e=>setOrgId(e.target.value)} placeholder="Org ID" />
        <input value={userId} onChange={e=>setUserId(e.target.value)} placeholder="User ID" />
        <label><input type="checkbox" checked={useS3} onChange={e=>setUseS3(e.target.checked)} /> Usar S3</label>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, minHeight: 320 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '8px 0' }}>
            <b>{m.role === 'user' ? 'Você' : 'Assistente'}:</b> {m.content}
          </div>
        ))}
        {loading && <div>Gerando...</div>}
      </div>

      <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Digite sua mensagem..." style={{ flex: 1, padding: 8 }} />
        <input ref={fileRef} type="file" multiple />
        <button onClick={useS3 ? uploadDirectS3 : uploadLegacy}>{useS3 ? 'Upload S3' : 'Upload API'}</button>
        <button onClick={send}>Enviar</button>
      </div>

      {uploaded.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          <b>Anexos prontos:</b> {uploaded.map(u => u.filename).join(', ')}
        </div>
      )}

      <p style={{ marginTop: 16, opacity: 0.7 }}>API: {API_BASE}</p>
      <div style={{ marginTop: 8 }}>
        <a href="/auth">Ir para Login</a> | <a href="/admin">Admin</a>
      </div>
    </main>
  );
}
