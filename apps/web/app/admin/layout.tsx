export default function AdminLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ maxWidth: 960, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
        <h1>Admin</h1>
        <div style={{ display:'flex', gap:16, marginBottom: 16 }}>
          <a href="/admin">Uso</a>
          <a href="/admin/orgs">Organizações</a>
          <a href="/admin/subscriptions">Assinaturas</a>
        </div>
        {children}
      </body>
    </html>
  );
}
