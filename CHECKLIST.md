# ✅ Checklist de Desenvolvimento — Sistema de Metas

Use este checklist para validar progresso em cada etapa.

---

## 🟢 ETAPA 1: Frontend Protótipo

> Status em 2026-09-08: protótipo construído, buildado e verificado num
> navegador headless (login, ambos os dashboards, marcar conclusão, anexar
> documento, paginação, responsividade 375px). Itens não marcados abaixo
> foram deliberadamente adiados ou implementados de forma diferente do
> literal do checklist — ver notas entre parênteses.

### Setup Inicial
- [x] Projeto React criado com Vite
- [x] Dependências instaladas (zustand, tailwind, recharts, etc)
- [x] Tailwind CSS configurado (`tailwind.config.js`)
- [x] Pasta `src/` estruturada conforme ARCHITECTURE.md
- [x] `npm run dev` funciona sem erros
- [x] Build (`npm run build`) sem warnings

### Autenticação (Mock)
- [x] LoginScreen.jsx criado
  - [ ] Form com email, senha, selector de role (implementado como email + senha + lista de usuários demo clicáveis, sem radio de role — role vem do usuário selecionado)
  - [x] Validação básica de campos
  - [x] Botão "Entrar" funciona
  - [x] Ao entrar, salva user + role no Zustand
  - [x] Redireciona para /dashboard
- [x] authStore (Zustand) criado
  - [x] user: { id, nome, email, role, departamento }
  - [x] token: JWT mock
  - [ ] isLoading: boolean (campo existe na store mas o loading do botão é controlado localmente no LoginScreen)
  - [ ] login(), logout(), setUser() (login()/logout() implementados; sem setUser() dedicado)
- [x] ProtectedRoute.jsx funciona
  - [x] Verifica se autenticado
  - [x] Redireciona não-autenticados para login

### Layout Principal
- [x] MainLayout.jsx criado
  - [x] Header com logo, nome de usuário, logout
  - [x] Sidebar com navegação (role-aware)
  - [x] Conteúdo responsivo
  - [x] Mobile: sidebar colapsável
- [x] Header.jsx
  - [x] Mostra username logado
  - [x] Botão logout
  - [x] Avatar (opcional) — iniciais em círculo colorido
- [x] Sidebar.jsx
  - [x] Links baseados em role
  - [x] Ativo/inativo visual
  - [x] Mobile: hamburger menu

### Dados Mockados
- [x] `src/data/mockData.json` criado (ou MOCK_DATA.json copiado)
- [x] indicatorStore (Zustand) implementado
  - [x] Carrega dados de mockData ao iniciar
  - [x] updateIndicator(id, updates)
  - [x] deleteIndicator(id)
  - [x] setFilters(filters)
- [ ] userStore (opcional, se usar) — não criado; componentes leem `mockData.json` (users/departments) diretamente
  - [ ] Lista de usuários mock
  - [ ] Departamentos

### Dashboard Colaborador
- [x] DashboardColaborador.jsx
  - [x] Resumo: Total, Concluídos, Em Andamento
  - [x] Badges com ícones/cores
  - [x] Lista de IndicadorCard
  - [x] Paginação ou "Carregar Mais"
  - [x] Filtra por usuário logado (mock)
- [x] IndicadorCard.jsx (para colaborador)
  - [x] Mostra: nome, peso, realização %
  - [x] Progress bar visual
  - [x] Se concluído:
    - [x] ✓ Checkmark
    - [x] Data de conclusão
    - [x] Botão [Remover Marca]
  - [x] Se em andamento:
    - [x] ☐ Checkbox "Marcar Concluído"
    - [x] Botão [+ Anexar Documento]
  - [x] Botão [Ver Histórico]
  - [x] Responsivo (mobile, desktop)

### Indicador — Marcar Concluído
- [x] Ao clicar checkbox:
  - [x] Atualiza `indicador.status` para "CONCLUIDO"
  - [x] Atualiza `indicador.atendimento` para 100%
  - [x] Seta `indicador.concluido_em` com timestamp
  - [x] Card re-renderiza com novo estado
- [x] Toast de sucesso aparece
- [x] Desmarcar funciona (volta para "EM_ANDAMENTO")
- [x] Histórico registra mudança

### Anexar Documento
- [x] AnexarDocumentoModal.jsx
  - [x] Modal abre ao clicar [+ Anexar Documento]
  - [x] Input file type="file"
  - [x] Validação: apenas PDF, DOC, DOCX, JPG, PNG
  - [x] Max 10 MB
  - [x] Campo descrição (opcional)
  - [x] Botão [Anexar Arquivo]
  - [x] Simula sucesso (adiciona à lista, não faz POST real)
  - [x] Lista de anexos anteriores
  - [x] Botão [Remover] por anexo
- [x] Toast de sucesso: "Arquivo anexado com sucesso"
- [x] Lista de anexos mostra no IndicadorCard
  - [x] Ícone 📎 + nome do arquivo
  - [ ] Link para "Baixar" (fake) — não implementado no card
  - [x] Tamanho do arquivo

### Histórico
- [x] HistoricoModal.jsx ou HistoricoColaborador.jsx
  - [x] Mostra timeline de eventos
  - [x] Eventos: "Marcado como concluído", "Arquivo anexado"
  - [x] Data e hora de cada evento
  - [x] Quem fez (nome do usuário, se aplicável)
  - [x] Order: mais recente primeiro
- [x] Integrado ao indicador:
  - [x] Botão [Ver Histórico] abre modal
  - [x] Mostra histórico daquele indicador

### Dashboard Gerente de RH
- [x] DashboardGerenteRH.jsx
  - [x] Resumo geral:
    - [x] Total indicadores
    - [x] Concluídos
    - [x] Em andamento
    - [x] Atrasados
    - [x] Taxa média realização
  - [x] Gráfico de pizza: Concluído vs Em Andamento
  - [x] Filtros:
    - [x] Dropdown Departamento
    - [ ] Multi-select Status (implementado como select único, não multi-select)
    - [x] Input Busca por nome ou responsável
- [x] IndicadorListGerenteRH.jsx ou IndicadorTableGerenteRH.jsx
  - [x] Grid de cards com:
    - [x] Nome do indicador
    - [x] Departamento
    - [x] Responsável (nome — email omitido no card)
    - [x] Peso (%)
    - [x] Realização (%)
    - [x] Status (com cor)
    - [ ] Data início/fim (só o prazo/data fim aparece no card)
  - [x] Paginação (25 itens/página)
  - [ ] Sorting por coluna (opcional)

### Editar Indicador (Gerente)
- [x] EditIndicadorModal.jsx
  - [x] Abre ao clicar [Editar]
  - [x] Form com campos:
    - [x] Nome (obrigatório, min 10 char)
    - [ ] Departamento (readonly) — editável no formulário atual, não readonly
    - [x] Responsável (seletor)
    - [x] Peso (input 0-100)
    - [x] Status (select)
    - [ ] Realização (%) (se gerente edita) — não exposto no form (é derivado automaticamente ao marcar conclusão)
    - [x] Objetivo (textarea)
    - [x] Data Início (date input)
    - [x] Data Fim (date input)
  - [x] Validações:
    - [x] Data Fim > Data Início
    - [x] Peso entre 0-100
    - [x] Nome preenchido
  - [x] Botões:
    - [x] [Cancelar] — fecha modal
    - [x] [Salvar] — atualiza indicador no store
    - [x] [Deletar] — remove indicador (com confirmação)
  - [x] Toast de sucesso ao salvar
  - [ ] Checkbox [Notificar responsável] (mock) — presente no MudarResponsavelModal, não no EditIndicadorModal

### Mudar Responsável
- [x] MudarResponsavelModal.jsx
  - [x] Abre ao clicar [Mudar Responsável]
  - [x] Mostra responsável atual
  - [x] Autocomplete/select para novo responsável
  - [x] Lista filtrável de colaboradores
  - [x] Campo motivo (opcional)
  - [x] Checkbox [Notificar novo responsável]
  - [x] Botões:
    - [x] [Cancelar]
    - [x] [Reatribuir] — atualiza no store
  - [x] Toast de sucesso
  - [x] Histórico registra mudança

### Criar Indicador (Gerente)
- [x] Botão [Novo Indicador] no dashboard
- [x] NewIndicadorModal.jsx ou mesmo EditIndicadorModal em modo "novo"
  - [x] Form para criar novo indicador
  - [x] Campos: nome, departamento, responsável, peso, objetivo, datas
  - [x] Gera UUID aleatório
  - [x] Adiciona ao store
  - [x] Toast de sucesso
  - [x] Modal fecha

### Gráficos Básicos
- [x] BasicCharts.jsx ou KPIDashboard.jsx
  - [x] Gráfico de Pizza (Recharts)
    - [x] Concluído vs Em Andamento (e demais status presentes)
    - [x] Cores corretas (verde sucesso, amarelo warning)
  - [x] Gráfico de Linha
    - [x] Realização % ao longo de meses (fake data)
    - [x] Eixo X: meses, Eixo Y: %
  - [x] Gráfico de Barras
    - [ ] Top 3 departamentos por taxa realização (mostra todos os departamentos com dados, sem ranking/corte top-3)
    - [x] Responsivo
- [ ] Integrado no dashboard (Gerente + Colaborador) — só no Gerente, por decisão de design (DESIGN.md 5.2 não inclui gráficos no dashboard do colaborador)
- [x] Renderiza sem erros (Recharts)

### Responsividade
- [x] Testar em 3 breakpoints:
  - [x] Mobile (375px): layout empilhado, sidebar colapsável, modais full height — verificado com screenshot
  - [ ] Tablet (768px): 2 colunas onde possível (classes responsivas aplicadas via Tailwind, não capturado em screenshot dedicado)
  - [x] Desktop (1920px): layout completo — verificado em 1440px
- [x] Nenhum overflow horizontal
- [x] Toques funcionam no mobile (botões/checkbox padrão, sem gestos customizados)
- [x] Texto legível em todos os tamanhos

### Componentes Comuns (Reutilizáveis)
- [x] Button.jsx
  - [x] Props: variant, size, disabled, loading
  - [x] Estados: hover, active, disabled
- [x] Input.jsx
  - [x] Props: label, error, required, type
  - [x] Validação integrada
- [x] Modal.jsx
  - [x] Props: isOpen, onClose, title, children
  - [x] Overlay funciona
  - [x] Esc fecha modal
- [ ] Spinner.jsx — criado, mas não integrado em nenhuma tela (o Button já tem spinner inline próprio)
  - [x] Animação de carregamento
  - [x] Pode ter label
- [x] Toast.jsx ou usar react-hot-toast
  - [x] Posição: canto inferior direito
  - [x] Tipos: success usado; error/warning/info suportados pela lib mas não usados no fluxo atual
  - [x] Auto-close em 3-5s
- [x] ProgressBar.jsx
  - [x] Props: value (0-100), color
  - [x] Animado

### Validações
- [x] Input email: formato válido
- [x] Input números: apenas números (peso usa `type="number"`)
- [x] Input obrigatórios: não deixam salvar vazio
- [x] Datas: validar lógica (fim > início)
- [x] Arquivo: tipos e tamanho
- [x] Mensagens de erro claras
- [x] Highlight campos com erro (cor vermelha)

### Segurança (Frontend)
- [x] Senhas não são mostradas em plain text (input type="password")
- [x] No localStorage: não armazenar senhas (só user + token mock)
- [x] XSS: escape de strings em JSX (automático React)
- [x] CSRF: não aplicável em protótipo (sem backend)

### Performance
- [x] `npm run build` rápido (< 30s) — ~1s
- [x] Bundle size razoável (< 500KB gzipped inicial) — 201KB gzipped
- [ ] Lazy load de componentes (React.lazy, opcional)
- [ ] Nenhum re-render desnecessário (React DevTools) — não medido

### Estilo e Design
- [x] Cores consistentes (paleta do DESIGN.md em `tailwind.config.js`)
- [x] Tipografia consistente (Poppins/Inter via Google Fonts)
- [x] Espaçamento consistente (escala Tailwind)
- [x] Ícones consistentes (emoji + SVG inline)
- [x] Sombras e bordos consistentes
- [ ] Tema dark/light (opcional)

### Acessibilidade (Básica)
- [ ] Contrast ratio ≥ 4.5:1 para texto (não medido com ferramenta)
- [x] Labels em inputs
- [x] ARIA labels onde necessário (modal, botão de menu, progressbar)
- [x] Navegação por teclado (Tab, Enter, Escape — Esc fecha modais)
- [ ] Sem erros Axe DevTools (se usar) — não executado

### Testes (Opcional Etapa 1)
- [ ] Componentes principais testáveis (sem testes automatizados nesta etapa)
- [ ] Props validadas com PropTypes ou TypeScript — tipadas via TypeScript, sem testes de prop
- [x] Sem console.errors ou warnings — verificado via Playwright headless em todos os fluxos testados

### Build & Deploy
- [x] `npm run build` sem erros
- [x] `npm run build` sem warnings (ou apenas avisos não-críticos) — apenas aviso de tamanho de chunk (recharts), não-crítico
- [x] Pasta `dist/` pode ser deployada (contém index.html)
- [ ] Build testado em production mode (`npm run preview` não executado)
- [x] Arquivo .env.example documentado (variáveis de config)

### Documentação (Frontend)
- [x] Arquivo README.md atualizado
- [ ] Comentários em componentes complexos (código auto-documentado por nomes; sem comentários adicionados)
- [ ] Arquivo CHANGELOG.md com versão 1.0
- [x] Instruções para rodar localmente

---

## 🟡 ETAPA 2: Backend + Persistência

*Iniciar quando Etapa 1 aprovada por stakeholders*

### Setup Node.js + Express
- [ ] `npm init -y` em backend/
- [ ] Dependências instaladas (express, pg, knex, dotenv, etc)
- [ ] `npm run dev` funciona (nodemon configurado)
- [ ] `npm run build` (transpile TypeScript se usar)

### Estrutura Pasta Backend
- [ ] src/routes/ criado
- [ ] src/controllers/ criado
- [ ] src/services/ criado
- [ ] src/repositories/ criado
- [ ] src/middleware/ criado
- [ ] src/db/ criado (migrations, seeders)
- [ ] .env.example documentado

### Banco de Dados PostgreSQL
- [ ] PostgreSQL provisionado (local ou Azure)
- [ ] Conexão testada (`npm run db:test`)
- [ ] Connection pool configurado (knex)
- [ ] 5 tabelas criadas (users, departments, indicators, attachments, audit_logs)
  - [ ] Schema conforme SPECS.md seção 5
  - [ ] Tipos corretos (UUID, DECIMAL, TEXT, etc)
  - [ ] Constraints (UNIQUE, FK, NOT NULL)
  - [ ] Índices criados
- [ ] Migrations executadas
- [ ] Seeders de dados teste rodados

### Autenticação + JWT
- [ ] Microsoft Entra ID (Entra ID registrado)
  - [ ] Client ID obtido
  - [ ] Client Secret obtido
  - [ ] Redirect URI configurado
- [ ] Middleware JWT criado
  - [ ] Validação de token
  - [ ] Extração de claims
  - [ ] TTL 1 hora
- [ ] POST /api/auth/login
  - [ ] Recebe token MS Graph
  - [ ] Valida com Microsoft
  - [ ] Cria/atualiza user em BD
  - [ ] Retorna JWT + user info
- [ ] GET /api/auth/me funciona (protegido)
- [ ] POST /api/auth/logout funciona
- [ ] Token refresh (opcional)

### RBAC (Autorização)
- [ ] Middleware RBAC criado
  - [ ] Verifica role no JWT
  - [ ] Diferencia GERENTE_RH vs COLABORADOR
- [ ] Rotas protegidas por role:
  - [ ] GET /api/indicators → todos podem (se próprio)
  - [ ] PUT /api/indicators/:id → só GERENTE_RH
  - [ ] PATCH /api/indicators/:id/complete → COLABORADOR
  - [ ] etc (conforme SPECS.md seção 6)

### API REST — Indicadores
- [ ] GET /api/indicators (lista com paginação)
- [ ] GET /api/indicators/:id (detalhe)
- [ ] POST /api/indicators (criar, só GERENTE_RH)
- [ ] PUT /api/indicators/:id (editar, só GERENTE_RH)
- [ ] DELETE /api/indicators/:id (deletar, só GERENTE_RH)
- [ ] PATCH /api/indicators/:id/complete (marcar concluído)
- [ ] GET /api/indicators/me (próprios)

### Upload de Arquivos
- [ ] Middleware multer configurado
- [ ] POST /api/indicators/:id/attachments
  - [ ] Recebe file + description
  - [ ] Valida tipo (PDF, DOC, JPG, PNG)
  - [ ] Valida tamanho (max 10MB)
  - [ ] Salva em storage (local ou S3)
  - [ ] Registra em BD (tabela attachments)
- [ ] GET /api/indicators/:id/attachments (lista)
- [ ] DELETE /api/indicators/:id/attachments/:attachmentId (remover)

### Auditoria
- [ ] Tabela indicador_updates criada
- [ ] Trigger ou service registra:
  - [ ] Criação de indicador
  - [ ] Edição (qual campo, antes/depois)
  - [ ] Reatribuição de responsável
  - [ ] Conclusão de indicador
- [ ] GET /api/indicators/:id/history retorna auditoria

### Relatórios (API)
- [ ] GET /api/reports/por-departamento (consolidado)
- [ ] GET /api/reports/por-colaborador/:id (detalhado)
- [ ] GET /api/charts/kpis (dados para gráficos)
- [ ] GET /api/charts/por-responsavel (ranking)

### Validação
- [ ] Joi schemas em todas as rotas
- [ ] Validação de entrada (tipo, tamanho, formato)
- [ ] Mensagens de erro estruturadas
- [ ] HTTP status codes corretos (400, 401, 403, 404, 500)

### Segurança Backend
- [ ] Helmet configurado (headers de segurança)
- [ ] CORS configurado (apenas frontend URL)
- [ ] Rate limiting (opcional)
- [ ] SQL injection prevention (prepared statements/Knex)
- [ ] Password hashing (bcryptjs se usar)
- [ ] Secrets em .env (não em código)
- [ ] HTTPS obrigatório (em produção)

### Logging
- [ ] Winston ou similar configurado
- [ ] Logs estruturados (JSON)
- [ ] Nível de log configurável (env: DEBUG, INFO, ERROR)
- [ ] Rotação de logs (arquivo)

### Testes Backend
- [ ] Jest configurado
- [ ] Testes unitários (services, repositories)
  - [ ] Coverage ≥ 70%
- [ ] Testes de integração (rotas + BD)
  - [ ] Autenticação
  - [ ] RBAC
  - [ ] CRUD indicadores
- [ ] Testes com dados mock/fixtures
- [ ] `npm run test` funciona

### Integração Frontend + Backend
- [ ] Frontend aponta para backend URL (env: REACT_APP_API_URL)
- [ ] Requests incluem Authorization header
- [ ] Responses parseadas corretamente
- [ ] Tratamento de erros 401/403
- [ ] Redirect para login se não autenticado
- [ ] Dados atualizam em real-time (após mudanças)

### Documentação API
- [ ] Swagger/OpenAPI (opcional, mas recomendado)
- [ ] README.md com exemplos cURL
- [ ] Comentários em controllers
- [ ] Arquivo API.md com specs de endpoints

### Deployment Staging
- [ ] Docker configurado (Dockerfile + docker-compose.yml)
- [ ] App deployada em staging (Azure AppService, Heroku, etc)
- [ ] Banco em staging provisionado
- [ ] .env em staging configurado
- [ ] Testes de fumaça em staging

---

## 🟣 ETAPA 3: Gráficos + Produção

*Iniciar quando Etapa 2 estável em staging*

### Gráficos Avançados
- [ ] Recharts integrado ao backend
- [ ] GET /api/charts/realização-mês retorna dados
- [ ] Dashboard KPIs personalizado por role
- [ ] Exportação de dados (CSV)

### Notificações
- [ ] Email ao reatribuir indicador (opcional)
- [ ] Email ao marcar concluído (opcional)
- [ ] Template de email

### Monitoring/Logs Produção
- [ ] Application Insights ou Sentry setup
- [ ] Error tracking funciona
- [ ] Performance metrics coletados
- [ ] Alertas configurados

### Performance
- [ ] Índices BD otimizados
- [ ] Queries não têm N+1 problems
- [ ] Cache implementado (Redis, opcional)
- [ ] API response time < 500ms para GET
- [ ] Lighthouse score ≥ 80

### Segurança (Produção)
- [ ] HTTPS obrigatório
- [ ] HSTS header
- [ ] CSP header
- [ ] Secrets em Key Vault (não no código)
- [ ] Permissões DB reduzidas (princípio menor privilégio)
- [ ] Firewall configurado
- [ ] WAF (Web Application Firewall) opcional

### Compliance
- [ ] LGPD compliance (dados pessoais)
- [ ] Criptografia em trânsito (HTTPS)
- [ ] Criptografia em repouso (opcional)
- [ ] Direito ao esquecimento (opcional)

### Backup & Disaster Recovery
- [ ] Backup diário BD (gerado)
- [ ] Replicação (se crítico)
- [ ] Plano de restauração documentado
- [ ] RTO/RPO definido

### CI/CD
- [ ] GitHub Actions (ou similar) setup
- [ ] Build automático em push
- [ ] Testes rodam em CI
- [ ] Deploy automático em main branch
- [ ] Rollback procedure documentado

### Produção
- [ ] App deployada em produção
- [ ] BD produção criada/migrada
- [ ] Secrets produção configurados
- [ ] DNS apontando para app
- [ ] SSL certificate válido
- [ ] Usuários testam em produção
- [ ] Sem dados sensíveis em logs
- [ ] Backup testado (restauração bem-sucedida)

### Documentação Final
- [ ] README.md completo
- [ ] TROUBLESHOOTING.md com problemas comuns
- [ ] DEPLOYMENT.md com passo-a-passo
- [ ] Runbooks para operações comuns
- [ ] Contato para suporte (escalation)

### UAT (User Acceptance Test)
- [ ] Casos de teste aprovados por negócio
- [ ] Todos os casos executados e passados
- [ ] Usuários finais validam funcionalidades
- [ ] Sign-off de aprovação assinado

### Launch
- [ ] Anúncio para usuários
- [ ] Treinamento (se necessário)
- [ ] Suporte 24/7 on-call (primeiras 48h)
- [ ] KPIs de adoção monitorados

---

## 📋 Assinatura & Aprovação

| Etapa | Data Início | Data Fim | Responsável | Status | Aprovador |
|-------|------------|---------|-------------|--------|-----------|
| 1. Frontend | ___/___/___ | ___/___/___ | ____________ | ☐ Completa | ____________ |
| 2. Backend | ___/___/___ | ___/___/___ | ____________ | ☐ Completa | ____________ |
| 3. Produção | ___/___/___ | ___/___/___ | ____________ | ☐ Completa | ____________ |

---

**Versão:** 1.0  
**Última atualização:** 2026-09-08  
**Próxima revisão:** Após Etapa 1 completa
