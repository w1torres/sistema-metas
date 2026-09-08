# Sistema de Metas — Frontend (Etapa 1: Protótipo)

Protótipo funcional do Sistema de Acompanhamento de Metas, construído com dados
mockados (sem backend). Ver `../SPECS.md`, `../DESIGN.md` e `../ARCHITECTURE.md`
para a especificação completa.

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Recharts + react-hot-toast + react-router-dom.

## Rodar localmente

```bash
npm install
npm run dev
# http://localhost:5173
```

## Build de produção

```bash
npm run build   # gera dist/
npm run preview # serve o build localmente
```

## Login (protótipo)

Não há autenticação real (Entra ID chega na Etapa 2). Use qualquer senha com um
dos emails cadastrados — a tela de login lista os usuários disponíveis para
clique rápido. Novos usuários cadastrados pelo Admin em **Usuários** também
aparecem nessa lista automaticamente.

| Email | Papel |
|---|---|
| admin@empresa.com | Administrador |
| maria@empresa.com | Gerente de RH |
| marcia@empresa.com | Colaborador |
| joao@empresa.com | Colaborador |
| ana@empresa.com | Colaborador |
| pedro@empresa.com | Colaborador |

## Papéis (roles)

- **Colaborador:** vê e gerencia apenas os próprios indicadores.
- **Gerente de RH:** acesso a Visão Geral, Todos Indicadores, Relatórios e Tabela PPR.
- **Administrador:** tudo do Gerente de RH + tela de **Usuários** (cadastro de
  novas pessoas com nome e email corporativo).

## Paleta de cores

A cor primária (`#0A7D3D`) foi extraída por amostragem de pixel do
`public/favicon.png` (logo Tchê), para que os botões e destaques da UI
combinem com a marca. Como o status "Concluído" já usava um verde
(`#198754`, muito próximo do verde da marca), ele foi migrado para um teal
(`#0D9488`) — mantém a leitura de "sucesso" sem se confundir visualmente com
os botões de ação primários. Tokens em `tailwind.config.js`.

## O que está implementado

- Login mock + sessão persistida em `localStorage` (Zustand `persist`)
- Layout responsivo (header, sidebar colapsável no mobile, navegação por rota)
- **Colaborador** (`/dashboard`): resumo pessoal, lista/filtro/busca de
  indicadores, marcar/desmarcar conclusão, anexar e remover documentos
  (simulado), histórico por indicador
- **Visão Geral** (`/dashboard`, Gerente/Admin): resumo geral + gráficos
  (pizza/linha/barras via Recharts)
- **Todos Indicadores** (`/indicadores`, Gerente/Admin): filtros
  (departamento/status/busca), criar/editar/excluir indicador, reatribuir
  responsável, paginação (25/página), exportar CSV, **importar planilha CSV**
- **Relatórios** (`/relatorios`, Gerente/Admin): gráficos + tabelas
  consolidadas por departamento e por colaborador, cada uma exportável em CSV
- **Usuários** (`/usuarios`, Admin): cadastro de pessoas (nome + email
  corporativo + departamento + cargo + papel) e ativação/desativação de acesso
- **Tabela PPR** (`/ppr`, Gerente/Admin): faixas de percentual ponderado →
  múltiplo de PPR, por cargo (com validação contra faixas sobrepostas). O
  percentual ponderado de cada colaborador é `soma(peso × realização) / soma(peso)`
  entre os indicadores dele; ver `utils/ppr.ts`. Esse mesmo múltiplo aparece:
  - para o colaborador, no card "Seu Múltiplo de PPR" no dashboard dele
  - para Gerente/Admin, na coluna "Múltiplo PPR" do relatório Por Colaborador
- Importação de planilha (CSV): cria colaboradores, departamentos e cargos
  citados que ainda não existirem, e cria um indicador por linha já atribuído
  ao colaborador certo — ver botão "Baixar modelo CSV" no modal de importação
  para o formato de colunas esperado
- Auditoria: toda alteração (conclusão, edição, reatribuição, criação) gera um
  registro em `indicatorStore.history`, consultável via "Ver Histórico"
- Validações client-side (nome, peso, datas, tipo/tamanho de arquivo, email)

## Sobre a importação de planilha

O parser de CSV é escrito à mão (sem dependência externa) porque o pacote
`xlsx` (SheetJS) disponível no npm tem vulnerabilidades conhecidas sem
correção (prototype pollution / ReDoS). CSV cobre o caso de uso — Excel e
Google Sheets exportam para `.csv` nativamente — sem esse risco. Se um
suporte a `.xlsx` binário for realmente necessário, considere `exceljs`
(mantido ativamente) na Etapa 2, já com validação de arquivo no backend.

## O que fica para a Etapa 2 (backend)

- Autenticação real via Microsoft Entra ID (os usuários cadastrados aqui viram
  a base de quem poderá logar via Microsoft)
- Persistência em PostgreSQL (hoje os dados resetam a cada reload, exceto a
  sessão logada, que fica em `localStorage`)
- Upload real de arquivos (hoje é simulado — nenhum byte é enviado)
- Envio de notificações por email na reatribuição
- Import de planilha processado/validado no servidor (hoje é 100% client-side)

## Estrutura

```
src/
├── components/{auth,layout,dashboard,indicators,charts,common,reports,admin,ppr}/
├── store/        # Zustand: authStore (persistido), indicatorStore, userStore,
│                 #   departmentStore, cargoStore, pprStore (persistido)
├── data/         # mockData.json
├── types/        # interfaces TypeScript compartilhadas
└── utils/        # constants, formatters, validators, csv, ppr
```
