# Integração Chatbot-Teacher com CoderBot

Este documento descreve como a integração entre o Chatbot-Teacher e o CoderBot foi implementada usando autenticação unificada via PocketBase.

## Arquitetura da Integração

### Autenticação Unificada
- **PocketBase**: Banco de dados e sistema de autenticação centralizado
- **Sessão compartilhada**: Usuários autenticados em um sistema podem acessar o outro
- **Roles**: Diferenciação entre `student`, `teacher` e `admin`

### Componentes Implementados

#### 1. Biblioteca PocketBase (`src/lib/pocketbase.ts`)
- Cliente PocketBase configurado
- Funções de autenticação (login, registro, logout)
- Tipos TypeScript para UserRecord e AuthResponse
- Gerenciamento de sessão

#### 2. Context de Autenticação (`src/contexts/AuthContext.tsx`)
- Provider React para gerenciar estado de autenticação
- Hooks para acessar dados do usuário logado
- Listener para mudanças no estado de autenticação

#### 3. Componentes de Autenticação
- **AuthForm**: Formulário de login/registro com validação
- **ProtectedRoute**: Wrapper para proteger rotas por role
- Integração com shadcn/ui para UI consistente

#### 4. Dashboard Integrado
- Header atualizado com informações do usuário
- Botão de logout funcional
- Proteção de rota para apenas professores

## Configuração do Ambiente

### Variáveis de Ambiente
Crie um arquivo `.env` baseado no `env.example`:

```bash
# Desenvolvimento local
VITE_POCKETBASE_URL=http://localhost:8090

# Produção (Docker)
VITE_POCKETBASE_URL=http://pocketbase:8090
```

### Execução com Docker

O Chatbot-Teacher foi integrado ao `docker-compose.optimized.yml` do CoderBot:

```bash
# No diretório coderbot-v2
docker-compose -f docker-compose.optimized.yml up -d

# Serviços disponíveis:
# - Frontend CoderBot: http://localhost:3000
# - Chatbot-Teacher: http://localhost:3001
# - PocketBase: http://localhost:8090
# - Backend API: http://localhost:8000
# - Nginx (proxy): http://localhost:8080
```

### Acesso via Nginx
Através do proxy nginx, o Chatbot-Teacher está disponível em:
- **URL direta**: `http://localhost:8080/teacher/`
- **Botão no Home**: Integrado na página inicial do CoderBot

## Fluxo de Autenticação

1. **Registro**: Usuário se registra em qualquer um dos sistemas
2. **Login**: Credenciais são validadas via PocketBase
3. **Sessão**: Token JWT armazenado no localStorage
4. **Acesso**: Usuário pode navegar entre sistemas mantendo a sessão
5. **Logout**: Limpa sessão em ambos os sistemas

## Estrutura de Dados

### Usuário (PocketBase Collection: users)
```typescript
interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  emailVisibility: boolean;
  bio?: string;
  avatar?: string;
  created: string;
  updated: string;
}
```

## Funcionalidades Implementadas

### ✅ Concluído
- [x] Autenticação PocketBase no Chatbot-Teacher
- [x] Context de autenticação React
- [x] Formulários de login/registro
- [x] Proteção de rotas por role
- [x] Integração Docker
- [x] Botões de redirecionamento no Home
- [x] Configuração nginx para proxy
- [x] Logout funcional

### 🔄 Próximos Passos
- [ ] SSO (Single Sign-On) automático
- [ ] Perfis de usuário compartilhados
- [ ] Notificações cross-platform

## Desenvolvimento

### Instalação Local
```bash
cd Chatbot-Teacher
npm install
npm run dev
```

### Build para Produção
```bash
npm run build
```

### Estrutura de Arquivos
```
src/
├── lib/
│   └── pocketbase.ts          # Cliente PocketBase
├── contexts/
│   └── AuthContext.tsx        # Context de autenticação
├── components/
│   └── auth/
│       ├── AuthForm.tsx       # Formulário login/registro
│       └── ProtectedRoute.tsx # Proteção de rotas
└── components/dashboard/
    └── DashboardHeader.tsx    # Header com logout
```

## Troubleshooting

### Problemas Comuns

1. **Erro de CORS**: Verificar se PocketBase está configurado para aceitar requests do frontend
2. **Sessão não persiste**: Verificar se localStorage está funcionando
3. **Docker não conecta**: Verificar se os serviços estão na mesma network

### Logs Úteis
```bash
# Logs do PocketBase
docker logs coderbot-pocketbase

# Logs do Chatbot-Teacher
docker logs coderbot-teacher

# Logs do Nginx
docker logs coderbot-nginx
```

## Contribuição

Para contribuir com melhorias na integração:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste a integração completa
5. Abra um Pull Request

## Suporte

Para dúvidas ou problemas com a integração, abra uma issue no repositório principal do CoderBot.
