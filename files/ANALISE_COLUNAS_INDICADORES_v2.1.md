# 🔍 ANÁLISE: Colunas da Tabela INDICADORES vs Template Esperado

**Data:** 2026-09-14  
**Versão:** v2.1 (Ajuste)  
**Status:** Lacunas Identificadas + Soluções Propostas

---

## 📋 COMPARAÇÃO: Template vs Schema Atual

### Template do Usuário (Esperado)

```
Pilar | Indicador/Meta | Descrição | Meta | Forma de Medição | 
Evidência Obrigatória | Tabela de Atingimento (Redutor) | Peso
```

### Schema Atual (DATABASE_SCHEMA.sql)

```sql
CREATE TABLE indicadores (
  id, departamento_id, usuario_responsavel_id, nome, peso,
  status, atendimento, detalhamento, objetivo, data_inicio, 
  data_fim, concluido_em, criado_em, atualizado_em,
  funcao, pilar, meta, forma_medicao, evidencia_obrigatoria
)
```

---

## ✅ COLUNAS EXISTENTES (CORRETAS)

| Esperado | Atual | Tipo | Status |
|----------|-------|------|--------|
| **Pilar** | `pilar` | VARCHAR(255) | ✅ OK |
| **Indicador / Meta** | `nome` | VARCHAR(255) | ✅ OK |
| **Descrição** | `detalhamento` + `objetivo` | TEXT | ✅ OK (2 campos) |
| **Meta** | `meta` | TEXT | ✅ OK |
| **Forma de Medição** | `forma_medicao` | TEXT | ✅ OK |
| **Evidência Obrigatória** | `evidencia_obrigatoria` | TEXT | ✅ OK |
| **Peso** | `peso` | DECIMAL(5,2) | ✅ OK |

---

## ❌ COLUNAS FALTANDO

### 1. **Tabela de Atingimento (Redutor)** ← CRÍTICO

**Problema:**
```
Não existe coluna para mapear a tabela de atingimento/redutor
Exemplo esperado:
  Atendimento: 85%
  Tabela de Atingimento: 
    ├─ 0-50%: Não atende (0%)
    ├─ 51-75%: Parcial (50%)
    ├─ 76-100%: Atende (100%)
  Resultado Final: 85% → Atende → 100% para PPR
```

**Solução:**
```sql
-- Opção A: Adicionar coluna de referência
ALTER TABLE indicadores ADD COLUMN tabela_atingimento_id UUID 
  REFERENCES tabelas_atingimento(id);

-- Opção B: Adicionar multiplicador direto
ALTER TABLE indicadores ADD COLUMN multiplicador_ppr DECIMAL(3,2) 
  DEFAULT 1.00;
  -- 1.00 = atende 100%
  -- 0.50 = atende 50%
  -- 0.00 = não atende
```

**Recomendação:** Criar tabela `tabelas_atingimento` + adicionar `tabela_atingimento_id` em `indicadores`

---

## 🔑 REFERÊNCIAS ESPERADAS (Além do ID)

### Esperadas pelo Usuário

```
- ID Colaborador: usuario_responsavel_id ✓ (existe)
- Filial: ? (falta)
- Departamento: departamento_id ✓ (existe)
- Cargo: ? (falta)
- Perfil/Role: ? (falta)
```

### Situação Atual

#### ✅ EXISTE
```sql
usuario_responsavel_id → users(id)  [FK válida]
departamento_id → departamentos(id) [FK válida]
```

#### ❌ FALTA (Mas estão em users via join)
```
Filial     (users.filial via join usuario_responsavel_id)
Cargo      (users.cargo_id via join usuario_responsavel_id)
Role/Perfil (users.role via join usuario_responsavel_id)
```

---

## 🔧 OPÇÕES DE SOLUÇÃO

### Opção 1: DESNORMALIZAR (Replicar em indicadores)

**Pros:**
- Query mais rápida (sem join)
- Histórico preservado (se colaborador muda de cargo)
- Fácil filtrar por cargo/filial/role

**Cons:**
- Redundância de dados
- Precisa atualizar ao editar usuário

```sql
ALTER TABLE indicadores ADD COLUMN (
  cargo_id UUID REFERENCES cargos(id),
  filial VARCHAR(255),
  role VARCHAR(50)
);

-- Exemplo:
-- usuario_responsavel_id: uuid-joao
-- cargo_id: uuid-gerente-admin
-- filial: FORMOSA-GO
-- role: GESTOR
```

### Opção 2: DESNORMALIZAR COM HISTÓRICO (Melhor)

**Pros:**
- Preserva estado na época da criação
- Query rápida
- Auditoria completa

**Cons:**
- Mais colunas

```sql
ALTER TABLE indicadores ADD COLUMN (
  -- Snapshot do usuário na criação
  usuario_nome VARCHAR(255),
  usuario_cargo_id UUID REFERENCES cargos(id),
  usuario_cargo_nome VARCHAR(255),
  usuario_filial VARCHAR(255),
  usuario_role VARCHAR(50),
  usuario_departamento_id UUID REFERENCES departamentos(id),
  usuario_departamento_nome VARCHAR(255)
);

-- Exemplo:
-- usuario_responsavel_id: uuid-joao
-- usuario_nome: João Santos
-- usuario_cargo_id: uuid-gerente
-- usuario_cargo_nome: Gerente Administrativo
-- usuario_filial: FORMOSA-GO
-- usuario_role: GESTOR
-- usuario_departamento_id: uuid-admin
-- usuario_departamento_nome: ADMINISTRATIVO
```

### Opção 3: JOIN DINÂMICO (Sem Desnormalizar)

**Pros:**
- Sem redundância
- Sempre atualizado

**Cons:**
- Query mais lenta (join)
- Não preserva histórico se usuário muda

```sql
-- Query:
SELECT 
  i.*,
  u.nome as usuario_nome,
  u.filial as usuario_filial,
  u.role as usuario_role,
  c.nome as cargo_nome,
  d.nome as departamento_nome
FROM indicadores i
JOIN users u ON i.usuario_responsavel_id = u.id
LEFT JOIN cargos c ON u.cargo_id = c.id
LEFT JOIN departamentos d ON u.departamento_id = d.id;
```

---

## 🎯 RECOMENDAÇÃO FINAL

### Solução Proposta: OPÇÃO 2 (Desnormalizar com Histórico)

**Por quê:**
- Preserva estado histórico (auditoría)
- Query rápida (sem joins)
- Fácil filtrar indicadores por filial/cargo/role
- Não quebra se usuário sair da empresa

**Implementação:**

```sql
-- 1. CRIAR TABELA DE ATINGIMENTO (para o Redutor)
CREATE TABLE tabelas_atingimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  faixas JSONB,  -- [{min: 0, max: 50, resultado: 0}, ...]
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exemplo de dados:
INSERT INTO tabelas_atingimento (nome, descricao, faixas) VALUES (
  'Padrão PPR',
  'Tabela padrão de atingimento para PPR',
  '[
    {"min": 0, "max": 50, "resultado": 0, "descricao": "Não Atende"},
    {"min": 51, "max": 75, "resultado": 0.5, "descricao": "Parcial"},
    {"min": 76, "max": 100, "resultado": 1.0, "descricao": "Atende"}
  ]'::jsonb
);

-- 2. ADICIONAR COLUNAS EM INDICADORES
ALTER TABLE indicadores ADD COLUMN (
  -- Tabela de Atingimento (Redutor)
  tabela_atingimento_id UUID REFERENCES tabelas_atingimento(id),
  
  -- Snapshot do usuário (histórico)
  usuario_nome VARCHAR(255),
  usuario_cargo_id UUID REFERENCES cargos(id),
  usuario_cargo_nome VARCHAR(255),
  usuario_filial VARCHAR(255),
  usuario_role VARCHAR(50),
  usuario_departamento_id UUID REFERENCES departamentos(id),
  usuario_departamento_nome VARCHAR(255)
);

-- 3. CRIAR VIEW PARA SIMPLIFICAR QUERIES
CREATE OR REPLACE VIEW v_indicadores_completo AS
SELECT 
  i.*,
  ta.nome as tabela_atingimento_nome,
  -- Calcular resultado final com tabela de atingimento
  CASE 
    WHEN ta.faixas IS NOT NULL THEN
      (SELECT (f->>'resultado')::DECIMAL
       FROM jsonb_array_elements(ta.faixas) AS f
       WHERE (f->>'min')::INT <= i.atendimento 
         AND (f->>'max')::INT >= i.atendimento)
    ELSE i.atendimento / 100.0  -- Default: percentual direto
  END AS resultado_ppr
FROM indicadores i
LEFT JOIN tabelas_atingimento ta ON i.tabela_atingimento_id = ta.id;
```

---

## 📊 SCHEMA FINAL (v2.1 - CORRIGIDO)

```sql
CREATE TABLE indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- REFERÊNCIAS PRINCIPAIS
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  usuario_responsavel_id UUID NOT NULL REFERENCES users(id),
  safra_id UUID NOT NULL REFERENCES safras(id),
  
  -- DADOS BÁSICOS
  nome VARCHAR(255) NOT NULL,
  peso DECIMAL(5, 2) NOT NULL CHECK (peso >= 0 AND peso <= 100),
  
  -- STATUS E PROGRESSO
  status VARCHAR(50) NOT NULL DEFAULT 'EM_ANDAMENTO'
    CHECK (status IN ('EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'CONCLUIDO', 'ATRASADO', 'PAUSADO')),
  atendimento DECIMAL(5, 2) DEFAULT 0 CHECK (atendimento >= 0 AND atendimento <= 100),
  
  -- DESCRIÇÃO E DETALHES
  objetivo TEXT NOT NULL,
  detalhamento TEXT,
  pilar VARCHAR(255),
  meta TEXT,
  forma_medicao TEXT,
  evidencia_obrigatoria TEXT,
  funcao VARCHAR(255),
  
  -- TABELA DE ATINGIMENTO (NOVO) ← CRÍTICO
  tabela_atingimento_id UUID REFERENCES tabelas_atingimento(id),
  
  -- SNAPSHOT DO USUÁRIO (NOVO) ← Histórico
  usuario_nome VARCHAR(255),
  usuario_cargo_id UUID REFERENCES cargos(id),
  usuario_cargo_nome VARCHAR(255),
  usuario_filial VARCHAR(255),
  usuario_role VARCHAR(50) CHECK (usuario_role IN ('MASTER', 'GESTOR', 'COLABORADOR')),
  usuario_departamento_id UUID REFERENCES departamentos(id),
  usuario_departamento_nome VARCHAR(255),
  
  -- DATAS
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  concluido_em TIMESTAMP,
  
  -- AUDITORIA
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_indicador_datas CHECK (data_fim >= data_inicio)
);

-- ÍNDICES
CREATE INDEX idx_indicadores_usuario_responsavel ON indicadores(usuario_responsavel_id);
CREATE INDEX idx_indicadores_departamento ON indicadores(departamento_id);
CREATE INDEX idx_indicadores_tabela_atingimento ON indicadores(tabela_atingimento_id);
CREATE INDEX idx_indicadores_usuario_filial ON indicadores(usuario_filial);
CREATE INDEX idx_indicadores_usuario_role ON indicadores(usuario_role);
CREATE INDEX idx_indicadores_safra ON indicadores(safra_id);
CREATE INDEX idx_indicadores_status ON indicadores(status);
```

---

## 🔄 TRIGUER PARA POPULAR CAMPOS (Automático)

```sql
CREATE OR REPLACE FUNCTION populate_indicador_usuario_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Copiar dados do usuário no momento da criação
  SELECT 
    u.nome,
    u.cargo_id,
    c.nome,
    u.filial,
    u.role,
    u.departamento_id,
    d.nome
  INTO
    NEW.usuario_nome,
    NEW.usuario_cargo_id,
    NEW.usuario_cargo_nome,
    NEW.usuario_filial,
    NEW.usuario_role,
    NEW.usuario_departamento_id,
    NEW.usuario_departamento_nome
  FROM users u
  LEFT JOIN cargos c ON u.cargo_id = c.id
  LEFT JOIN departamentos d ON u.departamento_id = d.id
  WHERE u.id = NEW.usuario_responsavel_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_populate_usuario_snapshot
BEFORE INSERT ON indicadores
FOR EACH ROW
EXECUTE FUNCTION populate_indicador_usuario_snapshot();
```

---

## 📥 MIGRATION SQL (Para Aplicar Agora)

```sql
-- ============================================================================
-- MIGRATION: Adicionar Tabela de Atingimento + Campos Faltantes em Indicadores
-- ============================================================================
-- Executar APÓS MIGRATION_v2.1.sql
-- ============================================================================

-- 1. Criar tabela de atingimento
CREATE TABLE tabelas_atingimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  faixas JSONB NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tabelas_atingimento IS 'Tabelas de conversão de atendimento para resultado (Redutor)';
COMMENT ON COLUMN tabelas_atingimento.faixas IS 'JSON com faixas: [{min: 0, max: 50, resultado: 0, descricao: "Não Atende"}, ...]';

-- 2. Inserir tabela padrão
INSERT INTO tabelas_atingimento (nome, descricao, faixas) VALUES (
  'Padrão PPR',
  'Tabela padrão de atingimento para PPR',
  '[
    {"min": 0, "max": 50, "resultado": 0, "descricao": "Não Atende"},
    {"min": 51, "max": 75, "resultado": 0.5, "descricao": "Parcial"},
    {"min": 76, "max": 100, "resultado": 1.0, "descricao": "Atende"}
  ]'::jsonb
);

-- 3. Adicionar colunas em indicadores
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS (
  tabela_atingimento_id UUID REFERENCES tabelas_atingimento(id),
  usuario_nome VARCHAR(255),
  usuario_cargo_id UUID REFERENCES cargos(id),
  usuario_cargo_nome VARCHAR(255),
  usuario_filial VARCHAR(255),
  usuario_role VARCHAR(50),
  usuario_departamento_id UUID REFERENCES departamentos(id),
  usuario_departamento_nome VARCHAR(255)
);

-- 4. Criar trigger para popular campos automaticamente
CREATE OR REPLACE FUNCTION populate_indicador_usuario_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    u.nome,
    u.cargo_id,
    c.nome,
    u.filial,
    u.role,
    u.departamento_id,
    d.nome
  INTO
    NEW.usuario_nome,
    NEW.usuario_cargo_id,
    NEW.usuario_cargo_nome,
    NEW.usuario_filial,
    NEW.usuario_role,
    NEW.usuario_departamento_id,
    NEW.usuario_departamento_nome
  FROM users u
  LEFT JOIN cargos c ON u.cargo_id = c.id
  LEFT JOIN departamentos d ON u.departamento_id = d.id
  WHERE u.id = NEW.usuario_responsavel_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_populate_usuario_snapshot ON indicadores;
CREATE TRIGGER tg_populate_usuario_snapshot
BEFORE INSERT ON indicadores
FOR EACH ROW
EXECUTE FUNCTION populate_indicador_usuario_snapshot();

-- 5. Criar view para queries simplificadas
CREATE OR REPLACE VIEW v_indicadores_completo AS
SELECT 
  i.*,
  ta.nome as tabela_atingimento_nome,
  -- Calcular resultado final com tabela de atingimento
  CASE 
    WHEN ta.faixas IS NOT NULL THEN
      (SELECT (f->>'resultado')::DECIMAL
       FROM jsonb_array_elements(ta.faixas) AS f
       WHERE (f->>'min')::INT <= i.atendimento 
         AND (f->>'max')::INT >= i.atendimento
       LIMIT 1)
    ELSE CASE 
      WHEN i.atendimento >= 76 THEN 1.0
      WHEN i.atendimento >= 51 THEN 0.5
      ELSE 0.0
    END
  END AS resultado_ppr
FROM indicadores i
LEFT JOIN tabelas_atingimento ta ON i.tabela_atingimento_id = ta.id;

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_indicadores_tabela_atingimento 
  ON indicadores(tabela_atingimento_id);
CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_filial 
  ON indicadores(usuario_filial);
CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_role 
  ON indicadores(usuario_role);
CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_cargo 
  ON indicadores(usuario_cargo_id);

-- 7. Validação
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM tabelas_atingimento;
  RAISE NOTICE '
    ╔════════════════════════════════════════════════════════╗
    ║ MIGRATION INDICADORES COMPLETA                         ║
    ╠════════════════════════════════════════════════════════╣
    ║ ✓ Tabela tabelas_atingimento criada                   ║
    ║ ✓ % tabelas de atingimento inseridas                  ║
    ║ ✓ Colunas adicionadas em indicadores (8 novas)        ║
    ║ ✓ Trigger criado para snapshot automático             ║
    ║ ✓ View v_indicadores_completo criada                  ║
    ║ ✓ Índices de performance criados                      ║
    ╚════════════════════════════════════════════════════════╝
  ', v_count;
END $$;
```

---

## ✅ CHECKLIST DE COLUNAS (APÓS AJUSTE)

| Template | Coluna | Tipo | Referência | Status |
|----------|--------|------|-----------|--------|
| Pilar | `pilar` | VARCHAR(255) | — | ✅ |
| Indicador/Meta | `nome` | VARCHAR(255) | — | ✅ |
| Descrição | `objetivo` + `detalhamento` | TEXT | — | ✅ |
| Meta | `meta` | TEXT | — | ✅ |
| Forma de Medição | `forma_medicao` | TEXT | — | ✅ |
| Evidência Obrigatória | `evidencia_obrigatoria` | TEXT | — | ✅ |
| **Tabela de Atingimento** | **`tabela_atingimento_id`** | **UUID** | **→ tabelas_atingimento** | ✅ NOVO |
| Peso | `peso` | DECIMAL(5,2) | — | ✅ |
| **Colaborador** | **`usuario_responsavel_id`** | **UUID** | **→ users** | ✅ |
| **Colaborador (Snapshot)** | **`usuario_nome`** | **VARCHAR(255)** | — | ✅ NOVO |
| **Filial** | **`usuario_filial`** | **VARCHAR(255)** | — | ✅ NOVO |
| **Departamento** | `departamento_id` | UUID | → departamentos | ✅ |
| **Departamento (Snapshot)** | **`usuario_departamento_nome`** | **VARCHAR(255)** | — | ✅ NOVO |
| **Cargo** | **`usuario_cargo_id`** | **UUID** | **→ cargos** | ✅ NOVO |
| **Cargo (Snapshot)** | **`usuario_cargo_nome`** | **VARCHAR(255)** | — | ✅ NOVO |
| **Perfil/Role** | **`usuario_role`** | **VARCHAR(50)** | — | ✅ NOVO |

---

## 🎯 RESUMO DA SOLUÇÃO

### Antes (Faltando):
```
❌ Tabela de Atingimento (Redutor)
❌ Filial desnormalizada
❌ Cargo desnormalizado
❌ Role desnormalizado
❌ Histórico do usuário
```

### Depois (Completo):
```
✅ Tabela de Atingimento: tabela_atingimento_id → tabelas_atingimento
✅ Filial: usuario_filial (snapshot)
✅ Cargo: usuario_cargo_id + usuario_cargo_nome (snapshot)
✅ Role: usuario_role (snapshot)
✅ Histórico: Todos os campos preservados no momento da criação
✅ View: v_indicadores_completo com cálculo automático de resultado_ppr
✅ Trigger: População automática de campos via usuario_responsavel_id
```

---

**Versão:** 2.1 (Ajustada)  
**Data:** 2026-09-14  
**Status:** ✅ SCHEMA COMPLETO E PRONTO
