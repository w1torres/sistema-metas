# Sistema de Acompanhamento de Metas — Documentação Completa

**Versão:** 1.0 MVP  
**Status:** Pronto para Etapa 1 (Frontend Protótipo)  
**Data de Criação:** 2026-09-08

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Etapas de Desenvolvimento](#etapas-de-desenvolvimento)
3. [Como Começar (Etapa 1)](#como-começar-etapa-1)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Instruções para Claude Code](#instruções-para-claude-code)
6. [Mockups e Wireframes](#mockups-e-wireframes)
7. [Próximos Passos Após Aprovação](#próximos-passos-após-aprovação)
8. [Checklist de Entrega](#checklist-de-entrega)

---

## 🎯 Visão Geral

### Objetivo
Centralizar o acompanhamento de indicadores e metas por departamento, com permissões granulares (RBAC).

### Usuários Alvo
- **Gerente de RH:** Visualiza e edita indicadores de todos, acompanha progresso
- **Colaborador:** Marca próprios indicadores como concluídos, anexa comprovações

### Escopo Atual (MVP)
- Autenticação via Microsoft Entra ID
- Painel personalizado por usuário
- Marcar indicadores concluídos
- Anexar documentos de comprovação
- Histórico de alterações
- Gráficos básicos (futuro)

---

## 🚀 Etapas de Desenvolvimento

### Etapa 1: Frontend Protótipo ← **VOCÊ ESTÁ AQUI**
| Aspecto | Detalhe |
|--------|---------|
| **Objetivo** | Validar UX/usabilidade com dados mockados |
| **Duração** | 1-2 semanas |
| **Tecnologia** | React 18 + TypeScript + Tailwind + Zustand |
| **Entrega** | Protótipo funcional, dados em JSON estático |
| **Aprovação** | Stakeholders validam fluxo e interface |
| **Local** | Frontend/ |

### Etapa 2: Backend + Persistência
| Aspecto | Detalhe |
|--------|---------|
| **Objetivo** | API real, autenticação, banco de dados |
| **Duração** | 2-3 semanas |
| **Tecnologia** | Node.js + Express + PostgreSQL + JWT |
| **Integração** | Microsoft Graph / Entra ID |
| **Entrega** | API funcional, integrada ao frontend |
| **Local** | Backend/ |

### Etapa 3: Gráficos + Dashboards
| Aspecto | Detalhe |
|--------|---------|
| **Objetivo** | Visualizações de KPIs, relatórios |
| **Duração** | 1-2 semanas |
| **Tecnologia** | Recharts + SQL agregações |
| **Entrega** | Dashboards interativos por perfil |
| **Local** | Frontend + Backend |

---

## 🛠️ Como Começar (Etapa 1)

### Pré-requisitos

```bash
# Verificar versões
node --version          # ≥ 18.x
npm --version          # ≥ 9.x
git --version

# Opcional (para local dev)
docker --version
```

### Inicializar Projeto Frontend

#### Opção 1: Criar do Zero (Recomendado)
```bash
cd frontend

# Criar projeto Vite + React
npm create vite@latest . -- --template react-swc

# Instalar dependências principais
npm install
npm install -D typescript @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer
npm install zustand axios react-router-dom react-hot-toast date-fns

# Configurar Tailwind
npx tailwindcss init -p
```

#### Opção 2: Clone (se iniciado)
```bash
git clone <repo>
cd frontend
npm install
npm run dev
```

### Estrutura Recomendada para Etapa 1

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginScreen.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardColaborador.jsx
│   │   │   ├── DashboardGerenteRH.jsx
│   │   │   └── SummaryCard.jsx
│   │   ├── indicators/
│   │   │   ├── IndicadorCard.jsx
│   │   │   ├── IndicadorList.jsx
│   │   │   ├── EditIndicadorModal.jsx
│   │   │   └── AnexarDocumentoModal.jsx
│   │   ├── charts/
│   │   │   └── BasicCharts.jsx
│   │   └── common/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       └── Spinner.jsx
│   ├── hooks/
│   │   └── useAuth.js
│   │   └── useIndicators.js
│   ├── store/
│   │   ├── authStore.js
│   │   ├── indicatorStore.js
│   │   └── uiStore.js
│   ├── data/
│   │   ├── mockUsers.json
│   │   ├── mockIndicators.json
│   │   └── mockDepartments.json
│   ├── utils/
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

### Rodar Localmente

```bash
cd frontend
npm run dev

# Acesso: http://localhost:5173
```

---

## 📂 Estrutura de Arquivos (Raiz)

```
metas-app/
├── SPECS.md                    # ← Especificação técnica
├── ARCHITECTURE.md             # ← Decisões e padrões
├── DESIGN.md                   # ← UX/UI detalhado
├── README.md                   # ← Este arquivo
│
├── frontend/                   # ← Etapa 1
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── backend/                    # ← Etapa 2 (vazio por enquanto)
│   └── .gitkeep
│
└── docs/                       # ← Adicional (futuro)
    └── API.md
```

---

## 💬 Instruções para Claude Code

### Como Usar Este Projeto em Claude Code

#### Copiar Documentação
1. Copie o conteúdo de `SPECS.md`, `ARCHITECTURE.md` e `DESIGN.md`
2. Cole-os no início da sessão de Claude Code como contexto
3. Referencie seções: *"segundo a SPECS, o indicador deve..."*

#### Scaffolding do Projeto
Peça para Claude Code:

```
"Crie a estrutura de diretórios e os arquivos base para:
- src/components/auth/LoginScreen.jsx (com form de login mock)
- src/store/authStore.js (Zustand)
- src/store/indicatorStore.js (com dados mockados)
- src/utils/constants.js (cores, roles, status)
- src/data/mockIndicators.json (dados exemplo)
- src/App.jsx (roteamento básico)
- tailwind.config.js (configuração)
- .env.example

Siga o design do DESIGN.md para componentes."
```

#### Componentes Prioritários (Ordem)

**Semana 1:**
1. `LoginScreen.jsx` — formulário com botão "Entrar com Microsoft" (mock)
2. `MainLayout.jsx` — header + sidebar + conteúdo
3. `DashboardColaborador.jsx` — lista de indicadores mock
4. `IndicadorCard.jsx` — card individual, checkbox, anexo

**Semana 2:**
5. `DashboardGerenteRH.jsx` — tabela todos os indicadores
6. `EditIndicadorModal.jsx` — edição de nome, peso, responsável
7. `MudarResponsavelModal.jsx` — reatribuição
8. `BasicCharts.jsx` — gráficos básicos (Recharts)

#### Executar Build
```bash
cd frontend
npm run build

# Saída: dist/
# Deploy: upload dist/ para hosting estático (Vercel, Netlify, GitHub Pages)
```

#### Testar Responsividade
```bash
# Abrir DevTools (F12)
# Ctrl+Shift+M (toggle device toolbar)
# Testar mobile (375px), tablet (768px), desktop (1920px)
```

---

## 🎨 Mockups e Wireframes

### Telas Principais (Referência)

#### 1. Login
```
┌─────────────────────────────────────┐
│                                     │
│      SISTEMA DE METAS              │
│                                     │
│  [Microsoft Account Button]         │
│  "Entrar com Microsoft"             │
│                                     │
│  ou                                 │
│                                     │
│  Email: [________________]          │
│  Senha: [________________]          │
│  [Entrar]                           │
│                                     │
└─────────────────────────────────────┘
```

#### 2. Dashboard Colaborador
```
┌─────────────────────────────────────┐
│ Dashboard / Meus Indicadores        │
└─────────────────────────────────────┘

Total: 8 | Concluídos: 3 | Em Andamento: 5

┌──────────────────────────────────┐
│ INDICADOR 1 — Concluído ✓        │
│ 100% ████████████████████        │
│ [Remover Marca] [Anexos]         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ INDICADOR 2 — Em Andamento       │
│ 8% ██░░░░░░░░░░░░░░░░            │
│ ☐ Marcar Concluído               │
│ [+ Anexar Documento]              │
└──────────────────────────────────┘
```

#### 3. Dashboard Gerente RH
```
┌─────────────────────────────────────┐
│ Dashboard Gerencial                 │
│ Total: 42 | Concluído: 18 | Em Prog: 24
└─────────────────────────────────────┘

Filtros: [Departamento ▼] [Status ▼] [Buscar]

┌──────────────────────────────────┐
│ INDICADOR 1                      │
│ Responsável: Marcia              │
│ Departamento: ADMINISTRATIVO     │
│ Peso: 20% | Realização: 0%       │
│ Status: 🟡 Em Andamento          │
│ [Editar] [Mudar Responsável]     │
└──────────────────────────────────┘
```

Consulte **DESIGN.md** para especificações completas.

---

## ✅ Próximos Passos Após Aprovação

Quando protótipo for aprovado, avance para:

### Registrar Aplicação no Entra ID (Microsoft)

```bash
# 1. Acesse https://portal.azure.com
# 2. Vá para "App registrations"
# 3. Crie nova app:
#    - Name: "Metas App"
#    - Account types: Contas da sua organização apenas
#    - Redirect URI: http://localhost:3000/auth/callback
# 4. Copie client_id
# 5. Crie secret, copie valor
# 6. Configure permissões: User.Read (Microsoft Graph)

# Salve em .env:
VITE_MSAL_CLIENT_ID=seu_client_id_aqui
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/seu_tenant_id
```

### Provisionar Banco de Dados

```bash
# Azure Portal: Create PostgreSQL Database
# ou localmente:

docker run --name metas-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:15

# Conectar:
psql -h localhost -U postgres -d metas

# Executar migrations (Etapa 2)
```

### Estrutura para Backend (Etapa 2)

```bash
cd backend
npm init -y
npm install express cors helmet dotenv pg knex jsonwebtoken

# Criar estrutura
mkdir -p src/{routes,controllers,services,repositories,middleware,db}
touch src/server.js src/app.js
```

---

## 📦 Checklist de Entrega

### Etapa 1: Frontend Protótipo
- [ ] Projeto React criado e funcional
- [ ] Componentes construídos (ver lista acima)
- [ ] Dados mockados em JSON
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Validações de entrada (Joi/custom)
- [ ] Fluxo completo funcionando
- [ ] Sem erros de console
- [ ] Build `npm run build` sem warnings
- [ ] Apresentação para stakeholders
- [ ] **Aprovação de UX/Negócio** ✓

### Etapa 2: Backend + Persistência
- [ ] Node.js + Express setup
- [ ] PostgreSQL provisionado
- [ ] Migrations executadas
- [ ] Autenticação Entra ID implementada
- [ ] CRUD indicadores com RBAC
- [ ] Upload de anexos
- [ ] Auditoria (`indicador_updates`)
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Documentação API (OpenAPI/Swagger)
- [ ] Deploy staging

### Etapa 3: Gráficos + Produção
- [ ] Gráficos no frontend (Recharts)
- [ ] Endpoints de relatórios no backend
- [ ] Dashboard KPIs
- [ ] Exportação CSV
- [ ] Notificações por email (opcional)
- [ ] Logging/Monitoring
- [ ] Security review (pentest)
- [ ] **Deploy produção** ✓

---

## 🔗 Referências Rápidas

### Documentação
- **SPECS.md** — Requisitos completos e modelo de dados
- **ARCHITECTURE.md** — Decisões técnicas e padrões
- **DESIGN.md** — UX/UI detalhado
- **README.md** — Este arquivo

### Bibliotecas Principais
- [React 18 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Recharts](https://recharts.org)
- [React Router](https://reactrouter.com)

### Ferramentas
- [Vite](https://vitejs.dev) — Build tool
- [Vitest](https://vitest.dev) — Testing (opcional Etapa 2)
- [Prettier](https://prettier.io) — Code formatter
- [ESLint](https://eslint.org) — Linter

---

## 📞 Suporte e Dúvidas

### Documentação Localizada
Para dúvidas sobre:
- **Requisitos:** Consulte `SPECS.md` seção 4-7
- **Design:** Consulte `DESIGN.md` seção 5-7
- **Implementação:** Consulte `ARCHITECTURE.md` seção 6-8

### Padrões a Seguir

#### Componentes React
```javascript
// ✅ BOM
export default function IndicadorCard({ indicador, onComplete }) {
  return (
    <div className="p-4 border rounded-lg">
      <h3>{indicador.nome}</h3>
      <input type="checkbox" onChange={() => onComplete(indicador.id)} />
    </div>
  );
}

// ❌ EVITAR
function IndicadorCard(props) {
  const [data, setData] = useState([]);
  useEffect(() => { /*...*/ }, []);
  // inline styling
  return <div style={{ color: 'blue' }}>...</div>;
}
```

#### Store (Zustand)
```javascript
// ✅ BOM
export const useIndicatorStore = create((set) => ({
  indicators: [],
  setIndicators: (data) => set({ indicators: data }),
  reset: () => set({ indicators: [] })
}));

// ❌ EVITAR
export const store = {
  state: { indicators: [] },
  methods: { setIndicators() {} }
};
```

#### CSS (Tailwind)
```html
<!-- ✅ BOM -->
<button class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
  Entrar
</button>

<!-- ❌ EVITAR -->
<button style="padding: 8px 16px; background-color: #0D6EFD;">
  Entrar
</button>
```

---

## 🎯 Métricas de Sucesso (Etapa 1)

| Métrica | Alvo | Verificação |
|---------|------|-------------|
| **Tempo de Load** | < 2s | DevTools / Lighthouse |
| **Performance Score** | ≥ 80 | Lighthouse |
| **Responsividade** | ✓ em 3 breakpoints | Manual test ou Cypress |
| **Acessibilidade** | A11y ≥ 80 | Axe DevTools |
| **Funcionalidade** | 100% das telas | User acceptance test |
| **Sem Erros** | 0 console errors | DevTools Console |

---

## 📋 Instruções Finais para Claude Code

### Iniciar Sessão

```
Você está construindo a ETAPA 1 (Frontend) de um 
Sistema de Acompanhamento de Metas.

Contexto:
- Ler SPECS.md para requisitos
- Ler ARCHITECTURE.md para decisões técnicas
- Ler DESIGN.md para UX/UI
- Stack: React 18 + TypeScript + Tailwind + Zustand

Objetivo: Criar protótipo funcional com dados mockados
para aprovação de stakeholders.

Comece scaffolding do projeto e implemente componentes
na ordem de prioridade (ver README.md > Instruções).

Pergunte se tiver dúvidas sobre requisitos.
```

### Comandos Úteis

```bash
# Dev
npm run dev              # Rodar localmente
npm run lint             # ESLint
npm run format           # Prettier

# Build
npm run build            # Build otimizado
npm run preview          # Preview build local

# Testes (Etapa 2+)
npm run test             # Jest
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

---

## 📄 Versão do Documento

| Versão | Data | Alterações |
|--------|------|-----------|
| 1.0 | 2026-09-08 | Criação inicial — Etapa 1 completa |

---

**Pronto para começar? Execute:**
```bash
cd frontend
npm install
npm run dev
```

Boa sorte! 🚀

---

*Dúvidas ou sugestões? Consulte a documentação ou inicie uma nova sessão de Claude Code com este README como contexto.*
