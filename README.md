# PingNote

Aplicação web para partilha instantânea de notas entre dispositivos, com foco em velocidade, simplicidade e privacidade.

## ✨ Funcionalidades

- 📝 **Criar notas** - Escreve e partilha texto instantaneamente
- 🔗 **Links únicos** - Cada nota tem um URL único e seguro
- 📱 **QR Codes** - Digitaliza para abrir no telemóvel em 1 segundo
- 🔢 **Códigos curtos** - 6 caracteres fáceis de digitar (ex: `AB3K9Q`)
- ⏱️ **Expiração automática** - 5 min, 10 min, 1h ou 24h
- 🔥 **Leitura única** - Nota apagada após primeira visualização
- 🔐 **Encriptação E2EE** - Servidor nunca vê o conteúdo
- 📡 **Tempo real** - Atualizações instantâneas (live mode)

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- npm

### Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Iniciar em modo desenvolvimento
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) no browser.

## 🛠️ Stack Técnica

| Tecnologia | Uso |
|------------|-----|
| Next.js 15 | Framework React com App Router |
| TypeScript | Tipagem estática |
| TailwindCSS 4 | Estilos |
| Redis / In-memory | Armazenamento (auto-detecta) |
| Web Crypto API | Encriptação E2EE |
| qrcode.react | Geração de QR codes |

## 🚀 Deploy no Railway

### 1. Criar projeto no Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
railway init
```

### 2. Adicionar Redis
- No dashboard do Railway, clique em "New" → "Database" → "Redis"
- A variável `REDIS_URL` será adicionada automaticamente

### 3. Deploy
```bash
# Deploy direto
railway up

# Ou via Git (recomendado)
git push railway main
```

### Variáveis de ambiente necessárias:
| Variável | Descrição |
|----------|-----------|
| `REDIS_URL` | URL do Redis (Railway adiciona automaticamente) |

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── notes/        # CRUD de notas
│   │   ├── code/         # Resolução de códigos curtos
│   │   └── live/         # SSE para tempo real
│   ├── n/[token]/        # Página de visualização
│   ├── c/                # Página de inserção de código
│   └── about/            # Informações
├── components/
│   └── ui/               # Componentes reutilizáveis
└── lib/
    ├── storage/          # Camada de armazenamento (Redis/Memory)
    ├── tokens.ts         # Geração de tokens/códigos
    ├── crypto.ts         # Encriptação E2EE
    └── types.ts          # Tipos TypeScript
```

## 🔒 Segurança

- **Tokens**: 21 caracteres (~128 bits de entropia)
- **Códigos curtos**: 6 caracteres sem ambíguos (0/O, 1/I/l)
- **E2EE**: AES-256-GCM, chave no fragmento do URL (`#key=...`)
- **Headers**: X-Frame-Options, X-Content-Type-Options, CSP

## 📡 API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/notes` | Criar nota |
| GET | `/api/notes/:token` | Obter nota |
| DELETE | `/api/notes/:token` | Apagar nota |
| GET | `/api/code/:code` | Resolver código |
| GET | `/api/live/:token` | SSE tempo real |

## 🧪 Testes

```bash
# Testes unitários (30 testes)
npm run test

# Testes E2E
npm run test:e2e
```

## 📄 Licença

MIT

