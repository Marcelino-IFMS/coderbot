# Deploy do Chatbot-Teacher

O Chatbot-Teacher agora é **deployado independentemente** do CoderBot-v2, mas se conecta aos serviços do CoderBot-v2 (PocketBase e Backend).

## 🏗️ Arquitetura

```
┌─────────────────────┐    HTTP Requests    ┌─────────────────────┐
│   Chatbot-Teacher   │ ──────────────────▶ │     CoderBot-v2     │
│    (Porto 80/3001)  │                     │    (Porto 80)       │
│                     │                     │                     │
│ ┌─────────────────┐ │                     │ ┌─────────────────┐ │
│ │   Frontend      │ │                     │ │   PocketBase    │ │
│ │   (React+Vite)  │ │                     │ │   :8090/pb/     │ │
│ └─────────────────┘ │                     │ └─────────────────┘ │
│                     │                     │ ┌─────────────────┐ │
│                     │                     │ │   Backend API   │ │
│                     │                     │ │   :8000/api/    │ │
│                     │                     │ └─────────────────┘ │
└─────────────────────┘                     └─────────────────────┘
```

## 🚀 Deploy no Dokploy

### 1. **Deploy do CoderBot-v2 (Primeiro)**
```bash
# No diretório coderbot-v2
docker compose -f docker-compose.optimized.yml up -d
```
- URL: `https://coderbot.space`
- PocketBase: `https://coderbot.space/pb/`
- Backend API: `https://coderbot.space/api/`

### 2. **Deploy do Chatbot-Teacher (Segundo)**
```bash
# No diretório Chatbot-teacher
cp env.example .env
# Editar .env com URLs corretas (ver seção de configuração)

docker compose up -d
```
- URL: `https://coderbot.shop` (ou outro domínio)

## ⚙️ Configuração

### Arquivo .env
Crie um arquivo `.env` baseado no `env.example`:

```bash
# Para produção (ambos no Dokploy)
VITE_POCKETBASE_URL=https://coderbot.space/pb
VITE_API_URL=https://coderbot.space/api

# Para desenvolvimento local
# VITE_POCKETBASE_URL=http://localhost:8090
# VITE_API_URL=http://localhost:8000
```

### Configuração no Dokploy

#### **CoderBot-v2 (coderbot.space)**
```yaml
Service Name: nginx
Host: coderbot.space
Path: /
Container Port: 80
HTTPS: ✅ Ativado
```

#### **Chatbot-Teacher (coderbot.shop)**
```yaml
Service Name: nginx  # ou chatbot-teacher
Host: coderbot.shop
Path: /
Container Port: 80   # ou 3001 se usar serviço direto
HTTPS: ✅ Ativado
```

## 📋 Opções de Deploy

### **Opção A: Com Nginx (Recomendado)**
```bash
# Usa nginx na porta 80
docker compose up -d
curl https://coderbot.shop/
```

### **Opção B: Serviço Direto**
```bash
# Apenas o serviço na porta 3001
docker compose up chatbot-teacher
# No Dokploy: Container Port = 3001
```

## 🔗 Conectividade

### Requests do Teacher → CoderBot-v2
```typescript
// O frontend do Teacher fará requests para:
const pocketbaseUrl = 'https://coderbot.space/pb'  
const apiUrl = 'https://coderbot.space/api'

// Autenticação PocketBase
await pb.collection('users').authWithPassword(email, password)

// API calls do CoderBot-v2  
const response = await fetch(`${apiUrl}/some-endpoint`)
```

### CORS
O CoderBot-v2 precisa permitir requests do Teacher:
```javascript
// Em coderbot-v2/backend: permitir origem do Teacher
origins = ['https://coderbot.shop']
```

## 🧪 Teste Local

### 1. **Subir CoderBot-v2**
```bash
cd coderbot-v2
docker compose -f docker-compose.optimized.yml up -d
```

### 2. **Subir Chatbot-Teacher**
```bash
cd Chatbot-teacher
cp env.example .env
# Configurar URLs locais no .env
docker compose up -d
```

### 3. **Testar Conectividade**
```bash
# Teacher deve conseguir acessar PocketBase do CoderBot-v2
curl http://localhost:3001/
curl http://localhost:8090/api/health  # PocketBase
```

## 🐛 Troubleshooting

### Problema: Bad Gateway
- ✅ Verificar se CoderBot-v2 está rodando
- ✅ Verificar URLs no .env do Teacher
- ✅ Verificar logs: `docker logs chatbot-teacher`

### Problema: CORS Error
- ✅ Configurar CORS no backend do CoderBot-v2
- ✅ Verificar se URLs estão corretas no Teacher

### Problema: 404 Not Found
- ✅ Verificar nginx config do Teacher
- ✅ Verificar se build do Vite foi feito corretamente

## 📊 Monitoramento

```bash
# Logs do Teacher
docker logs -f chatbot-teacher
docker logs -f chatbot-teacher-nginx

# Status dos serviços
docker ps
docker compose ps

# Health checks
curl -I http://localhost:3001/     # Teacher direto
curl -I http://localhost/          # Teacher via nginx
curl -I http://localhost:8090/api/health  # PocketBase do CoderBot-v2
```

## 🔄 Atualizações

Para atualizar apenas o Teacher:
```bash
cd Chatbot-teacher
docker compose build --no-cache
docker compose up -d
```

Para atualizar o CoderBot-v2:
```bash
cd coderbot-v2  
docker compose -f docker-compose.optimized.yml build --no-cache
docker compose -f docker-compose.optimized.yml up -d
```

## 🎯 Vantagens desta Arquitetura

- ✅ **Deploy independente** - Teacher e CoderBot-v2 separados
- ✅ **Escalabilidade** - Cada serviço pode escalar independentemente  
- ✅ **Manutenção** - Atualizações não afetam o outro sistema
- ✅ **Flexibilidade** - Teacher pode conectar a múltiplas instâncias do CoderBot-v2
- ✅ **Simplicidade** - Cada projeto tem seu próprio docker-compose
