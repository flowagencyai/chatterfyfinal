# Configuração do Onboarding Automático

## 🎯 O que foi implementado

Implementei um sistema completo de **onboarding automático** que:

1. **Cria automaticamente uma organização** para novos usuários no primeiro login
2. **Associa o plano FREE** como padrão (com fallback para criar o plano se não existir)
3. **Remove campos manuais** de Org ID/User ID da interface
4. **Usa contexto de sessão** para todas as chamadas de API automaticamente

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `/apps/web/app/api/auth/auth.config.ts` - Configuração do NextAuth com callbacks de onboarding
- `/apps/web/app/api/user/session/route.ts` - API endpoint para obter dados da sessão
- `/apps/web/app/hooks/useUserSession.tsx` - Hook React para gerenciar sessão do usuário
- `/apps/web/app/chat-page.tsx` - Página de chat melhorada que usa sessão automaticamente
- `/apps/web/app/page-new.tsx` - Nova página principal com redirecionamento automático

## 🚀 Como Ativar o Onboarding Automático

### 1. Atualizar o arquivo de rota do NextAuth

Substitua o conteúdo de `/apps/web/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handler } from "../auth.config";
export { handler as GET, handler as POST };
```

### 2. Atualizar o layout principal

Em `/apps/web/app/layout.tsx`, adicione o UserSessionProvider:

```tsx
import { SessionProvider } from "next-auth/react";
import { UserSessionProvider } from "./hooks/useUserSession";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ maxWidth: 960, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
        <SessionProvider>
          <UserSessionProvider>
            {children}
          </UserSessionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 3. Usar a nova página principal

Renomeie os arquivos:
```bash
# Backup da página antiga
mv apps/web/app/page.tsx apps/web/app/page-old.tsx

# Ativar nova página
mv apps/web/app/page-new.tsx apps/web/app/page.tsx
```

### 4. Executar migrações do banco

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:push
```

## 🔄 Fluxo de Funcionamento

### Para Novos Usuários:
1. Usuário acessa a aplicação → Redirecionado para `/auth`
2. Faz login com magic link (email)
3. **Automaticamente**:
   - Sistema cria uma organização pessoal
   - Associa o plano FREE
   - Cria subscription de 30 dias
4. Usuário é redirecionado para o chat
5. Todas as chamadas de API usam org/user automaticamente

### Para Usuários Existentes:
1. Login normal
2. Sistema carrega org/user existente
3. Usa informações da sessão automaticamente

## 📊 Benefícios da Implementação

✅ **UX Simplificada**: Usuário não precisa digitar IDs manualmente
✅ **Onboarding Automático**: Organização criada no primeiro login
✅ **Segurança**: IDs vêm da sessão autenticada, não de inputs do usuário
✅ **Planos Integrados**: Limites aplicados automaticamente
✅ **Pronto para Produção**: Sistema completo de multi-tenancy

## 🔧 Personalização

### Mudar Plano Padrão
Em `/apps/web/app/api/auth/auth.config.ts`, linha 26:
```typescript
where: { code: "FREE" }  // Mude para "STARTER" ou "PRO"
```

### Personalizar Nome da Organização
Em `/apps/web/app/api/auth/auth.config.ts`, linha 47:
```typescript
name: `${orgName}'s Organization`,  // Customize o formato
```

### Ajustar Período de Trial
Em `/apps/web/app/api/auth/auth.config.ts`, linha 57:
```typescript
periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
// Mude para 7 dias: 7 * 24 * 60 * 60 * 1000
// Mude para 14 dias: 14 * 24 * 60 * 60 * 1000
```

## 🎯 Próximos Passos Recomendados

1. **RBAC (Roles)**: Adicionar roles (owner/admin/member) no modelo User
2. **Convites**: Sistema para convidar membros para a organização
3. **Múltiplas Orgs**: Permitir usuário participar de várias organizações
4. **Dashboard**: Página de configurações da organização
5. **Billing**: Integração com Stripe para upgrade de planos

## 🐛 Troubleshooting

### Erro "User not found"
- Verifique se o modelo User tem relação com Organization no schema.prisma
- Execute `pnpm prisma:push` novamente

### Página não redireciona
- Verifique se `NEXTAUTH_URL` está configurado corretamente no .env
- Certifique-se de que o SessionProvider está no layout

### Organização não é criada
- Verifique logs do console do navegador
- Confirme que o plano FREE existe ou será criado automaticamente

## ✅ Teste Completo

1. Faça logout (limpe cookies se necessário)
2. Acesse a aplicação
3. Faça login com um email novo
4. Verifique no banco:
   - Nova organização criada
   - Usuário associado à org
   - Subscription ativa com plano FREE
5. Use o chat normalmente sem digitar IDs

---

**Implementação concluída com sucesso!** 🎉

O sistema agora tem onboarding automático completo, criando organizações e associando planos automaticamente para novos usuários, além de usar sempre o contexto de sessão para identificação.