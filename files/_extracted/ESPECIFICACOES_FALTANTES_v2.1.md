# 🔐 ESPECIFICAÇÕES FALTANTES v2.1 — RBAC, Dashboard, Cadastro Colaborador

**Data:** 2026-09-12  
**Versão:** 2.1 (Complemento)  
**Status:** Adiciona lacunas identificadas

---

## 🔐 PARTE 1: RBAC GESTOR — Fluxo de Aprovação (CORRIGIDO)

### Entendimento Anterior (ERRADO)
```
GESTOR pode aprovar qualquer indicador
├─ Marca como AGUARDANDO_APROVACAO
└─ MASTER aprova final
```

### Entendimento Correto (v2.1)

**GESTOR SÓ aprova indicadores que estão em seu departamento**
- Apenas colaboradores DO SEU DEPARTAMENTO
- Fluxo: Colaborador marca → GESTOR aprova → **GERENTE_RH OU CONTROLLER** aprova final

```
Fluxo Correto:

COLABORADOR (dept: ADMINISTRATIVO)
    ↓ marca concluído
GESTOR (dept: ADMINISTRATIVO)
    ├─ Vê: colaboradores do ADMINISTRATIVO
    ├─ Aprova: "AGUARDANDO_APROVACAO" (apenas seu dept)
    └─ Envia para: GERENTE_RH ou CONTROLLER
         ↓
    GERENTE_RH OU CONTROLLER
         ├─ Vê: TODOS os indicadores aguardando
         ├─ Aprova: CONCLUIDO
         └─ Fim

❌ GESTOR NÃO pode:
    ├─ Aprovar indicadores de outro departamento
    ├─ Colocar status CONCLUIDO (final)
    └─ Ver dados de outro departamento
```

---

### Roles Definição Completa (v2.1)

#### MASTER
```
Acesso: TUDO

Indicadores:
  ├─ GET: Todos os indicadores (todos os departamentos)
  ├─ POST: Criar novo indicador (qualquer departamento)
  ├─ PUT: Editar qualquer indicador
  ├─ DELETE: Deletar qualquer indicador
  └─ Aprovação: CONCLUIDO (final)

Dashboard:
  ├─ Ver: Resumo geral
  ├─ Ver: Por departamento (todos)
  ├─ Ver: Por colaborador (todos)
  ├─ Cards: Todos os departamentos com colaboradores

Usuários:
  ├─ Criar
  ├─ Editar (incluindo role)
  ├─ Ativar/Desativar
  └─ Ver histórico global

Relatórios:
  └─ Global + por departamento + por colaborador
```

#### GESTOR
```
Acesso: SEU DEPARTAMENTO

Indicadores:
  ├─ GET: Apenas do seu departamento
  │   └─ Todos colaboradores do seu departamento
  ├─ POST: Criar indicador (seu departamento)
  ├─ PUT: Editar indicador (seu departamento)
  ├─ DELETE: ❌ NÃO pode
  └─ Aprovação: AGUARDANDO_APROVACAO (1º nível)
      ├─ Recebe: Indicadores marcados como "concluído"
      ├─ Valida: Conforme critérios
      ├─ Aprova: Envia para GERENTE_RH/CONTROLLER
      └─ Rejeita: Volta para EM_ANDAMENTO

Dashboard:
  ├─ Ver: Resumo do seu departamento
  ├─ Ver: Por colaborador (seu departamento)
  ├─ Cards: Colaboradores do seu departamento
  └─ ❌ NÃO vê: Outro departamento

Usuários:
  ├─ Ver: Apenas do seu departamento
  ├─ Editar: ❌ NÃO pode
  └─ ❌ NÃO pode: Criar, deletar, alterar role

Relatórios:
  └─ Apenas seu departamento
```

#### COLABORADOR
```
Acesso: SEUS INDICADORES

Indicadores:
  ├─ GET: Apenas seus indicadores
  ├─ PATCH /complete: Marca como "concluído"
  │   ├─ Status muda: EM_ANDAMENTO → AGUARDANDO_APROVACAO
  │   └─ Vai para: GESTOR do seu departamento
  ├─ POST /attachments: Anexar documentos
  ├─ GET /attachments: Ver anexos próprios
  └─ ❌ NÃO pode: Editar, deletar, aprovar

Dashboard:
  ├─ Ver: Apenas seus indicadores
  ├─ Ver: Status e histórico pessoal
  └─ Ver: Feedback de aprovação/rejeição

Usuários:
  └─ Apenas dados próprios
```

---

## 📊 PARTE 2: Dashboard Layout — Cards com Colaboradores

### Dashboard MASTER

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Master                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ RESUMO GERAL                                                │
│ ┌──────┬──────────┬──────────┬───────────┐                 │
│ │Total │Pendentes │Em Aprov. │Aprovados  │                 │
│ │ 42   │   15     │    8     │    19     │                 │
│ └──────┴──────────┴──────────┴───────────┘                 │
│                                                             │
│ DEPARTAMENTOS (Cards - Scroll Horizontal)                  │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│ │ADMINISTRATIVO    │ │TECNOLOGIA        │ │VENDAS        │ │
│ ├──────────────────┤ ├──────────────────┤ ├──────────────┤ │
│ │Total: 10         │ │Total: 12         │ │Total: 8      │ │
│ │Pendentes: 3      │ │Pendentes: 5      │ │Pendentes: 2  │ │
│ │Conclusão: 50%    │ │Conclusão: 33%    │ │Conclusão: 62%│ │
│ │                  │ │                  │ │              │ │
│ │[Ver Colaboradores]│ │[Ver Colaboradores]│ │[Ver Colab]   │ │
│ └──────────────────┘ └──────────────────┘ └──────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Ao clicar [Ver Colaboradores] → Abre modal com colaboradores:

┌─────────────────────────────────────────────────────────────┐
│ Colaboradores — ADMINISTRATIVO                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ João Santos (Analista Admin)                         │   │
│ │ Total: 5 | Pendentes: 1 | Conclusão: 60%            │   │
│ │ [Ver Indicadores]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Ana Costa (Coordenadora Admin)                       │   │
│ │ Total: 3 | Pendentes: 1 | Conclusão: 66%            │   │
│ │ [Ver Indicadores]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Pedro Oliveira (Gerente)                             │   │
│ │ Total: 2 | Pendentes: 1 | Conclusão: 50%            │   │
│ │ [Ver Indicadores]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ [Fechar]                                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Dashboard GESTOR

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard — Departamento: ADMINISTRATIVO                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ RESUMO DO DEPARTAMENTO                                  │
│ ┌──────┬──────────┬──────────┬───────────┐             │
│ │Total │Pendentes │Em Aprov. │Aprovados  │             │
│ │ 10   │    3     │    2     │    5      │             │
│ │      │          │          │           │             │
│ └──────┴──────────┴──────────┴───────────┘             │
│                                                          │
│ COLABORADORES DO DEPARTAMENTO                           │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ João Santos                                          │ │
│ │ Cargo: Analista Administrativo                       │ │
│ │ Total: 5 | Pendentes: 1 | Em Aprov.: 1 | Concluído: 3 │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ □ POLÍTICA DE COMPRAS (Pendente)              │  │ │
│ │ │   Peso: 20 | Objetivo: Estabelecer diretr...  │  │ │
│ │ │   [Visualizar] [Aprovar]                      │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ □ SISTEMA COMPRAS (Em Aprovação)              │  │ │
│ │ │   Peso: 25 | Objetivo: Implementar sistema...  │  │ │
│ │ │   [Visualizar] [Aprovar]                      │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ ✓ AUDITORIA INTERNA (Concluído)              │  │ │
│ │ │   Peso: 30 | Objetivo: Realizar auditoria...  │  │ │
│ │ │   Aprovado em: 10/09/2026                     │  │ │
│ │ │   Observação: Indicador validado conforme...  │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Ana Costa                                            │ │
│ │ Cargo: Coordenadora Administrativa                   │ │
│ │ Total: 3 | Pendentes: 1 | Em Aprov.: 1 | Concluído: 1 │
│ │ [...indicadores...]                                  │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Botão [Aprovar] — Fluxo no Dashboard GESTOR

**Ao clicar [Aprovar] em um indicador:**

```
1. Abre Modal de Aprovação
2. Mostra:
   - Nome do indicador
   - Responsável
   - Dados do indicador
   - Campo de observação (opcional)
3. Gestores escolhe:
   - [Rejeitar] → status volta EM_ANDAMENTO
   - [Aprovar] → status fica AGUARDANDO_APROVACAO
4. Envia para GERENTE_RH ou CONTROLLER revisar
```

---

## 👥 PARTE 3: Cadastro Colaborador — Campos Expandidos

### Campos Atualmente no BD (v2.0)
```sql
users:
  id, email, nome, cpf, matricula, 
  departamento_id, cargo_id, role, 
  microsoft_graph_id, avatar_url, 
  ativo, ativo_em, desativado_em, 
  ultimo_login, criado_em, atualizado_em
```

### Campos NECESSÁRIOS (v2.1 — Adicionar)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_admissao DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS filial VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS celular VARCHAR(20);
```

---

### Tabela: users (ATUALIZADO)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Autenticação
  email VARCHAR(255) UNIQUE NOT NULL,
  microsoft_graph_id VARCHAR(255) UNIQUE,
  
  -- Dados Pessoais
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  data_nascimento DATE,
  
  -- Dados Profissionais
  matricula VARCHAR(50) UNIQUE,
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'COLABORADOR'
    CHECK (role IN ('MASTER', 'GESTOR', 'COLABORADOR')),
  
  -- Informações de Empresa
  filial VARCHAR(255),
  data_admissao DATE,
  endereco_completo TEXT,
  telefone VARCHAR(20),
  celular VARCHAR(20),
  
  -- Perfil / Avatar
  avatar_url TEXT,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  ativo_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  desativado_em TIMESTAMP,
  ultimo_login TIMESTAMP,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Form de Cadastro Colaborador (Frontend)

```
Formulário: Novo Usuário / Editar Usuário

┌─────────────────────────────────────────────────────┐
│ Cadastro de Colaborador                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ DADOS PESSOAIS                                      │
│ Nome: [___________________________] (obrigatório)   │
│ Email: [___________________________] (obrigatório)  │
│ CPF: [_______________] (obrigatório)                │
│ Data de Nascimento: [___/___/______]                │
│ Telefone: [________________]                        │
│ Celular: [________________]                         │
│                                                     │
│ DADOS PROFISSIONAIS                                 │
│ Matrícula: [_______________] (obrigatório)          │
│ Cargo: [________________________] (combo, obrig.)    │
│ Departamento: [________________________] (combo)     │
│ Filial: [________________________]                  │
│ Data de Admissão: [___/___/______]                  │
│ Endereço: [________________________________]        │
│                                                     │
│ PERFIL DE ACESSO                                    │
│ Role: ○ COLABORADOR  ○ GESTOR  ○ MASTER            │
│        (Colaborador é padrão)                       │
│                                                     │
│ Ativo: ☑ Sim                                        │
│                                                     │
│ [Cancelar]  [Salvar]                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Exemplo de Dados para Persistir

```
Colaborador: MARCIA GARCIA NUNES
Email: marcia.garcia@empresa.com (gerado ou informado)
CPF: 69559430149
Data de Nascimento: 21/07/1981
Cargo: GERENTE ADMINISTRATIVO
Perfil/Role: GESTOR (pois é gerente)
Data de Admissão: 16/10/2023
Departamento: ADMINISTRATIVO
Filial: FORMOSA-GO
Telefone: (62) 3216-1234
Celular: (62) 98765-4321
Endereço: Rua X, 123, Formosa-GO
Status: Ativo
```

---

### API: POST /api/users (ATUALIZADO)

**Request:**
```json
{
  "nome": "MARCIA GARCIA NUNES",
  "email": "marcia.garcia@empresa.com",
  "cpf": "69559430149",
  "data_nascimento": "1981-07-21",
  "matricula": "EMP-00123",
  "departamento_id": "uuid-administrativo",
  "cargo_id": "uuid-gerente-admin",
  "role": "GESTOR",
  "filial": "FORMOSA-GO",
  "data_admissao": "2023-10-16",
  "telefone": "(62) 3216-1234",
  "celular": "(62) 98765-4321",
  "endereco_completo": "Rua X, 123, Formosa-GO"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-novo",
    "nome": "MARCIA GARCIA NUNES",
    "email": "marcia.garcia@empresa.com",
    "cpf": "69559430149",
    "data_nascimento": "1981-07-21",
    "matricula": "EMP-00123",
    "cargo": "GERENTE ADMINISTRATIVO",
    "departamento": "ADMINISTRATIVO",
    "role": "GESTOR",
    "filial": "FORMOSA-GO",
    "data_admissao": "2023-10-16",
    "telefone": "(62) 3216-1234",
    "celular": "(62) 98765-4321",
    "endereco_completo": "Rua X, 123, Formosa-GO",
    "ativo": true,
    "criado_em": "2026-09-12T14:30:00Z"
  }
}
```

---

### API: PUT /api/users/:id (ATUALIZADO)

**Request (apenas campos a atualizar):**
```json
{
  "nome": "MARCIA GARCIA NUNES",
  "data_nascimento": "1981-07-21",
  "filial": "BRASÍLIA-DF",
  "telefone": "(61) 3216-5678",
  "celular": "(61) 98765-9999",
  "endereco_completo": "Rua Y, 456, Brasília-DF"
}
```

---

### API: GET /api/users/:id (ATUALIZADO)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "MARCIA GARCIA NUNES",
    "email": "marcia.garcia@empresa.com",
    "cpf": "69559430149",
    "data_nascimento": "1981-07-21",
    "matricula": "EMP-00123",
    "cargo": "GERENTE ADMINISTRATIVO",
    "departamento": "ADMINISTRATIVO",
    "role": "GESTOR",
    "filial": "FORMOSA-GO",
    "data_admissao": "2023-10-16",
    "telefone": "(62) 3216-1234",
    "celular": "(62) 98765-4321",
    "endereco_completo": "Rua X, 123, Formosa-GO",
    "ativo": true,
    "ultimo_login": "2026-09-12T10:30:00Z"
  }
}
```

---

## 📊 PARTE 4: Verificações de RBAC no Frontend

### Por Role — O que VÊ no Dashboard

#### MASTER Vê:
```
✅ Dashboard Geral
✅ Cards com TODOS os departamentos
✅ Ao clicar depto → Ver TODOS colaboradores
✅ Ao clicar colaborador → Ver TODOS seus indicadores
✅ Botão [Aprovar] em TODOS indicadores
✅ Aprovação final (CONCLUIDO)
```

#### GESTOR Vê:
```
✅ Dashboard SEU Departamento (apenas)
✅ Cards com colaboradores DO SEU DEPARTAMENTO
✅ Ao clicar colaborador → Ver indicadores
✅ Botão [Aprovar] APENAS indicadores seu dept
✅ Aprovação 1º nível (AGUARDANDO_APROVACAO)
❌ NÃO vê outros departamentos
❌ NÃO aprova final (CONCLUIDO)
```

#### COLABORADOR Vê:
```
✅ Dashboard Pessoal
✅ SEUS indicadores apenas
✅ Status e histórico
✅ Botão [Marcar Concluído]
✅ Feedback de aprovação/rejeição
❌ NÃO vê indicadores de outros
❌ NÃO aprova indicadores
```

---

## 🔄 Migrações SQL Necessárias

```sql
-- Adicionar colunas faltantes
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS data_admissao DATE,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS filial VARCHAR(255),
  ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS celular VARCHAR(20);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_filial ON users(filial);
CREATE INDEX IF NOT EXISTS idx_users_data_admissao ON users(data_admissao);
```

---

## ✅ Checklist — Especificações Faltantes (AGORA ADICIONADAS)

- [x] RBAC GESTOR — Fluxo claro (apenas seu dept)
- [x] Dashboard Layout — Cards com colaboradores
- [x] Botão [Aprovar] — Fica no dashboard após expandir colaborador
- [x] Campos Cadastro — CPF, Data Admissão, Nascimento, Filial, etc
- [x] API atualizada — POST/PUT/GET com novos campos
- [x] Migrações SQL — Adicionar colunas faltantes

---

**Versão:** 2.1 (Complemento)  
**Data:** 2026-09-12  
**Status:** ✅ Especificações Completas Agora
