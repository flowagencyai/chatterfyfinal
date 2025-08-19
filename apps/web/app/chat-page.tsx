'use client';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Olá! Como posso ajudar você hoje?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<any[]>([]);
  const [useS3, setUseS3] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Buscar informações do usuário logado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    } else if (status === 'authenticated') {
      fetchUserInfo();
    }
  }, [status]);

  async function fetchUserInfo() {
    try {
      const res = await fetch('/api/user/session');
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data.user);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoadingUser(false);
    }
  }

  async function uploadDirectS3() {
    if (!fileRef.current || !fileRef.current.files || !userInfo) return;
    const fs = Array.from(fileRef.current.files);
    const acc: any[] = [];
    
    for (const f of fs) {
      try {
        // Check file size limit
        if (userInfo.plan && f.size > userInfo.plan.maxFileSizeMB * 1024 * 1024) {
          alert(`Arquivo ${f.name} excede o limite de ${userInfo.plan.maxFileSizeMB}MB do seu plano`);
          continue;
        }

        // presign
        const pre = await fetch(`${API_BASE}/v1/files/presign`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'X-Org-Id': userInfo.orgId, 
            'X-User-Id': userInfo.id 
          },
          body: JSON.stringify({ 
            filename: f.name, 
            mime: f.type || 'application/octet-stream', 
            sizeBytes: f.size 
          })
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
          headers: { 
            'Content-Type': 'application/json', 
            'X-Org-Id': userInfo.orgId, 
            'X-User-Id': userInfo.id 
          },
          body: JSON.stringify({ 
            key: preData.key, 
            filename: f.name, 
            mime: f.type || 'application/octet-stream', 
            sizeBytes: f.size 
          })
        });
        const cdata = await conf.json();
        if (!conf.ok) throw new Error(cdata?.error || 'confirm failed');
        acc.push(cdata);
      } catch (error: any) {
        alert(`Erro ao fazer upload de ${f.name}: ${error.message}`);
      }
    }
    setUploaded(acc);
  }

  async function uploadLegacy() {
    if (!fileRef.current || !fileRef.current.files || !userInfo) return;
    
    // Check file sizes
    const files = Array.from(fileRef.current.files);
    for (const f of files) {
      if (userInfo.plan && f.size > userInfo.plan.maxFileSizeMB * 1024 * 1024) {
        alert(`Arquivo ${f.name} excede o limite de ${userInfo.plan.maxFileSizeMB}MB do seu plano`);
        return;
      }
    }
    
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    const r = await fetch(`${API_BASE}/v1/files`, {
      method: 'POST',
      headers: { 
        'X-Org-Id': userInfo.orgId, 
        'X-User-Id': userInfo.id 
      },
      body: fd
    });
    const data = await r.json();
    setUploaded(data.uploaded || []);
  }

  async function send() {
    if (!input.trim() && uploaded.length === 0) return;
    if (!userInfo) {
      alert('Por favor, aguarde o carregamento das informações do usuário');
      return;
    }

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
        headers: { 
          'Content-Type': 'application/json', 
          'X-Org-Id': userInfo.orgId, 
          'X-User-Id': userInfo.id 
        },
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
      setUploaded([]);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (loadingUser) {
    return (
      <main>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <h2>Carregando...</h2>
        </div>
      </main>
    );
  }

  if (!userInfo) {
    return (
      <main>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <h2>Você precisa estar logado</h2>
          <p><a href="/auth">Fazer login</a></p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1>Chat SaaS</h1>
          <p style={{ margin: 0, opacity: 0.7 }}>
            Olá, {userInfo.name || userInfo.email} • {userInfo.orgName}
          </p>
          {userInfo.plan && (
            <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
              Plano: {userInfo.plan.name} • 
              Limite diário: {userInfo.plan.dailyTokenLimit.toLocaleString()} tokens • 
              Armazenamento: {userInfo.plan.storageLimitMB}MB
            </p>
          )}
        </div>
        <div>
          <a href="/auth" style={{ marginRight: 10 }}>Perfil</a>
          <a href="/admin">Admin</a>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, minHeight: 400, maxHeight: 500, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '8px 0' }}>
            <b>{m.role === 'user' ? 'Você' : 'Assistente'}:</b>
            <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ opacity: 0.6 }}>Gerando resposta...</div>}
      </div>

      <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Digite sua mensagem..." 
          style={{ flex: 1, padding: 10, borderRadius: 4, border: '1px solid #ddd' }} 
        />
        <input ref={fileRef} type="file" multiple style={{ maxWidth: 200 }} />
        <button 
          onClick={useS3 ? uploadDirectS3 : uploadLegacy} 
          style={{ padding: '10px 15px', borderRadius: 4, border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}
        >
          {useS3 ? 'Upload S3' : 'Upload API'}
        </button>
        <button 
          onClick={send} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            borderRadius: 4, 
            border: 'none', 
            background: loading ? '#ccc' : '#28a745', 
            color: 'white', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          Enviar
        </button>
      </div>

      {uploaded.length > 0 && (
        <div style={{ marginTop: 10, padding: 10, background: '#f0f0f0', borderRadius: 4 }}>
          <b>Arquivos anexados:</b> {uploaded.map(u => u.filename).join(', ')}
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.6 }}>
        <label>
          <input 
            type="checkbox" 
            checked={useS3} 
            onChange={e => setUseS3(e.target.checked)} 
          /> 
          Usar upload direto S3 (recomendado)
        </label>
      </div>
    </main>
  );
}