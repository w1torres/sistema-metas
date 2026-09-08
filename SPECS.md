# Especificação Técnica — Sistema de Acompanhamento de Metas

## 1. Visão Geral

**Projeto:** Plataforma de Acompanhamento de Indicadores e Metas  
**Versão:** 1.0  
**Data:** 2026  
**Objetivo:** Centralizar visualização e atualização de metas por departamento, com controle granular de acesso (RBAC)

### Usuários
- **Total previsto:** 150-200 (não-simultâneos, esporádicos)
- **Papéis:** Gerente de RH, Colaborador

### Modelo de Negócio
Indicadores com:
- Departamento
- Responsável (colaborador)
- Nome do Indicador
- Peso (percentual)
- Atendimento (% alcançado)
- Status (Em Andamento, Concluído, Atrasado, etc.)
- Detalhamento / Observações

---

## 2. Escopo da Solução

### Etapa 1: Frontend Protótipo (sem backend)
- **Objetivo:** Validar UX/usabilidade antes de investimento em backend
- **Duração estimada:** 1-2 semanas
- **Saída:** Protótipo HTML/React com dados mockados
- **Objetivo de Aprovação:** Confirmar fluxo, permissões e interface

### Etapa 2: Backend + Persistência
- **Objetivo:** Implementar API REST, autenticação, persistência
- **Duração estimada:** 2-3 semanas
- **Integração:** Microsoft Graph (autenticação Entra ID)
- **Saída:** API funcional, integração Entra ID, BD PostgreSQL

### Etapa 3: Gráficos + Dashboards
- **Objetivo:** Visualizar KPIs por colaborador, por departamento, por período
- **Duração estimada:** 1-2 semanas
- **Saída:** Dashboards interativos, relatórios de progresso

---

## 3. Arquitetura de Alto Nível

### Stack Selecionada
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Frontend** | React 18 + TypeScript | Prototipagem rápida, escalável, comunidade |
| **Backend** | Node.js + Express | JavaScript full-stack, baixa latência |
| **Banco de Dados** | PostgreSQL | ACID, JSONB, relações complexas |
| **Autenticação** | Microsoft Entra ID (MS Graph) | Já integrado ao AD corporativo |
| **Hospedagem** | Azure App Service / Docker | Simples deploy, escalável |
| **Observabilidade** | Winston (logs) + opcional DataDog | Troubleshooting rápido |

### Componentes Principais
```
┌─────────────────────────────────────┐
│     Frontend (React)                │
│  ┌──────────────────────────────┐   │
│  │ Login MS Entra ID            │   │
│  │ Dashboard Colaborador        │   │
│  │ Dashboard Gerente RH         │   │
│  │ Indicadores (CRUD)           │   │
│  │ Gráficos / KPIs              │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
           ↓ API REST ↓
┌─────────────────────────────────────┐
│     Backend (Node.js + Express)     │
│  ┌──────────────────────────────┐   │
│  │ Auth Middleware (JWT+Graph)  │   │
│  │ Controllers (Indicadores)    │   │
│  │ Services (Lógica)            │   │
│  │ Repositories (BD)            │   │
│  │ Observabilidade              │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
           ↓ Queries ↓
┌─────────────────────────────────────┐
│     PostgreSQL                      │
│  ┌──────────────────────────────┐   │
│  │ users, indicators, updates   │   │
│  │ attachments (metadata)       │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 4. Controle de Acesso (RBAC)

### Papéis e Permissões

#### Gerente de RH
- Visualizar todos os indicadores (todos os colaboradores, todos os departamentos)
- Editar indicadores (nome, peso, status)
- Editar responsável (reatribuir colaborador)
- Visualizar histórico de alterações
- Exportar relatórios
- Visualizar gráficos consolidados

**Endpoints com acesso:**
- `GET /api/indicators` (todos)
- `PUT /api/indicators/:id` (editável)
- `GET /api/reports` (consolidado)
- `GET /api/charts` (KPIs gerenciais)

#### Colaborador
- Visualizar apenas seus indicadores (filtrado por login)
- Marcar indicador como "Concluído" (checkbox)
- Desmarcar indicador
- Anexar documento de comprovação (upload)
- Visualizar histórico pessoal
- **Não pode:** editar nomes, pesos, detalhes, reatribuir

**Endpoints com acesso:**
- `GET /api/indicators/me` (próprio)
- `PATCH /api/indicators/:id/complete` (apenas conclusão)
- `POST /api/indicators/:id/attachments` (upload)
- `GET /api/indicators/me/history` (histórico)

---

## 5. Estrutura de Dados

### Modelo de Entidades

#### `users`
```sql
id (UUID)
email (UNIQUE)
cpf (UNIQUE, nullable)
matricula (UNIQUE, nullable)
nome
departamento_id (FK)
role ('GERENTE_RH' | 'COLABORADOR')
microsoft_graph_id (para Entra ID)
ativo
criado_em
atualizado_em
```

#### `departamentos`
```sql
id (UUID)
nome (UNIQUE)
descricao
criado_em
```

#### `indicadores`
```sql
id (UUID)
departamento_id (FK) → departamentos
usuario_responsavel_id (FK) → users
nome
peso (DECIMAL 5,2) — percentual
status ('EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO')
atendimento (DECIMAL 5,2) — % alcançado
detalhamento (TEXT)
objetivo (TEXT)
data_inicio
data_fim
concluido_em (nullable)
criado_em
atualizado_em
```

#### `indicador_updates` (histórico)
```sql
id (UUID)
indicador_id (FK)
usuario_alterou_id (FK) → users
tipo_alteracao ('CRIACAO' | 'EDICAO' | 'CONCLUSAO' | 'REAGRUPA_RESPONSAVEL')
campo_alterado (ex: 'status', 'peso', 'atendimento')
valor_anterior (JSON)
valor_novo (JSON)
motivo (nullable)
criado_em
```

#### `attachments`
```sql
id (UUID)
indicador_id (FK)
usuario_id (FK) → users
nome_arquivo
url_s3 (ou caminho local)
tipo_mime
tamanho_bytes
criado_em
```

---

## 6. API REST — Etapa 2 (Backend)

### Autenticação
- **Tipo:** Bearer Token (JWT)
- **Fonte:** Microsoft Graph / Entra ID
- **Flow:** Login → Entra ID → JWT retornado → Armazenado no localStorage
- **Renovação:** Token refresh a cada 1h ou manualmente

### Endpoints

#### Autenticação
```
POST /api/auth/login
  Body: { token_entra_id }
  Response: { token, user { id, nome, role, departamento } }

POST /api/auth/logout
  Response: { success }

GET /api/auth/me
  Response: { user details }
```

#### Indicadores (Gerente RH)
```
GET /api/indicators?departamento=&status=&responsavel=
  Response: [ { id, nome, peso, atendimento, status, responsavel... } ]

POST /api/indicators
  Body: { departamento_id, usuario_responsavel_id, nome, peso, objetivo, data_inicio, data_fim }
  Response: { id, ... }

PUT /api/indicators/:id
  Body: { nome?, peso?, objetivo?, status?, atendimento?, detalhamento? }
  Response: { updated indicator }

PUT /api/indicators/:id/responsavel
  Body: { novo_usuario_responsavel_id }
  Response: { updated indicator + audit log }

DELETE /api/indicators/:id
  Response: { success }
```

#### Indicadores (Colaborador)
```
GET /api/indicators/me
  Response: [ { id, nome, peso, atendimento, status, detalhamento, anexos[] } ]

PATCH /api/indicators/:id/complete
  Body: { concluido: boolean }
  Response: { updated indicator + timestamp }

POST /api/indicators/:id/attachments
  Body: FormData { file }
  Response: { attachment { id, nome_arquivo, url, criado_em } }

DELETE /api/indicators/:id/attachments/:attachment_id
  Response: { success }

GET /api/indicators/me/history
  Response: [ { tipo_alteracao, campo, valor_anterior, valor_novo, alterado_em, alterado_por } ]
```

#### Relatórios (Gerente RH)
```
GET /api/reports/por-departamento?data_inicio=&data_fim=
  Response: {
    departamentos: [
      { nome, total_indicadores, concluidos, em_andamento, atrasados, % conclusao }
    ]
  }

GET /api/reports/por-colaborador/:user_id
  Response: { colaborador, indicadores: [ { nome, peso, atendimento, status } ] }

GET /api/charts/kpis?periodo=mensal&departamento=
  Response: { series: [ { mes, valor_realizacao, meta } ] }

GET /api/charts/por-responsavel
  Response: [ { responsavel, % conclusao, % atendimento } ]
```

---

## 7. Fluxos de Usuário

### Fluxo: Gerente RH — Visualizar e Editar Indicadores

1. **Login:** Clica em "Entrar com Microsoft" → Entra ID
2. **Dashboard:** Vê todos os indicadores, filtrados por departamento
3. **Edição:** Clica em indicador → Modal de edição (nome, peso, responsável, objetivo, status)
4. **Reatribuição:** Muda "Responsável" para outro colaborador
5. **Acompanhamento:** Vê % realizado, status, histórico de alterações
6. **Relatórios:** Exporta CSV com consolidado por departamento

### Fluxo: Colaborador — Marcar Conclusão

1. **Login:** Clica em "Entrar com Microsoft" → Entra ID
2. **Meu Dashboard:** Vê apenas seus indicadores (filtrado automaticamente)
3. **Marcar Concluído:** Checkbox no indicador → Marca como concluído
4. **Anexar Comprovação:** Botão "+" → Upload arquivo (PDF, imagem, DOC)
5. **Histórico:** Vê histórico pessoal (quando marcou, quando anexou)
6. **Confirmação:** Mensagem "Indicador marcado como concluído em [data/hora]"

---

## 8. Casos de Uso Críticos

### UC01: Reatribuição de Indicador
**Ator:** Gerente RH  
**Pré-condição:** Indicador existe, novo responsável existe  
**Fluxo:**
1. Gerente abre indicador
2. Clica em campo "Responsável"
3. Seleciona novo colaborador
4. Sistema registra: `indicador_updates { tipo: 'REAGRUPA_RESPONSAVEL', valor_anterior: user_antigo, valor_novo: user_novo }`
5. Email para novo responsável notificando a atribuição

### UC02: Marcar Indicador Concluído
**Ator:** Colaborador  
**Pré-condição:** Indicador atribuído ao usuário  
**Fluxo:**
1. Colaborador vê checkbox "Concluído"
2. Marca checkbox
3. Sistema registra timestamp em `indicadores.concluido_em`
4. Muda status para "CONCLUIDO"
5. Registra em `indicador_updates`
6. Permite anexo de documento

### UC03: Validação de Permissão
**Ator:** Sistema  
**Fluxo:**
1. Token JWT decodificado
2. Se role = 'COLABORADOR' + indicador não é seu → erro 403
3. Se role = 'GERENTE_RH' → acesso completo
4. Middleware bloqueia requisições não autorizadas

---

## 9. Segurança

### Princípios Aplicados
- **Autenticação:** Microsoft Entra ID (OAuth 2.0 / OIDC)
- **Autorização:** RBAC por role (JWT payload)
- **Validação:** Entrada validada no backend (não confiar em frontend)
- **Dados Sensíveis:** CPF, email criptografados ou hash
- **Secrets:** Variáveis de ambiente (.env)
- **CORS:** Apenas domínios autorizados
- **SQL Injection:** Prepared statements (ORM/QueryBuilder)
- **CSRF:** SameSite cookies + CSRF tokens se necessário
- **Logs:** Auditoria de alterações (`indicador_updates`)

### Checklist de Segurança
- [ ] Validação de entrada em todos os endpoints
- [ ] Rate limiting (ex: 100 req/min por IP)
- [ ] Logs de acesso com syslog ou CloudWatch
- [ ] Secrets não em código (usar .env)
- [ ] JWT expiração (1h)
- [ ] HTTPS obrigatório
- [ ] Headers de segurança (HSTS, CSP, X-Frame-Options)

---

## 10. Performance e Escalabilidade

### Requisitos Não-Funcionais
| Requisito | Alvo | Justificativa |
|-----------|------|---------------|
| Tempo de resposta (GET /indicators) | < 500ms | SLA aplicação |
| Concurrent users | 20-30 | Não-simultâneos |
| Disponibilidade | 99% | Não é crítico 24/7 |
| RPO (Recovery Point Objective) | 1 dia | Backup diário |
| RTO (Recovery Time Objective) | 4 horas | Infraestrutura não-crítica |

### Otimizações
- **Índices BD:** `usuario_id`, `departamento_id`, `status` em indicadores
- **Cache:** Redis para lista de usuários (TTL 1h) — opcional Etapa 2
- **Paginação:** 25 indicadores por página por padrão
- **Lazy Loading:** Gráficos carregados sob demanda

---

## 11. Infraestrutura — Etapa 2/3

### Propostas de Deploy

#### Opção A: Azure (Recomendada se usar Entra ID)
- App Service (Node.js)
- PostgreSQL Database
- Static Web Apps (React)
- Key Vault (secrets)

#### Opção B: Docker + Cloud Agnóstico
- Dockerfile (Node.js + Express)
- docker-compose.yml (local dev)
- Registry: Docker Hub / ECR / ACR
- Orquestração: Kubernetes (se escala, futuramente)

#### Opção C: Vercel (Frontend) + Heroku/Railway (Backend)
- Vercel: React deploy automático
- Railway/Heroku: Node.js + PostgreSQL
- Mais simples, menos controle

**Recomendação:** Opção A (Azure) ou B (Docker) para máximo controle.

---

## 12. Cronograma Proposto

| Etapa | Duração | Saída | Gatekeeper |
|-------|---------|-------|-----------|
| Etapa 1: Frontend Protótipo | 1-2 semanas | React + dados mockados | Aprovação UX/Negócio |
| Etapa 2: Backend + Entra ID | 2-3 semanas | API + autenticação | Testes integração |
| Etapa 3: Gráficos + Dashboard | 1-2 semanas | Relatórios + KPIs | UAT |
| **Total** | **4-7 semanas** | **MVP Completo** | Deploy Produção |

---

## 13. Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|--------|-----------|
| Atraso na integração Entra ID | Média | Alto | Spike técnico early; usar SDK Microsoft |
| Falta de aprovação protótipo | Baixa | Alto | Validar UX com stakeholders na Etapa 1 |
| Escalabilidade BD | Baixa | Médio | Índices; cache layer se latência > 500ms |
| Dados históricos inconsistentes | Média | Médio | Testes de integridade; audit logs |
| Downtime em produção | Baixa | Alto | Backup diário; rollback procedure |

---

## 14. Glossário

- **RBAC:** Role-Based Access Control (controle por função)
- **JWT:** JSON Web Token (token sem estado)
- **Entra ID:** Microsoft Azure Active Directory (autenticação)
- **Atendimento:** Percentual realizado de meta
- **Indicador:** Meta / KPI a ser acompanhado
- **Responsável:** Colaborador atribuído ao indicador
- **Gerente RH:** Usuário com permissão de editar indicadores

---

## 15. Próximos Passos

1. **Etapa 1 (Imediato):**
   - [ ] Inicializar projeto React
   - [ ] Desenhar componentes principais
   - [ ] Mockear dados (JSON estático)
   - [ ] Implementar navegação e filtros
   - [ ] Apresentar protótipo para aprovação

2. **Antes de Etapa 2:**
   - [ ] Aprovação de protótipo
   - [ ] Registrar aplicação no Entra ID (Microsoft)
   - [ ] Provisionar PostgreSQL (dev/staging)
   - [ ] Configurar CI/CD (GitHub Actions ou Azure Pipelines)

3. **Etapa 2 (Backend):**
   - [ ] Setup Node.js + Express
   - [ ] Implementar autenticação Entra ID
   - [ ] CRUD indicadores + repositories
   - [ ] Testes unitários e integração

---

**Documento versão:** 1.0  
**Última atualização:** 2026-09-08  
**Responsável:** Arquitetura de Software
