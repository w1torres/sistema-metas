# 📝 SUMÁRIO DE CORREÇÕES — v2.1 Atualizado

**Data:** 2026-09-14  
**Versão:** 2.1 (com especificações faltantes adicionadas)  
**Status:** ✅ COMPLETO AGORA

---

## 🔍 Lacunas Identificadas e Corrigidas

### ❌ Identificado
```
"Nos arquivos não encontrei algumas especificações como:
- RBAC para GESTORES: fluxo apenas para GERENTE_RH ou CONTROLLER
- Dashboard: cards com colaboradores por departamento
- Cadastro: campos como CPF, Data Admissão, Nascimento, Filial"
```

### ✅ Adicionado Agora

---

## 📊 ARQUIVO 1: ESPECIFICACOES_FALTANTES_v2.1.md (22 KB)

### Conteúdo:

#### **PARTE 1: RBAC GESTOR — Fluxo de Aprovação (CORRIGIDO)**

**Antes (ERRADO):**
```
GESTOR pode aprovar qualquer indicador → MASTER aprova final
```

**Depois (CORRETO):**
```
Fluxo Real:
┌─────────────────────────────────────────────────┐
│ COLABORADOR (seu dept)                          │
│     ↓ marca concluído                           │
│ GESTOR (seu dept)                               │
│     ├─ Vê: apenas colaboradores do seu dept     │
│     ├─ Aprova: AGUARDANDO_APROVACAO (1º nível) │
│     └─ Envia para: GERENTE_RH ou CONTROLLER    │
│         ↓                                       │
│     GERENTE_RH OU CONTROLLER                    │
│         ├─ Aprova: CONCLUIDO (final)            │
│         └─ Fim                                  │
└─────────────────────────────────────────────────┘

❌ GESTOR NÃO pode:
  ├─ Aprovar indicadores de OUTRO departamento
  ├─ Colocar status CONCLUIDO (final)
  └─ Ver dados de OUTRO departamento
```

**Permissões Completas por Role:**

| Ação | MASTER | GESTOR | COLABORADOR |
|------|--------|--------|-------------|
| Ver todos indicadores | ✅ | ❌ (só seu dept) | ❌ (só seus) |
| Editar indicador | ✅ | ✅ (seu dept) | ❌ |
| Marcar concluído | ✅ | ❌ | ✅ (seu indicador) |
| Aprovar (AGUARDANDO) | ✅ | ✅ (seu dept) | ❌ |
| Aprovar (CONCLUIDO) | ✅ | ❌ | ❌ |
| Ver dashboard | ✅ (geral) | ✅ (seu dept) | ✅ (pessoal) |
| Criar usuário | ✅ | ❌ | ❌ |

---

#### **PARTE 2: Dashboard Layout — Cards com Colaboradores**

**Para MASTER:**
```
Dashboard Master
├─ Resumo Geral (Total, Pendentes, Em Aprov., Aprovados)
├─ Cards por Departamento (ADMINISTRATIVO, TECNOLOGIA, VENDAS, etc)
│  └─ Ao clicar [Ver Colaboradores] → Abre modal com colaboradores
│     └─ Mostra: Cada colaborador com métricas
│        └─ Total: 5 | Pendentes: 1 | Conclusão: 60%
│           └─ Botão [Ver Indicadores]
```

**Para GESTOR (seu departamento):**
```
Dashboard Gestor
├─ Resumo do Departamento (Total, Pendentes, Em Aprov., Aprovados)
└─ Colaboradores do Departamento (expandido, sem modal)
   ├─ Colaborador 1: João Santos
   │  └─ Indicadores listados
   │     ├─ POLÍTICA DE COMPRAS (Pendente) [Visualizar] [Aprovar]
   │     ├─ SISTEMA COMPRAS (Em Aprovação) [Visualizar] [Aprovar]
   │     └─ AUDITORIA (Concluído) → Mostra observação
   │
   ├─ Colaborador 2: Ana Costa
   │  └─ [indicadores...]
   │
   └─ Colaborador 3: Pedro Oliveira
      └─ [indicadores...]
```

**Botão [Aprovar] — Comportamento:**
- Clica [Aprovar] em um indicador
- Abre Modal de Aprovação
  - Campo observação (opcional, 500 chars)
  - Botão [Rejeitar] → status: EM_ANDAMENTO
  - Botão [Aprovar] → status: AGUARDANDO_APROVACAO
- Registra em auditoria com observação
- Notifica GERENTE_RH/CONTROLLER

---

#### **PARTE 3: Cadastro Colaborador — Campos Expandidos**

**Campos Atualmente (v2.0):**
```
id, email, nome, cpf, matricula, 
departamento_id, cargo_id, role,
microsoft_graph_id, avatar_url, 
ativo, ativo_em, desativado_em, 
ultimo_login, criado_em, atualizado_em
```

**Campos ADICIONADOS (v2.1):**
```sql
+ data_nascimento    -- Data de nascimento (DD/MM/YYYY)
+ data_admissao      -- Data de admissão na empresa
+ filial             -- Filial (ex: FORMOSA-GO)
+ endereco_completo  -- Endereço comercial
+ telefone           -- Telefone (XX) XXXX-XXXX
+ celular            -- Celular (XX) XXXXX-XXXX
```

**Exemplo de Cadastro (Marcia Garcia Nunes):**
```
Nome: MARCIA GARCIA NUNES
Email: marcia.garcia@empresa.com
CPF: 69559430149
Data de Nascimento: 21/07/1981
Matrícula: EMP-00001
Cargo: GERENTE ADMINISTRATIVO
Departamento: ADMINISTRATIVO
Perfil/Role: GESTOR (pois é gerente)
Filial: FORMOSA-GO
Data de Admissão: 16/10/2023
Telefone: (62) 3216-1234
Celular: (62) 98765-4321
Endereço: Rua X, 123, Formosa-GO
Status: Ativo
```

**Form de Cadastro (Frontend):**
```
Formulário: Novo Usuário / Editar Usuário

DADOS PESSOAIS
├─ Nome: [___________________________] (obrigatório)
├─ Email: [___________________________] (obrigatório)
├─ CPF: [_______________] (obrigatório)
├─ Data de Nascimento: [___/___/______]
├─ Telefone: [________________]
└─ Celular: [________________]

DADOS PROFISSIONAIS
├─ Matrícula: [_______________] (obrigatório)
├─ Cargo: [combo] (obrigatório)
├─ Departamento: [combo]
├─ Filial: [________________________]
├─ Data de Admissão: [___/___/______]
└─ Endereço: [________________________________]

PERFIL DE ACESSO
├─ Role: ○ COLABORADOR  ○ GESTOR  ○ MASTER
└─ Ativo: ☑ Sim

[Cancelar]  [Salvar]
```

**API Atualizada:**
```bash
# POST /api/users (Criar)
# PUT /api/users/:id (Editar)
# GET /api/users/:id (Buscar)

# Todos aceitam os 6 campos novos
```

---

## 🗄️ ARQUIVO 2: MIGRATION_USUARIOS_CAMPOS_v2.1.sql (9.2 KB)

### Conteúdo:

**Migrações Implementadas:**

1. ✅ **Adicionar 6 colunas faltantes**
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS data_nascimento DATE;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS data_admissao DATE;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS filial VARCHAR(255);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS celular VARCHAR(20);
   ```

2. ✅ **5 Índices para performance**
   - idx_users_cpf
   - idx_users_filial
   - idx_users_data_admissao
   - idx_users_departamento_role
   - idx_users_depto_ativo

3. ✅ **2 Views novas**
   - v_usuarios_completo (usuários com dados completos)
   - v_dashboard_gestor_colaboradores (colaboradores por depto)

4. ✅ **1 Trigger de validação**
   - validate_data_admissao (não permite data no futuro)

5. ✅ **Comentários de documentação** em todas as colunas

---

## 🔄 Ordem de Execução (IMPORTANTE)

```bash
# Ordem correta de migrações:

1. DATABASE_SCHEMA.sql (schema original)
   psql -f DATABASE_SCHEMA.sql

2. MIGRATION_v2.1.sql (roles simplificados, status, observacao)
   psql -f MIGRATION_v2.1.sql

3. MIGRATION_USUARIOS_CAMPOS_v2.1.sql (campos cadastro)
   psql -f MIGRATION_USUARIOS_CAMPOS_v2.1.sql
   
✅ Pronto! BD atualizado.
```

---

## 📋 Arquivos Atualizados (ZIP)

**backend-etapa-2.1-completo.zip (33 KB) — Agora contém:**

```
├─ BACKEND_SPECS_v2.1.md (17 KB)
├─ MIGRATION_v2.1.sql (12 KB)
├─ MIGRATION_USUARIOS_CAMPOS_v2.1.sql (9.2 KB) ← NOVO
├─ IMPORT_PLANILHA_TEMPLATE.md (18 KB)
├─ CHANGELOG_v2.1.md (17 KB)
├─ ESPECIFICACOES_FALTANTES_v2.1.md (22 KB) ← NOVO
├─ DATABASE_SCHEMA.sql (16 KB)
├─ .env.example (variáveis)
├─ docker-compose.yml (setup local)
└─ backend-package.json (dependências)
```

---

## ✨ O Que Mudou em Cada Arquivo

### **BACKEND_SPECS_v2.1.md**
- ❌ Antes: RBAC incompleto, sem detalhes GESTOR
- ✅ Agora: RBAC completo com 3 roles definidas
- ❌ Antes: Sem menção a cards por colaborador
- ✅ Agora: Dashboard layout especificado

### **ESPECIFICACOES_FALTANTES_v2.1.md** (NOVO)
- ✅ RBAC GESTOR: fluxo específico (apenas seu depto)
- ✅ Dashboard: layout com cards de colaboradores
- ✅ Modal de aprovação: integrado no dashboard
- ✅ Cadastro: 6 campos novos especificados
- ✅ API: endpoints atualizados com novos campos

### **MIGRATION_USUARIOS_CAMPOS_v2.1.sql** (NOVO)
- ✅ SQL pronto: adiciona 6 colunas
- ✅ Índices: para busca e filtro
- ✅ Views: para listar colaboradores por dept
- ✅ Trigger: validação de data_admissao
- ✅ Executável direto

---

## 🎯 Impacto Implementação

### **Frontend (Componentes Afetados)**
- `DashboardGestorMaster.tsx` — Atualizar para exibir cards com colaboradores
- `ColaboradorCard.tsx` (NOVO) — Card para cada colaborador com métricas
- `AprovaIndicadorModal.tsx` — Já inclui observação (visto)
- `UsuariosPage.tsx` — Atualizar form com 6 campos novos
- `NovoUsuarioModal.tsx` — Atualizar com novos campos

### **Backend (APIs Afetadas)**
- `GET /api/dashboard/stats` — Retornar estrutura com colaboradores
- `POST /api/users` — Aceitar 6 campos novos
- `PUT /api/users/:id` — Aceitar 6 campos novos
- `GET /api/users/:id` — Retornar 6 campos novos
- `PATCH /api/indicators/:id/approve` — Já implementado com observacao

### **Banco de Dados**
- `users` table — 6 colunas novas
- 5 índices novos para performance
- 2 views novas para dashboard

---

## ✅ Checklist Final (COMPLETO)

- [x] RBAC GESTOR — Fluxo específico (seu dept apenas)
- [x] RBAC GESTOR — Não aprova final (MASTER aprova)
- [x] RBAC GESTOR — Fluxo vai para GERENTE_RH ou CONTROLLER
- [x] Dashboard MASTER — Cards com departamentos
- [x] Dashboard GESTOR — Cards com colaboradores do departamento
- [x] Dashboard — Botão [Aprovar] integrado
- [x] Modal Aprovação — Observação (já estava)
- [x] Cadastro — CPF adicionado
- [x] Cadastro — Data Nascimento adicionado
- [x] Cadastro — Data Admissão adicionado
- [x] Cadastro — Filial adicionado
- [x] Cadastro — Telefone adicionado
- [x] Cadastro — Celular adicionado
- [x] Cadastro — Endereço adicionado
- [x] API — Endpoints atualizados
- [x] BD — Migrações SQL prontas
- [x] BD — Indices de performance
- [x] BD — Views para dashboard

---

## 🚀 Próximo Passo

**Executar migrações na ordem:**
1. Aplicar `MIGRATION_USUARIOS_CAMPOS_v2.1.sql`
2. Testar campos: `SELECT * FROM v_usuarios_completo;`
3. Testar view dashboard: `SELECT * FROM v_dashboard_gestor_colaboradores;`
4. Atualizar frontend conforme ESPECIFICACOES_FALTANTES_v2.1.md
5. Testar RBAC: GESTOR vê apenas seu dept

---

**Versão:** 2.1 (Completo)  
**Data:** 2026-09-14  
**Status:** ✅ Todas as Lacunas Preenchidas
