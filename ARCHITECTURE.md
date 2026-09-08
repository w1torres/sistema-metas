# Arquitetura Técnica — Sistema de Acompanhamento de Metas

## 1. Visão Geral da Arquitetura

### Padrão: N-Tier (Frontend → Backend → Banco)

```
┌────────────────────────────────────────────────────────────┐
│ CLIENTE (React + TypeScript)                               │
│ ├─ Components (UI)                                         │
│ ├─ Services (HTTP Client)                                  │
│ ├─ Store (Context API / Zustand)                          │
│ └─ Utils (formatação, validação)                          │
└────────────────────────────────────────────────────────────┘
          ↓ HTTPS REST API ↓
┌────────────────────────────────────────────────────────────┐
│ API GATEWAY (Node.js + Express)                            │
│ ├─ Controllers (rotas, validação)                          │
│ ├─ Middleware (auth, CORS, logging)                        │
│ ├─ Services (lógica de negócio)                            │
│ ├─ Repositories (abstração BD)                             │
│ └─ Utils (JWT, crypto, validators)                        │
└────────────────────────────────────────────────────────────┘
          ↓ SQL Queries ↓
┌────────────────────────────────────────────────────────────┐
│ POSTGRESQL (Banco de Dados)                                │
│ ├─ Tables (users, indicators, attachments, etc)           │
│ ├─ Indexes (performance)                                   │
│ ├─ Triggers (auditoria)                                    │
│ └─ Roles (segurança)                                       │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Técnico Detalhado

### Frontend (React)

```json
{
  "name": "metas-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.20.0",
    "axios": "1.6.0",
    "@microsoft/msal-react": "2.29.0",
    "@microsoft/msal-browser": "2.33.0",
    "zustand": "4.4.1",
    "recharts": "2.10.0",
    "react-hot-toast": "2.4.1",
    "clsx": "2.0.0",
    "date-fns": "2.30.0"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "@types/react": "18.2.0",
    "vite": "5.0.0",
    "tailwindcss": "3.4.0",
    "postcss": "8.4.32",
    "autoprefixer": "10.4.16"
  }
}
```

**Justificativa:**
- **React:** Componentes declarativos, comunidade vasta
- **React Router:** SPA routing sem necessidade de backend MPA
- **MSAL:** Autenticação Microsoft nativa
- **Zustand:** Estado global leve (alternativa ao Redux)
- **Recharts:** Gráficos declarativos (vs Chart.js)
- **Tailwind:** CSS utilities para responsividade rápida
- **Vite:** Build rápido, dev server eficiente

---

### Backend (Node.js)

```json
{
  "name": "metas-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "4.18.2",
    "dotenv": "16.3.1",
    "pg": "8.11.0",
    "knex": "3.1.0",
    "jsonwebtoken": "9.1.2",
    "bcryptjs": "2.4.3",
    "@microsoft/microsoft-graph-client": "3.0.0",
    "multer": "1.4.5",
    "cors": "2.8.5",
    "helmet": "7.1.0",
    "winston": "3.11.0",
    "joi": "17.11.0",
    "uuid": "9.0.1"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "@types/express": "4.17.21",
    "@types/node": "20.10.5",
    "nodemon": "3.0.2",
    "jest": "29.7.0",
    "@types/jest": "29.5.11"
  }
}
```

**Justificativa:**
- **Express:** Minimalista, roteamento direto, middleware simples
- **Knex:** Query builder (preparado para Etapa 2, não ORM pesado)
- **JWT:** Stateless authentication (sem sessão server)
- **MSAL:** Integração com Microsoft Graph
- **Multer:** Upload de arquivos
- **Helmet:** Headers de segurança HTTP
- **Winston:** Logging estruturado
- **Joi:** Validação de entrada robusta

---

## 3. Estrutura de Pastas — Projeto Completo

### Raiz do Projeto
```
metas-app/
├── frontend/                           # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── EntraIdLogin.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── MainLayout.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardColaborador.jsx
│   │   │   │   ├── DashboardGerenteRH.jsx
│   │   │   │   └── SummaryCard.jsx
│   │   │   ├── indicators/
│   │   │   │   ├── IndicadorCard.jsx
│   │   │   │   ├── IndicadorList.jsx
│   │   │   │   ├── EditIndicadorModal.jsx
│   │   │   │   └── AnexarDocumentoModal.jsx
│   │   │   ├── charts/
│   │   │   │   ├── LineChart.jsx
│   │   │   │   ├── PieChart.jsx
│   │   │   │   └── KPIDashboard.jsx
│   │   │   └── common/
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Toast.jsx
│   │   │       └── Spinner.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useIndicators.js
│   │   │   └── useFetch.js
│   │   ├── services/
│   │   │   ├── api.js                 # axios instance + baseURL
│   │   │   ├── authService.js         # MSAL + JWT
│   │   │   ├── indicatorService.js    # CRUD indicators
│   │   │   ├── attachmentService.js   # upload files
│   │   │   └── chartService.js        # dados para gráficos
│   │   ├── store/
│   │   │   ├── authStore.js           # Zustand: user, token, role
│   │   │   ├── indicatorStore.js      # Zustand: lista, filtros
│   │   │   └── uiStore.js             # Zustand: modais, toasts
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   ├── formatters.js
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── variables.css
│   │   │   └── responsive.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example                   # VITE_MSAL_CLIENT_ID, etc
│
├── backend/                            # Node.js app
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── indicators.js
│   │   │   ├── users.js
│   │   │   ├── attachments.js
│   │   │   └── reports.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── indicatorController.js
│   │   │   ├── userController.js
│   │   │   ├── attachmentController.js
│   │   │   └── reportController.js
│   │   ├── services/
│   │   │   ├── authService.js         # JWT, MSAL verification
│   │   │   ├── indicatorService.js    # lógica, regras
│   │   │   ├── userService.js
│   │   │   ├── attachmentService.js   # S3 ou storage local
│   │   │   ├── emailService.js        # notificações
│   │   │   └── reportService.js       # agregações
│   │   ├── repositories/
│   │   │   ├── userRepository.js
│   │   │   ├── indicatorRepository.js
│   │   │   ├── attachmentRepository.js
│   │   │   ├── auditLogRepository.js
│   │   │   └── departmentRepository.js
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT validation
│   │   │   ├── rbac.js                # role check
│   │   │   ├── errorHandler.js
│   │   │   ├── validator.js           # Joi middleware
│   │   │   ├── corsConfig.js
│   │   │   └── logging.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   ├── cryptoUtil.js
│   │   │   ├── logger.js
│   │   │   ├── constants.js
│   │   │   └── errors.js
│   │   ├── db/
│   │   │   ├── connection.js          # pg pool
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users.sql
│   │   │   │   ├── 002_create_departments.sql
│   │   │   │   ├── 003_create_indicators.sql
│   │   │   │   ├── 004_create_attachments.sql
│   │   │   │   └── 005_create_audit_logs.sql
│   │   │   └── seeds/
│   │   │       ├── departments.sql
│   │   │       └── users.sql
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── entraId.js
│   │   │   ├── storage.js
│   │   │   └── email.js
│   │   ├── app.js                     # Express app setup
│   │   └── server.js                  # Entry point
│   ├── .env.example
│   ├── package.json
│   ├── docker-compose.yml             # local dev: PG + Redis
│   └── Dockerfile
│
├── docs/
│   ├── SPECS.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── API.md                         # Referência de endpoints
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
│
├── docker-compose.yml                 # orchestração dev
├── .gitignore
└── README.md
```

---

## 4. Fluxo de Dados (State Management)

### Frontend (Zustand)

#### Auth Store
```javascript
// store/authStore.js
const useAuthStore = create((set) => ({
  user: null,        // { id, nome, email, role, departamento_id }
  token: null,       // JWT
  isLoading: false,
  login: async (msalToken) => {
    // valida com backend, recebe JWT
  },
  logout: () => {},
  setUser: (user) => {},
  setToken: (token) => {}
}));
```

#### Indicator Store
```javascript
// store/indicatorStore.js
const useIndicatorStore = create((set) => ({
  indicators: [],    // lista completa ou filtrada
  filters: {
    status: null,
    departamento: null,
    responsavel: null
  },
  loading: false,
  fetchIndicators: async (params) => {},
  updateIndicator: async (id, data) => {},
  deleteIndicator: async (id) => {},
  setFilters: (newFilters) => {}
}));
```

### Backend (Express + Repository Pattern)

```
Request → Middleware (Auth, CORS, Validation)
  ↓
Route Handler
  ↓
Controller (extrai params, chama service)
  ↓
Service (lógica de negócio, regras)
  ↓
Repository (abstração de BD)
  ↓
PostgreSQL Query
  ↓
Response (JSON)
```

---

## 5. Fluxo de Autenticação

### Microsoft Entra ID + JWT

```
Frontend (React)
  ↓
[usuário clica "Entrar com Microsoft"]
  ↓
MSAL (@microsoft/msal-react)
  ↓
Redirecionam para login.microsoftonline.com
  ↓
Usuário faz login
  ↓
Retorna access_token (Microsoft Graph)
  ↓
Frontend envia para backend: POST /api/auth/login { token_msal }
  ↓
Backend
  ├─ valida token_msal com Microsoft Graph
  ├─ extrai user info: email, nome, oid
  ├─ procura usuário em BD por email/oid
  ├─ se não existe: cria usuário com role COLABORADOR
  ├─ gera JWT próprio (assinado com SECRET)
  └─ retorna { token_jwt, user { id, nome, role } }
  ↓
Frontend
  ├─ armazena JWT em localStorage
  ├─ seta Authorization header: "Bearer {token_jwt}"
  └─ redireciona para /dashboard
  ↓
Próximas requisições
  ├─ todas incluem: Authorization: Bearer {token_jwt}
  ├─ backend valida JWT
  ├─ extrai user_id e role do payload
  └─ processa requisição com permissões checadas
```

**Vantagens:**
- ✅ Sem manutenção de senhas
- ✅ Já integrado ao AD corporativo
- ✅ JWT stateless (sem sessão server)
- ✅ Escalável

---

## 6. Padrões de Código

### Frontend — Componente com Hook

```javascript
// components/dashboard/DashboardColaborador.jsx
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import IndicadorCard from '../indicators/IndicadorCard';
import Spinner from '../common/Spinner';

export default function DashboardColaborador() {
  const { user } = useAuthStore();
  const { indicators, loading, fetchIndicators } = useIndicatorStore();

  useEffect(() => {
    if (user) {
      fetchIndicators({ usuario_id: user.id });
    }
  }, [user]);

  if (loading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {indicators.map((ind) => (
        <IndicadorCard key={ind.id} indicador={ind} />
      ))}
    </div>
  );
}
```

### Backend — Controller + Service + Repository

```javascript
// controllers/indicatorController.js
export async function updateIndicator(req, res, next) {
  try {
    const { id } = req.params;
    const { user } = req.auth;  // do middleware JWT
    const { nome, peso, status } = req.body;

    // validação
    const { error, value } = Joi.object({
      nome: Joi.string().min(10),
      peso: Joi.number().min(0).max(100),
      status: Joi.string().valid('EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO')
    }).validate({ nome, peso, status });

    if (error) return res.status(400).json({ error: error.details[0].message });

    // chamar service (lógica)
    const updated = await indicatorService.updateIndicator(id, value, user);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// services/indicatorService.js
export async function updateIndicator(indicadorId, data, user) {
  // regra: somente Gerente RH pode editar
  if (user.role !== 'GERENTE_RH') {
    throw new ForbiddenError('Apenas Gerente RH pode editar indicadores');
  }

  // chamar repository
  const updated = await indicatorRepository.update(indicadorId, data);

  // registrar auditoria
  await auditLogRepository.create({
    indicador_id: indicadorId,
    usuario_id: user.id,
    tipo_alteracao: 'EDICAO',
    valor_anterior: {/*...*/},
    valor_novo: data
  });

  return updated;
}

// repositories/indicatorRepository.js
export async function update(id, data) {
  const result = await db('indicadores')
    .where({ id })
    .update({
      ...data,
      atualizado_em: new Date()
    })
    .returning('*');

  return result[0];
}
```

---

## 7. Decisões Arquiteturais (ADRs)

### ADR-001: React vs. Vue vs. Angular
**Decisão:** React  
**Racional:**
- Comunidade maior
- Ecossistema maduro
- Ferramentas (Create React App → Vite)
- Familiar para maioria dos devs JS

**Trade-offs:**
- Mais boilerplate que Vue
- Menos opinionated que Angular

---

### ADR-002: Zustand vs. Redux vs. Context API
**Decisão:** Zustand  
**Racional:**
- Menos boilerplate que Redux
- Mais robusto que Context API
- Performance melhor que Context

**Trade-offs:**
- Comunidade menor que Redux
- DevTools não tão rico

---

### ADR-003: Express vs. Fastify vs. Koa
**Decisão:** Express  
**Racional:**
- Mais maduro
- Comunidade vasta
- Ecossistema middleware robusto

**Trade-offs:**
- Performance inferior a Fastify
- Menos moderno que Koa

---

### ADR-004: Knex vs. TypeORM vs. Prisma
**Decisão:** Knex (Query Builder, não ORM)  
**Racional:**
- Controle fino sobre queries
- Sem "magic" do ORM
- Fácil fazer queries complexas
- Migrations built-in

**Trade-offs:**
- Mais verbose que ORM
- Sem type-safety (até TypeScript)

---

### ADR-005: JWT vs. Sessions
**Decisão:** JWT  
**Racional:**
- Stateless (sem server-side session store)
- Escalável (múltiplos servidores)
- Padrão para APIs REST

**Trade-offs:**
- Logout não é imediato (token válido até expiração)
- Tamanho maior de payload (vs session ID)

**Mitigação:** TTL 1 hora, implementar blacklist se necessário

---

### ADR-006: Banco de Dados PostgreSQL vs. MySQL vs. MongoDB
**Decisão:** PostgreSQL  
**Racional:**
- ACID garantido
- Índices B-tree eficientes
- JSON/JSONB para dados semi-estruturados
- Triggers para auditoria
- Melhor para dados relacionais (users → indicators)

**Trade-offs:**
- Mais overhead que SQLite
- Menos schemaless que MongoDB

---

## 8. Segurança Detalhada

### Validação em Três Camadas

```
Camada 1 (Frontend)
├─ Validação de input (Joi, React Hook Form)
└─ Não confiar apenas nisto

Camada 2 (Middleware Backend)
├─ JWT validation
├─ Role check (RBAC)
└─ Input validation (Joi schema)

Camada 3 (Service/Repository)
├─ Regra de negócio (ex: pode só editar próprio?)
├─ Sanitização de SQL (prepared statements)
└─ Criptografia de dados sensíveis
```

### Secrets Management

```javascript
// backend/.env (nunca commit)
DATABASE_URL=postgresql://user:pass@localhost/metas
JWT_SECRET=super_secret_key_change_in_prod
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
STORAGE_S3_BUCKET=my-bucket
STORAGE_S3_REGION=us-east-1
```

**Em Produção:**
- Azure Key Vault
- GitHub Secrets (CI/CD)
- Variáveis de ambiente (AppService)

### Headers de Segurança (Helmet)

```javascript
app.use(helmet());
// Implementa:
// - Strict-Transport-Security
// - X-Content-Type-Options
// - X-Frame-Options
// - Content-Security-Policy
// - Etc.
```

### CORS

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
```

---

## 9. Performance e Escalabilidade

### Índices PostgreSQL

```sql
-- Para queries frequentes
CREATE INDEX idx_indicators_usuario_id ON indicadores(usuario_responsavel_id);
CREATE INDEX idx_indicators_status ON indicadores(status);
CREATE INDEX idx_indicators_departamento_id ON indicadores(departamento_id);
CREATE INDEX idx_indicators_criado_em ON indicadores(criado_em DESC);
CREATE INDEX idx_audit_logs_indicador_id ON indicador_updates(indicador_id);
```

### Cache (Opcional — Etapa 3)

```javascript
// Redis para dados que mudam pouco
const userCache = await redis.get(`user:${userId}`);
if (!userCache) {
  const user = await userRepository.findById(userId);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user)); // 1h
}
```

### Paginação

```javascript
// GET /api/indicators?page=1&limit=25
async function list(page = 1, limit = 25) {
  const offset = (page - 1) * limit;
  const [data, total] = await Promise.all([
    db('indicadores').limit(limit).offset(offset),
    db('indicadores').count('* as count')
  ]);
  
  return {
    data,
    total: total[0].count,
    page,
    limit,
    pages: Math.ceil(total[0].count / limit)
  };
}
```

---

## 10. Testes (Etapa 2)

### Frontend — Jest + React Testing Library

```javascript
// __tests__/components/indicators/IndicadorCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import IndicadorCard from '../../../components/indicators/IndicadorCard';

describe('IndicadorCard', () => {
  it('renderiza nome e peso do indicador', () => {
    const indicador = { id: '1', nome: 'Teste', peso: 20, atendimento: 50 };
    render(<IndicadorCard indicador={indicador} />);
    
    expect(screen.getByText('Teste')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('chama callback ao marcar concluído', () => {
    const mockCallback = jest.fn();
    const indicador = { id: '1', nome: 'Teste', peso: 20, atendimento: 50 };
    
    render(<IndicadorCard indicador={indicador} onComplete={mockCallback} />);
    fireEvent.click(screen.getByRole('checkbox'));
    
    expect(mockCallback).toHaveBeenCalledWith('1');
  });
});
```

### Backend — Jest + Supertest

```javascript
// __tests__/routes/indicators.test.js
const request = require('supertest');
const app = require('../app');

describe('POST /api/indicators', () => {
  it('cria novo indicador com dados válidos', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        nome: 'Novo Indicador',
        peso: 20,
        departamento_id: '123'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .send({ nome: 'Teste' });

    expect(response.statusCode).toBe(401);
  });

  it('retorna 403 se colaborador', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${colaboradorToken}`)
      .send({ nome: 'Teste', peso: 20 });

    expect(response.statusCode).toBe(403);
  });
});
```

---

## 11. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install & Test Frontend
        run: |
          cd frontend
          npm install
          npm run test
          npm run build
      
      - name: Install & Test Backend
        run: |
          cd backend
          npm install
          npm run test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: success()
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend (Vercel)
        run: npm install -g vercel && vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Backend (Azure AppService)
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'metas-api'
          package: ./backend
```

---

## 12. Monitoramento (Produção)

### Logging (Winston)

```javascript
// backend/utils/logger.js
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// uso
logger.info('Indicador criado', { indicador_id: '123', usuario_id: '456' });
logger.error('Erro ao salvar', { error: err.message });
```

### Observabilidade (opcional — Etapa 3)

- **Application Insights** (Azure) — traces, metrics
- **Sentry** — error tracking
- **DataDog** — APM (Application Performance Monitoring)

---

## 13. Roadmap de Arquitetura

### Etapa 1 (Atual): MVP Mínimo
- [x] Frontend protótipo (React + Zustand)
- [x] Dados mockados
- [x] Design responsivo
- [x] Validação UX

### Etapa 2: Backend Real
- [ ] Node.js + Express + PostgreSQL
- [ ] Autenticação Microsoft Entra ID
- [ ] Persistência de dados
- [ ] Testes unitários
- [ ] Deploy staging

### Etapa 3: Produção + Features
- [ ] Gráficos/Dashboards avançados
- [ ] Relatórios em PDF
- [ ] Notificações por email
- [ ] Cache (Redis)
- [ ] Monitoring/Logging
- [ ] Mobile responsivo otimizado

### Etapa 4: Otimizações (Futura)
- [ ] GraphQL (alternativa REST)
- [ ] WebSockets (real-time updates)
- [ ] Kubernetes (escalabilidade)
- [ ] Microserviços (se crescer)

---

## 14. Considerações Finais

| Aspecto | Abordagem |
|--------|-----------|
| **Complexidade** | Baixa (N-tier simples) |
| **Time Size** | 2-3 devs |
| **Escalabilidade** | até 10k usuários ativos |
| **Manutenibilidade** | Alta (padrões claros) |
| **Time-to-market** | 4-7 semanas |
| **Custo de Deploy** | Baixo (Azure/Docker) |

---

**Documento versão:** 1.0  
**Última atualização:** 2026-09-08
