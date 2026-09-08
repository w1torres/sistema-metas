# ⚡ Quick Start — Sistema de Metas (Claude Code)

**Objetivo:** Implementar a ETAPA 1 (Frontend Protótipo) em 1-2 semanas.

---

## 🎯 O Que Construir (Resumo)

**App React**: Dashboard de metas com 2 perfis (Gerente de RH + Colaborador)
- Autenticação (mock com formulário simples)
- Lista de indicadores (dados JSON estático)
- Marcar indicador como concluído
- Anexar documento
- Histórico
- Gráficos básicos

**Usuários:** até 200 (não simultâneos)  
**Stack:** React 18 + Tailwind + Zustand + Recharts  
**Aprovação:** Protótipo valida UX antes de Backend

---

## 📋 Documentação (Leia Primeiro)

1. **SPECS.md** — Requisitos e modelo de dados
2. **DESIGN.md** — Layout, cores, componentes
3. **ARCHITECTURE.md** — Padrões de código (se quiser referência)
4. **MOCK_DATA.json** — Dados de exemplo para mockup

---

## 🚀 Iniciar Projeto (5 Passos)

### 1️⃣ Criar Projeto React

```bash
cd frontend

# Opção A: Do zero com Vite
npm create vite@latest . -- --template react-swc

# Opção B: Clonar repo existente
# git clone <repo> && cd frontend

npm install
```

### 2️⃣ Instalar Dependências Essenciais

```bash
npm install zustand axios react-router-dom react-hot-toast date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3️⃣ Copiar Estrutura de Pastas

```
src/
├── components/
│   ├── auth/
│   ├── layout/
│   ├── dashboard/
│   ├── indicators/
│   ├── charts/
│   └── common/
├── store/
├── data/
├── utils/
├── styles/
└── App.jsx
```

**Peça para Claude Code criar essa estrutura.**

### 4️⃣ Copiar MOCK_DATA.json para `src/data/`

```bash
cp MOCK_DATA.json src/data/mockData.json
```

### 5️⃣ Rodar Projeto

```bash
npm run dev
```

Acesso: `http://localhost:5173`

---

## 📝 Componentes por Prioridade

### Semana 1: Core Essencial

#### 1. **LoginScreen.jsx**
```
┌────────────────────────────────────┐
│ SISTEMA DE METAS                  │
│                                    │
│ Email: [____________________]      │
│ Senha: [____________________]      │
│                                    │
│ Sou: ○ Gerente RH  ○ Colaborador  │
│                                    │
│ [Entrar]                          │
└────────────────────────────────────┘
```

**O que faz:**
- Form simples (email + senha fake)
- Ao entrar: salva role + user no Zustand
- Redireciona para dashboard baseado em role

#### 2. **MainLayout.jsx**
```
┌──────────────────────────────────┐
│ HEADER [Logo] [User ▼] [Logout]  │
├───────────┬──────────────────────┤
│ SIDEBAR   │ CONTENT              │
│ • Dashboard                      │
│ • Meus Indicadores              │
│ • Relatórios (GM)               │
│           │                      │
│           │ [componente aqui]   │
│           │                      │
└───────────┴──────────────────────┘
```

**O que faz:**
- Layout base com header + sidebar
- Navegação entre páginas
- Display do usuário logado

#### 3. **DashboardColaborador.jsx**
- Mostra resumo: Total, Concluídos, Em Andamento
- Lista de IndicadorCard
- Filtra por status (opcional)

#### 4. **IndicadorCard.jsx**
```
┌──────────────────────────────────┐
│ INDICADOR 1                       │
│ Realização: 100% ████████████    │
│ ✓ Concluído em 05/09/2026       │
│                                  │
│ [Remover Marca] [Anexos] [Editar]│
└──────────────────────────────────┘

ou (em andamento):

┌──────────────────────────────────┐
│ INDICADOR 2                       │
│ Realização: 8% ██░░░░░░░░░░░░░░ │
│                                  │
│ ☐ Marcar Concluído              │
│ [+ Anexar Documento]             │
└──────────────────────────────────┘
```

**O que faz:**
- Mostra nome, peso, % realizado
- Checkbox (marcar/desmarcar)
- Botão anexo
- Card responsivo

---

### Semana 2: Features Adicionais

#### 5. **DashboardGerenteRH.jsx**
- Tabela/grid de TODOS os indicadores
- Filtros: departamento, status, responsável
- Botão "Novo Indicador", "Editar", "Mudar Responsável"

#### 6. **EditIndicadorModal.jsx**
```
┌─────────────────────────────────┐
│ Editar Indicador           [x]   │
├─────────────────────────────────┤
│ Nome: [____________________]     │
│ Peso: [__] %                    │
│ Status: [Em Andamento ▼]        │
│ Objetivo: [_________]           │
│ Data Fim: [__/__/____]          │
│                                 │
│ [Cancelar]         [Salvar]     │
└─────────────────────────────────┘
```

#### 7. **MudarResponsavelModal.jsx**
```
┌─────────────────────────────────┐
│ Reatribuir Indicador       [x]   │
├─────────────────────────────────┤
│ Responsável Atual: Marcia       │
│                                 │
│ Novo Responsável:               │
│ [Procurar: __________]          │
│   ○ João Santos                 │
│   ○ Ana Costa                   │
│   ○ Pedro Oliveira              │
│                                 │
│ [Cancelar]    [Reatribuir]      │
└─────────────────────────────────┘
```

#### 8. **BasicCharts.jsx**
- Gráfico de pizza: Concluído vs Em Andamento
- Gráfico de linha: Realização ao longo dos meses (fake data)
- Gráfico de barras: Por departamento

**Use Recharts:**
```jsx
import { PieChart, LineChart, BarChart } from 'recharts';

<PieChart width={300} height={300}>
  <Pie data={data} dataKey="value" />
</PieChart>
```

---

## 📊 Fluxo Prototípico

```
1. LOGIN
   Email: "marcia@empresa.com"
   Senha: "qualquer"
   Role: Colaborador
   ↓
2. DASHBOARD COLABORADOR
   [Resumo de metas]
   [Lista de indicadores com checkbox]
   ↓
3. MARCAR INDICADOR
   ☐ Clica em checkbox
   ✓ Indicador marca como concluído
   ↓
4. ANEXAR DOCUMENTO
   [+ Anexar]
   → Modal simples (simula upload, não faz upload real)
   ↓
5. VER HISTÓRICO
   → Mostra quando foi concluído, quem anexou
   ↓
---
LOGOUT → volta para LOGIN
```

---

## 🛠️ Instruções para Claude Code

### Sessão 1: Scaffolding

```
"Crie a estrutura base do projeto React com:

1. src/components/ com subdiretorios (auth, layout, dashboard, etc)
2. src/store/ com authStore.js e indicatorStore.js (Zustand)
3. src/data/ com mockData.json (use MOCK_DATA.json como referência)
4. src/utils/ com constants.js (cores, roles, status)
5. src/App.jsx com React Router
6. tailwind.config.js

Use TypeScript se possível.
Inclua comentários explicativos.
Sem erros, sem warnings no npm run dev."
```

### Sessão 2: LoginScreen + MainLayout

```
"Implementar:

1. LoginScreen.jsx
   - Form: email, senha, selector de role
   - Ao entrar: salva user e role no authStore (Zustand)
   - Redireciona para /dashboard

2. MainLayout.jsx
   - Header: logo + user name + logout button
   - Sidebar: navegação baseada em role
     * Colaborador: Dashboard, Meus Indicadores
     * Gerente: Dashboard, Todos Indicadores, Relatórios
   - Conteúdo responsivo

3. ProtectedRoute.jsx
   - Verifica se user está autenticado
   - Redireciona para login se não

Use Tailwind CSS.
Cores do DESIGN.md (azul #0D6EFD, verde sucesso #198754, etc)."
```

### Sessão 3: Indicadores (Colaborador)

```
"Implementar:

1. DashboardColaborador.jsx
   - Mostra: Total, Concluídos, Em Andamento (badges)
   - Lista de IndicadorCard com paginação (3-5 cards)
   - Filtro por status (opcional)

2. IndicadorCard.jsx
   - Mostra: nome, peso, realização (%)
   - Se concluído:
     * ✓ Concluído em [data]
     * Botão [Remover Marca]
   - Se em andamento:
     * ☐ Checkbox 'Marcar Concluído'
     * Botão [+ Anexar Documento]
   - Botão [Ver Histórico]

Dados vêm de indicatorStore (Zustand).
Ao marcar checkbox: atualiza store (sem backend).
Card responsivo (mobile + desktop)."
```

### Sessão 4: Modal e Histórico

```
"Implementar:

1. AnexarDocumentoModal.jsx
   - Input file (tipos: PDF, DOC, DOCX, JPG, PNG)
   - Campo descricao (opcional)
   - Botão [Anexar] - simula upload (não faz POST real)
   - Mostra lista de anexos anteriores

2. HistoricoModal.jsx
   - Lista de eventos: 
     * 'Concluído em 05/09/2026'
     * 'Anexo adicionado: arquivo.pdf'
   - Timestamps
   - Quem fez (se coordenador)

Use react-hot-toast para feedback de sucesso."
```

### Sessão 5: Gerente de RH

```
"Implementar:

1. DashboardGerenteRH.jsx
   - Resumo geral: total, concluídos, em andamento
   - Gráfico resumido (pie chart com Recharts)
   - Filtros: departamento, status, responsável

2. IndicadorListGerente.jsx
   - Tabela ou grid
   - Colunas: Nome, Departamento, Responsável, Peso, Realização, Status
   - Botões por linha: [Editar] [Mudar Responsável] [Deletar] [Anexos]

3. EditIndicadorModal.jsx
   - Form com campos: nome, peso, status, objetivo, datas
   - Salva em indicatorStore

4. MudarResponsavelModal.jsx
   - Autocomplete para selecionar novo responsável
   - Simula reatribuição
   - Mostra confirma em toast

Use dados de mockData.json."
```

### Sessão 6: Gráficos

```
"Implementar:

1. BasicCharts.jsx ou KPIDashboard.jsx
   - Gráfico de pizza: Concluído vs Em Andamento
   - Gráfico de linha: Realização % mês a mês (fake data)
   - Gráfico de barras: Ranking de departamentos

Use Recharts com cores do DESIGN.md.
Responsive (mobile: charts empilhados).
Dados mockados (opcional: calcular de indicadorStore)."
```

---

## ✅ Checklist Antes de Apresentar

- [ ] Sem erros de console
- [ ] Sem warnings (`npm run build`)
- [ ] Responsivo (testar mobile + desktop)
- [ ] Login funciona com ambos os roles
- [ ] Colaborador vê só seus indicadores
- [ ] Gerente vê todos
- [ ] Checkbox marca/desmarca
- [ ] Modal anexar abre/fecha
- [ ] Histórico mostra eventos
- [ ] Gráficos renderizam
- [ ] Logout limpa store
- [ ] Navegação entre páginas funciona

---

## 🎨 Referências Rápidas

### Cores (Tailwind)
```css
Primário: bg-blue-500 text-blue-500 border-blue-500
Sucesso: bg-green-500 text-green-500
Aviso: bg-yellow-400 text-yellow-400
Perigo: bg-red-500 text-red-500
```

### Componente Padrão
```jsx
export default function MeuComponente() {
  const { dados } = useIndicatorStore();
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h2 className="text-2xl font-bold mb-4">{titulo}</h2>
      {/* conteúdo */}
    </div>
  );
}
```

### Zustand Simples
```javascript
// store/indicatorStore.js
import { create } from 'zustand';
import mockData from '../data/mockData.json';

export const useIndicatorStore = create((set) => ({
  indicators: mockData.indicators,
  filters: {},
  
  updateIndicator: (id, updates) => set((state) => ({
    indicators: state.indicators.map(ind =>
      ind.id === id ? { ...ind, ...updates } : ind
    )
  })),
  
  setFilters: (filters) => set({ filters })
}));
```

---

## 🚢 Deploy do Protótipo (Etapa 1)

Após pronto:

```bash
npm run build

# Saída: dist/
# Fazer deploy em qualquer hospedagem estática:
# - Vercel (mais fácil): npm i -g vercel && vercel
# - Netlify: arrastar pasta dist
# - GitHub Pages: push para gh-pages branch
```

**URL de Apresentação:** Envie link estático para stakeholders aprovarem UX

---

## 🎯 Definição de Pronto (Etapa 1)

✅ Protótipo funciona sem backend  
✅ Dados mockados em JSON  
✅ UX clara e intuitiva  
✅ Responsivo (3 breakpoints testados)  
✅ Sem erros de console  
✅ Apresentação aprovada por stakeholders  

**Só depois dessa aprovação → Etapa 2 (Backend)**

---

## 🔗 Arquivos Importantes

| Arquivo | Uso |
|---------|-----|
| **SPECS.md** | Requisitos detalhados |
| **DESIGN.md** | Layout, cores, componentes |
| **ARCHITECTURE.md** | Padrões e decisões |
| **MOCK_DATA.json** | Dados exemplo |
| **README.md** | Documentação completa |
| **QUICK_START.md** | Este arquivo |

---

## 💬 Dúvidas Comuns

**P: Preciso fazer autenticação real com Microsoft?**  
R: Não, Etapa 1 é só mock. Entra ID é Etapa 2 (Backend).

**P: Posso usar TypeScript?**  
R: Sim! É recomendado para maior robustez.

**P: E o upload de arquivo?**  
R: No protótipo, simula upload (não faz POST). Backend faz upload real na Etapa 2.

**P: Quanto tempo leva?**  
R: 1-2 semanas (1-2 devs). Depende da quantidade de detalhe.

---

## 🚀 Próximo Passo

```bash
npm create vite@latest frontend -- --template react-swc
cd frontend
npm install
npm run dev
```

**Depois abra sessão de Claude Code com este arquivo + DESIGN.md como contexto e comece scaffolding.**

---

**Pronto? Bora codificar!** 🎉

*Última atualização: 2026-09-08*
