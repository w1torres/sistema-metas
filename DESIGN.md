# Design e UX — Sistema de Acompanhamento de Metas

## 1. Princípios de Design

- **Clareza:** Indicador = nome claro + status visual imediato
- **Eficiência:** Ações em 1-2 cliques (marcar concluído, anexar)
- **Responsividade:** Desktop (1920px), Tablet (768px), Mobile (375px)
- **Acessibilidade:** WCAG 2.1 AA (cores de contraste, textos alternativos)
- **Consistência:** Padrão de cores, tipografia, componentes reutilizáveis

---

## 2. Paleta de Cores

| Elemento | Cor Hex | Uso |
|----------|---------|-----|
| **Primário** | `#0D6EFD` | Botões, links, destaques |
| **Secundário** | `#6C757D` | Textos secundários |
| **Sucesso** | `#198754` | Status "Concluído", checkmarks |
| **Aviso** | `#FFC107` | Status "Em Andamento" |
| **Perigo** | `#DC3545` | Status "Atrasado", erros |
| **Info** | `#0DCAF0` | Informações, badges |
| **Fundo** | `#F8F9FA` | Background principal |
| **Texto** | `#212529` | Texto principal |
| **Bordo** | `#DEE2E6` | Separadores, borders |

---

## 3. Tipografia

```css
/* Headings */
h1: Poppins, 32px, bold, #212529
h2: Poppins, 24px, bold, #212529
h3: Poppins, 18px, semi-bold, #212529

/* Body */
body: Inter, 14px, regular, #212529
small: Inter, 12px, regular, #6C757D

/* Monospace */
code: Courier New, 12px, regular, #DC3545
```

---

## 4. Layout Principal (Responsivo)

### Desktop (1920px)
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ [Logo] [Título]          [Usuário ▼] [Logout]             │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR (220px)          │ CONTEÚDO PRINCIPAL (1580px)      │
│                          │                                  │
│ [Dashboard]              │ Filtros                          │
│ [Meus Indicadores]       │ ┌─────────────────────────────┐  │
│ [Relatórios] (se GM)     │ │ Departamento: [dropdown]    │  │
│ [Logout]                 │ │ Status: [multi-select]      │  │
│                          │ │ [Buscar]    [Exportar] (GM) │  │
│                          │ └─────────────────────────────┘  │
│                          │                                  │
│                          │ TABELA / CARDS                   │
│                          │ ┌──────────────────────────────┐ │
│                          │ │ Indicador 1   [50%] [✓]      │ │
│                          │ │ Indicador 2   [80%] [ ]      │ │
│                          │ │ Indicador 3   [30%] [ ]      │ │
│                          │ └──────────────────────────────┘ │
│                          │                                  │
└──────────────────────────────────────────────────────────────┘
```

### Tablet (768px)
- Sidebar colapsável (hamburger menu)
- Cards empilhados verticalmente
- Tabela horizontal com scroll

### Mobile (375px)
- Sem sidebar (navegação inferior)
- Cards full-width
- Modais no lugar de dropdowns complexos

---

## 5. Componentes Principais

### 5.1 Login Screen
```
┌─────────────────────────────────────┐
│                                     │
│      SISTEMA DE METAS              │
│                                     │
│  [Microsoft Account Button]         │
│  "Entrar com Microsoft"             │
│                                     │
│  ─────────────────────────────     │
│  ou                                 │
│                                     │
│  Email: [________________]          │
│  CPF:   [________________]          │
│  Matrícula: [________________]      │
│                                     │
│  [Entrar]                           │
│                                     │
│  © 2026 Empresa                    │
└─────────────────────────────────────┘
```

**Estados:**
- Default: botão Microsoft destacado
- Loading: spinner no botão
- Erro: mensagem vermelha abaixo do campo

---

### 5.2 Dashboard — Colaborador

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard / Meus Indicadores          [Bem-vindo, João Silva] │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Resumo Pessoal                                                  │
│                                                                 │
│ Total de Indicadores: 8                                         │
│ Concluídos: 3 (37%)        ████░░░░░░ 37%                     │
│ Em Andamento: 5 (63%)      ██████░░░░ 63%                     │
│                                                                 │
│ Última atualização: Hoje às 14:32                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Meus Indicadores                                                │
│                                                                 │
│ Filtro: [Todos] [Em Andamento] [Concluídos]  [Buscar]         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ INDICADOR 1                               Status: Concluído ││
│ │ POLÍTICA DE COMPRAS COM O FORNECEDOR                        ││
│ │                                                              ││
│ │ Peso: 20%      Realização: 100% ████████████████████       ││
│ │ Prazo: até 31/12/2026                                       ││
│ │                                                              ││
│ │ ✓ Concluído em 15/11/2026 por Você                         ││
│ │ 📎 Anexo: Documento_Assinado.pdf (245 KB)                  ││
│ │                                                              ││
│ │ [Ver Histórico] [Remover Marca]                             ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ INDICADOR 2                        Status: Em Andamento     ││
│ │ REALIZAR 20 HORAS DE INTEGRAÇÃO COMPRADA                   ││
│ │                                                              ││
│ │ Peso: 20%      Realização: 8% ██░░░░░░░░░░░░░░░░░░       ││
│ │ Prazo: até 31/12/2026                                       ││
│ │                                                              ││
│ │ Detalhamento: Concluídas 2 horas de 20                      ││
│ │                                                              ││
│ │ ☐ Marcar como Concluído                                    ││
│ │ [+ Anexar Documento]                                        ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [Carregar Mais...]                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Dashboard — Gerente de RH

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard / Indicadores                    [Bem-vindo, Maria] │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Resumo Geral                                                    │
│                                                                 │
│ Departamentos: 5      Indicadores Totais: 42                   │
│ Concluídos: 18 (43%) ████░░░░░░ 43%                           │
│ Em Andamento: 24 (57%) ██████░░░░ 57%                         │
│                                                                 │
│ Taxa de Realização Média: 52%                                  │
│ Departamento com Melhor Performance: TI (78%)                  │
│                                                                 │
│ Gráficos (Chart.js / Recharts)                                │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ [Linha: Realização ao Longo do Tempo] [Pizza: Por Status] ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Filtros & Ações                                                 │
│                                                                 │
│ Departamento: [Todos ▼]  Status: [Todos ▼]  [Buscar]          │
│ Responsável: [_________________]                               │
│                                                                 │
│ [Novo Indicador] [Exportar CSV] [Importar]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Indicadores                                                     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ POLÍTICA DE COMPRAS COM O FORNECEDOR                        ││
│ │ Departamento: ADMINISTRATIVO                                ││
│ │ Responsável: Marcia (marcia@empresa.com)                    ││
│ │                                                              ││
│ │ Peso: 20%  │ Realização: 0% ░░░░░░░░░░░░░░░░░░░░         ││
│ │ Status: Em Andamento 🟡                                      ││
│ │                                                              ││
│ │ Prazo: até 31/12/2026                                       ││
│ │ Criado em: 01/01/2026  Última alteração: Hoje, 10:00       ││
│ │                                                              ││
│ │ [Editar] [Mudar Responsável] [Concluir] [Arquivo]          ││
│ │                                                              ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [Mais Indicadores...]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5.4 Modal — Editar Indicador (Gerente RH)

```
┌──────────────────────────────────────────────────────┐
│ Editar Indicador                            [x]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Nome do Indicador *                                  │
│ [Política de Compras com o Fornecedor              │
│                                                      │
│ Departamento * (readonly)                           │
│ [ADMINISTRATIVO]                                    │
│                                                      │
│ Responsável / Colaborador *                         │
│ [Marcia v]  [Procurar outro...]                    │
│  └─ marcia@empresa.com (Matrícula: 12345)          │
│                                                      │
│ Peso (%) *                                           │
│ [20] ─── máximo 100%                                │
│                                                      │
│ Status *                                             │
│ ○ Em Andamento  ○ Concluído  ○ Atrasado  ○ Pausado│
│                                                      │
│ Realização (%) — Calculado automaticamente           │
│ [0] (calculado pelo número de anexos/data)         │
│                                                      │
│ Objetivo / Descrição                                │
│ ┌────────────────────────────────────────────────┐ │
│ │ Desenvolver uma política de compras...         │ │
│ │                                                │ │
│ │                                                │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Data de Início *                                     │
│ [01/01/2026]                                        │
│                                                      │
│ Data de Fim / Prazo *                               │
│ [31/12/2026]                                        │
│                                                      │
│ Observações para Auditoria                          │
│ [_________________________________]                │
│                                                      │
│ ☐ Notificar responsável por email                   │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Cancelar]                           [Salvar] [Del] │
└──────────────────────────────────────────────────────┘
```

---

### 5.5 Modal — Mudar Responsável (Gerente RH)

```
┌──────────────────────────────────────────────────────┐
│ Reatribuir Indicador                        [x]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Indicador                                            │
│ POLÍTICA DE COMPRAS COM O FORNECEDOR                │
│                                                      │
│ Responsável Atual                                    │
│ Marcia Silva (marcia@empresa.com)                   │
│                                                      │
│ Novo Responsável *                                   │
│ ┌────────────────────────────────────────────────┐  │
│ │ Buscar colaborador...                         │  │
│ │                                                │  │
│ │ ○ João Santos (joao@empresa.com)              │  │
│ │ ○ Ana Costa (ana@empresa.com)                 │  │
│ │ ○ Pedro Oliveira (pedro@empresa.com)          │  │
│ │                                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Motivo (opcional)                                    │
│ ┌────────────────────────────────────────────────┐  │
│ │ Ex: Saída de Marcia, férias, ou mudança de... │  │
│ │                                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ☐ Notificar novo responsável                       │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Cancelar]                     [Reatribuir] [Limpar]│
└──────────────────────────────────────────────────────┘

Aviso: Indicador anterior não será perdido, será registrado
em histórico. Novo responsável será notificado automaticamente.
```

---

### 5.6 Card — Indicador Colaborador (Mobile)

```
┌──────────────────────────────────────┐
│ INDICADOR 2                          │
│ REALIZAR 20 HORAS DE INTEGRAÇÃO      │
│                                      │
│ 📊 Realização: 8% 40%               │
│    ██░░░░░░░░░░░░░░░░░░            │
│                                      │
│ 🏷️  Peso: 20%                        │
│ 📅 Prazo: 31/12/2026                │
│ 🟡 Status: Em Andamento             │
│                                      │
│ Detalhamento:                        │
│ Concluídas 2 horas de 20            │
│                                      │
│ ☐ Marcar Concluído                  │
│                                      │
│ [+ Anexar Documento] [Ver Histórico]│
│                                      │
└──────────────────────────────────────┘
```

---

## 6. Fluxo de Interação — Marcar Indicador como Concluído

```
┌─────────────────────────────────────────────────────────┐
│ [Em Andamento]  INDICADOR 2                             │
│                 REALIZAR 20 HORAS DE INTEGRAÇÃO        │
│                 Realização: 8%                          │
│                                                         │
│ ☐ Marcar como Concluído                               │
│                                                         │
│ [+ Anexar Documento]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    ↓ click checkbox
┌─────────────────────────────────────────────────────────┐
│ ✓ Concluído em 15/11/2026                             │
│                                                         │
│ INDICADOR 2                                             │
│ REALIZAR 20 HORAS DE INTEGRAÇÃO                        │
│ Realização: 100% ████████████████████                  │
│                                                         │
│ [Remover Marca] [+ Anexar Documento] [Ver Histórico]  │
│                                                         │
│ Nota: Você marcou este indicador como concluído.       │
│       Gerente de RH poderá revisar os anexos.         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    ↓ click "+ Anexar"
┌──────────────────────────────────────────────────────┐
│ Anexar Documento / Comprovação                 [x]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Arraste arquivo aqui ou clique para procurar │   │
│ │                                              │   │
│ │ [Selecionar Arquivo]                         │   │
│ │                                              │   │
│ │ Tipos aceitos: PDF, DOC, DOCX, JPG, PNG     │   │
│ │ Tamanho máximo: 10 MB                       │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Descrição (opcional)                                │
│ [Comprovante de conclusão das 20 horas...]         │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Cancelar]                           [Anexar Arquivo]│
└──────────────────────────────────────────────────────┘
                    ↓ upload sucesso
┌──────────────────────────────────────────────────────┐
│ ✅ Arquivo anexado com sucesso!                     │
│                                                      │
│ 📎 Documento_Assinado.pdf (245 KB)                  │
│    Anexado em: 15/11/2026 14:32                     │
│    [Baixar] [Remover]                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 7. Validações e Estados

### Estados do Indicador
| Estado | Cor | Ícone | Significado |
|--------|-----|-------|-------------|
| **Concluído** | Verde (`#198754`) | ✓ | Tarefa finalizada e comprovada |
| **Em Andamento** | Amarelo (`#FFC107`) | 🟡 | Em execução, não concluído |
| **Atrasado** | Vermelho (`#DC3545`) | ⚠️ | Passou prazo sem conclusão |
| **Pausado** | Cinza (`#6C757D`) | ⏸️ | Temporariamente suspenso |

### Validações
- **Nome do indicador:** Obrigatório, min 10 caracteres
- **Peso:** Número entre 0-100
- **Data de Fim > Data de Início:** Sempre validar
- **Responsável:** Deve ser um colaborador ativo
- **Arquivo anexo:** Max 10 MB, tipos: PDF, DOC, DOCX, JPG, PNG

---

## 8. Responsividade — Breakpoints

```css
/* Mobile */
@media (max-width: 576px) {
  - Sidebar desaparece (hamburger)
  - Cards full-width
  - Tabelas → scrollable horizontal
  - Modais → full height
}

/* Tablet */
@media (min-width: 577px) and (max-width: 992px) {
  - Sidebar colapsável
  - Cards 50% width (grid 2 cols)
  - Fonte pequena 13px
}

/* Desktop */
@media (min-width: 993px) {
  - Sidebar 220px permanente
  - Cards 1 coluna ou grid 2-3
  - Tabela com scroll
  - Modais 600px max-width
}
```

---

## 9. Tema Escuro (Opcional — Etapa 3)

Se implementado:
- Fundo: `#1A1A1A`
- Texto: `#E0E0E0`
- Primário: `#4A9FFF` (ajustado para contraste)
- Componentes: suavizar bordos

---

## 10. Mensagens e Feedback

### Toasts (notificações rápidas)
```
✅ Indicador marcado como concluído
❌ Erro ao salvar. Tente novamente.
⚠️ Você tem alterações não salvas
ℹ️ Indicador reatribuído para João Silva
```

**Posição:** canto inferior direito  
**Duração:** 3-5 segundos (erro: 5s, sucesso: 3s)  
**Stack:** máximo 3 toasts simultâneos

### Confirmações Críticas
```
Você tem certeza de que deseja deletar este indicador?
Essa ação não pode ser desfeita.

[Cancelar]  [Deletar]
```

---

## 11. Acessibilidade (WCAG 2.1 AA)

- [ ] Contraste mínimo 4.5:1 (texto principal)
- [ ] Contraste 3:1 (texto grande)
- [ ] Textos alternativos em imagens/ícones
- [ ] Navegação por teclado (Tab, Enter, Escape)
- [ ] Labels associadas a inputs
- [ ] ARIA labels onde necessário
- [ ] Testes com NVDA/JAWS (screen readers)

---

## 12. Padrão de Estrutura de Componentes React

```
components/
  ├── auth/
  │   ├── LoginScreen.jsx
  │   ├── ProtectedRoute.jsx
  │   └── EntraIdLogin.jsx
  ├── layout/
  │   ├── Header.jsx
  │   ├── Sidebar.jsx
  │   ├── MainLayout.jsx
  │   └── MobileNav.jsx
  ├── dashboard/
  │   ├── DashboardColaborador.jsx
  │   ├── DashboardGerenteRH.jsx
  │   ├── SummaryCard.jsx
  │   └── Charts.jsx
  ├── indicators/
  │   ├── IndicadorCard.jsx
  │   ├── IndicadorList.jsx
  │   ├── IndicadorTable.jsx
  │   ├── EditIndicadorModal.jsx
  │   ├── MudarResponsavelModal.jsx
  │   └── AnexarDocumentoModal.jsx
  ├── common/
  │   ├── Button.jsx
  │   ├── Input.jsx
  │   ├── Select.jsx
  │   ├── Modal.jsx
  │   ├── Toast.jsx
  │   ├── Spinner.jsx
  │   └── ProgressBar.jsx
  └── charts/
      ├── LineChart.jsx
      ├── PieChart.jsx
      ├── BarChart.jsx
      └── KPIDashboard.jsx

styles/
  ├── global.css
  ├── variables.css (cores, fontes, breakpoints)
  ├── components.css
  ├── responsive.css
  └── accessibility.css
```

---

## 13. Fluxo de Navegação

```
Login → [Microsoft Entra ID] → Redirect /dashboard

┌────────────────────────────────┐
│ Colaborador                    │
├────────────────────────────────┤
│ /dashboard/colaborador         │
│ /indicadores/me                │
│ /indicadores/:id               │
│ /anexos/:id                    │
│ /historico/me                  │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Gerente de RH                  │
├────────────────────────────────┤
│ /dashboard/gerente             │
│ /indicadores (todos)           │
│ /indicadores/:id/editar        │
│ /indicadores/novo              │
│ /relatorios                    │
│ /charts                        │
│ /configuracoes (opcional)      │
└────────────────────────────────┘

Logout → /login
```

---

**Documento versão:** 1.0  
**Última atualização:** 2026-09-08
