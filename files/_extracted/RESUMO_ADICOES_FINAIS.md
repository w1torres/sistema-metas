# ✨ ADIÇÕES FINAIS — Modelo de Dados Import + Feature Futura Continuidade

**Data:** 2026-09-14  
**Versão:** 2.1 + 2.2 (Planejada)  
**Status:** ✅ ESPECIFICAÇÕES COMPLETAS

---

## 📊 ADIÇÃO 1: MODELO DE DADOS PARA IMPORT (v2.1)

### Problema Identificado
```
"Para importar indicadores também é preciso que seja apresentada
a estrutura do modelo de dados: IDs de colaboradores, departamentos,
cargo, perfil, e a safra para a qual o indicador será analisado"
```

### Solução Implementada

**Arquivo:** `MODELO_DADOS_IMPORT_v2.1.md` (18 KB)

#### Conteúdo:

**PARTE 1: Entidades Necessárias (Referências)**
```
1. COLABORADOR → users.id (UUID)
2. DEPARTAMENTO → departamentos.id (UUID)
3. CARGO → cargos.id (UUID)
4. PERFIL/ROLE → users.role (VARCHAR)
5. SAFRA → safras.id (UUID)
```

**PARTE 2: Tabelas de Lookup (Com Exemplos)**
```sql
-- Exemplo: Departamentos
SELECT id, nome FROM departamentos;
│ 123e4567-e89b-12d3-a456-426614174001 │ ADMINISTRATIVO  │
│ 223e4567-e89b-12d3-a456-426614174002 │ TECNOLOGIA      │
│ 323e4567-e89b-12d3-a456-426614174003 │ VENDAS          │

-- Exemplo: Cargos
SELECT id, nome FROM cargos;
│ 621e4567-e89b-12d3-a456-426614174001 │ Analista Admin              │
│ 621e4567-e89b-12d3-a456-426614174003 │ Gerente Administrativo      │

-- Exemplo: Colaboradores
SELECT id, nome, email, departamento_id FROM users;
│ 821e4567-e89b-12d3-a456-426614174001 │ João Santos    │ joao@... │ 123e4567... │
│ 821e4567-e89b-12d3-a456-426614174002 │ Ana Costa      │ ana@...  │ 123e4567... │

-- Exemplo: Safras
SELECT id, nome FROM safras;
│ 921e4567-e89b-12d3-a456-426614174004 │ SAFRA 2024 Q4 │
│ 921e4567-e89b-12d3-a456-426614174005 │ SAFRA 2025 Q1 │
```

**PARTE 3: Arquivo Import COM IDs**

```csv
Nome | Peso | Responsável_ID | Departamento_ID | Cargo_ID | Safra_ID | Objetivo
POLÍTICA DE COMPRAS | 20 | 821e4567-e89b... | 123e4567-e89b... | 621e4567-e89b... | 921e4567-e89b... | Estabelecer diretrizes
ROTINA DE VENDAS | 15 | 821e4567-e89b... | 323e4567-e89b... | 821e4567-e89b... | 921e4567-e89b... | Otimizar vendas
```

**PARTE 4: Validações Automáticas**
```sql
✓ Responsável_ID existe em users (COLABORADOR)
✓ Departamento_ID existe em departamentos
✓ Cargo_ID existe em cargos
✓ Safra_ID existe em safras
✓ Colaborador pertence ao departamento (FK check)
✓ Cargo do colaborador está correto
✓ Data Fim ≥ Data Início
```

**PARTE 5: Template Gerado Automaticamente**

```bash
GET /api/indicators/import/template?departamento_id=...&safra_id=...
Response: CSV pré-preenchido com:
├─ Colaboradores (ID + Nome)
├─ Departamento (ID)
├─ Cargo (ID)
├─ Safra (ID)
└─ Colunas vazias para indicador novo
```

**PARTE 6: API Atualizada**

```bash
POST /api/indicators/import
├─ Input: CSV com 5 IDs + dados do indicador
├─ Validação: Referências cruzadas
└─ Output: ✅ Importados ou ❌ Erros com sugestão
```

---

### Benefício

```
ANTES: "Qual é o ID do colaborador?"
       (Usuário quer adivinhar)

DEPOIS: Sistema oferece template pré-preenchido com:
        ├─ João Santos: 821e4567-e89b...
        ├─ ADMINISTRATIVO: 123e4567-e89b...
        ├─ Gerente: 621e4567-e89b...
        └─ SAFRA 2024 Q4: 921e4567-e89b...
        
        Usuário só preenche: Nome, Peso, Objetivo, etc
```

---

## 🔄 ADIÇÃO 2: FEATURE FUTURA — Continuidade do Indicador (v2.2)

### Problema Identificado

```
"Para uma próxima spec ou feature implementar a continuidade do indicador:
mesmo que um indicador não seja avaliado para pagamento do PPR
ele poderá ser avaliado para histórico.
Podemos ter alguma flag ou método que o indicador continue no ciclo
mas não seja apresentado na visualização para meta do PPR"
```

### Solução Especificada

**Arquivo:** `FEATURE_FUTURA_CONTINUIDADE_v2.2.md` (18 KB)

#### Conceito

```
SAFRA 2024 Q4: Indicador criado, avaliado
              ├─ contar_para_ppr: true ✅ (conta para bônus)
              └─ continuar_proximo_ciclo: true ✅
              
SAFRA 2025 Q1: Indicador CLONADO (automático)
              ├─ contar_para_ppr: false ❌ (não conta para bônus)
              ├─ continuar_proximo_ciclo: true ✅
              └─ Mostra em HISTÓRICO, não em METAS
              
SAFRA 2025 Q2: Indicador segue
              ├─ contar_para_ppr: false ❌
              └─ continuar_proximo_ciclo: false ❌ (fim)

Timeline: 2024 Q4 (85%) → 2025 Q1 (90%) → 2025 Q2 (92%)
```

#### Mudanças no BD (v2.2)

```sql
-- Novas colunas
ALTER TABLE indicadores ADD COLUMN (
  continuar_proximo_ciclo BOOLEAN DEFAULT false,
  -- true: segue para próxima safra
  
  contar_para_ppr BOOLEAN DEFAULT true,
  -- true: conta para pagamento
  -- false: só histórico
  
  safra_origem_id UUID REFERENCES safras(id),
  indicador_anterior_id UUID REFERENCES indicadores(id),
  historico_clonado_de UUID REFERENCES indicadores(id)
);
```

#### Visualização (v2.2)

```
Dashboard — Filtros Novos:

☑ Mostrar indicadores de METAS (contar_para_ppr=true)
  ├─ POLÍTICA DE COMPRAS (2024 Q4) — Atendimento: 85%
  └─ AUDITORIA (2024 Q4) — Atendimento: 92%

☐ Mostrar indicadores de HISTÓRICO (contar_para_ppr=false)
  ├─ POLÍTICA DE COMPRAS (2025 Q1) — Atendimento: 90%
  └─ POLÍTICA DE COMPRAS (2025 Q2) — Atendimento: 92%
  └─ (3 indicadores de histórico não exibidos)

Ver Histórico Completo:
  Timeline: POLÍTICA DE COMPRAS
  ├─ 2024 Q4: 85% (contar_para_ppr: true)
  ├─ 2025 Q1: 90% (contar_para_ppr: false)
  └─ 2025 Q2: 92% (contar_para_ppr: false)
```

#### APIs Novas (v2.2)

```bash
# 1. Clonar para próxima safra
POST /api/indicators/:id/continue-next-cycle
Body: {
  "safra_proxima_id": "uuid",
  "contar_para_ppr": false,
  "observacao": "Monitora sem bonificação"
}

# 2. Ver cadeia histórica completa
GET /api/indicators/:id/historico-cadeia
Response: Array com todas safras + timeline

# 3. Atualizar flags
PATCH /api/indicators/:id/flags-continuidade
Body: {
  "continuar_proximo_ciclo": true,
  "contar_para_ppr": false
}
```

#### Trigger Automático (v2.2)

```sql
-- Quando nova safra é ativada:
TRIGGER: Clonar indicadores marcados como "continuar"
├─ Cria novo indicador (contar_para_ppr=false por padrão)
├─ Mantém FK para indicador anterior (historico_clonado_de)
└─ Seta status=EM_ANDAMENTO (novo ciclo)
```

#### RBAC (v2.2)

```
MASTER:
├─ Pode mudar contar_para_ppr: SIM
├─ Pode clonar: SIM
└─ Pode deletar cadeia: SIM

GESTOR:
├─ Pode mudar contar_para_ppr: SIM (seu dept)
├─ Pode clonar: SIM (seu dept)
└─ Pode deletar: NÃO

COLABORADOR:
├─ Pode mudar: NÃO
├─ Pode clonar: NÃO
└─ Pode ver histórico: SIM (seus indicadores)
```

---

### Benefício

```
ANTES: Indicador termina na safra
       └─ Sem histórico, sem continuidade

DEPOIS: Indicador pode:
        ├─ Contar para bônus (2024 Q4: SIM)
        ├─ Continuar monitorado (2025 Q1: SIM, sem bônus)
        ├─ Manter histórico completo (timeline)
        ├─ Ser analisado para tendências
        └─ Aparecer/desaparecer de visualização PPR dinamicamente
```

---

## 📁 ARQUIVOS FINAIS

### Adicionados (2 novos):

| Arquivo | Tamanho | Conteúdo | Status |
|---------|---------|----------|--------|
| **MODELO_DADOS_IMPORT_v2.1.md** | 18 KB | Estrutura de referências + lookup tables + validações | ✅ v2.1 |
| **FEATURE_FUTURA_CONTINUIDADE_v2.2.md** | 18 KB | Continuidade de indicador + flags + clonagem automática | 📋 v2.2 |

### ZIP Atualizado:

**backend-etapa-2.1-completo.zip (50 KB)** — Agora contém:

```
├─ BACKEND_SPECS_v2.1.md
├─ MIGRATION_v2.1.sql
├─ MIGRATION_USUARIOS_CAMPOS_v2.1.sql
├─ IMPORT_PLANILHA_TEMPLATE.md
├─ MODELO_DADOS_IMPORT_v2.1.md ← NOVO
├─ CHANGELOG_v2.1.md
├─ ESPECIFICACOES_FALTANTES_v2.1.md
├─ CHECKLIST_RAPIDO_v2.1.md
├─ SUMARIO_CORRECOES_v2.1.md
├─ FEATURE_FUTURA_CONTINUIDADE_v2.2.md ← NOVO
├─ DATABASE_SCHEMA.sql
├─ .env.example
├─ docker-compose.yml
└─ backend-package.json
```

---

## 🎯 Timeline de Implementação

### v2.1 (AGORA — Implementar)
```
✅ Roles simplificados (3)
✅ Dashboard com métricas
✅ Observação em aprovação
✅ Cadastro com 6 campos novos
✅ Template planilha básico
✅ Modelo de dados com IDs ← NOVO
```

**Estimativa:** 20-25 dias

---

### v2.2 (PRÓXIMO — Depois de v2.1 estável)
```
📋 Continuidade de indicador (clonagem automática)
📋 Flags contar_para_ppr
📋 Histórico + Timeline
📋 Filtro de visualização dinâmica
📋 Trigger de clonagem automática
```

**Estimativa:** 4-6 semanas (após v2.1 em produção)

---

## 📝 Checklist de Implementação (v2.1)

**Import de Indicadores:**
- [ ] Implementar GET /api/indicators/import/template
  - Retorna CSV com IDs pré-preenchidos
  - Filtra por departamento (opcional)
  - Filtra por safra (obrigatório)

- [ ] Validações de Referências
  - Colaborador existe em users
  - Colaborador é COLABORADOR (não MASTER/GESTOR)
  - Departamento existe
  - Cargo existe
  - Safra existe
  - Colaborador pertence ao departamento
  - Cargo do colaborador está correto

- [ ] Response estruturado
  - Resumo por departamento
  - Resumo por safra
  - Erros com sugestões

---

## ✨ O Que Faltava Antes / O Que Tem Agora

### Antes
```
❌ Não especificava IDs das referências no import
❌ Usuário tinha que adivinhar UUIDs
❌ Sem validação de referências cruzadas
❌ Sem template pré-preenchido
❌ Sem ideia de continuidade entre safras
❌ Indicador perdido após safra terminar
```

### Agora
```
✅ Estrutura completa de referências documentada
✅ Exemplos de UUIDs reais (lookup tables)
✅ Validações automáticas de FK
✅ Template gerado dinamicamente por API
✅ Feature futura especificada (continuidade)
✅ Clonagem automática entre safras
✅ Histórico mantido + PPR desacoplado
```

---

## 🚀 Próximas Ações

### Imediato (v2.1)
1. Ler: MODELO_DADOS_IMPORT_v2.1.md
2. Implementar GET /api/indicators/import/template
3. Atualizar POST /api/indicators/import
4. Validar referências cruzadas

### Futuro (v2.2)
1. Ler: FEATURE_FUTURA_CONTINUIDADE_v2.2.md
2. Adicionar 5 colunas na tabela indicadores
3. Criar trigger de clonagem automática
4. Implementar APIs de continuidade
5. Atualizar dashboard com filtros

---

## 📊 Resumo Técnico

### Modelo de Dados Import (v2.1)

```sql
Colunas Obrigatórias:
├─ Nome (texto)
├─ Peso (número 0-100)
├─ Responsável_ID (UUID, FK → users)
├─ Departamento_ID (UUID, FK → departamentos)
├─ Cargo_ID (UUID, FK → cargos)
├─ Safra_ID (UUID, FK → safras)
├─ Objetivo (texto)
├─ Data Início (DD/MM/YYYY)
└─ Data Fim (DD/MM/YYYY)

Colunas Opcionais:
├─ Detalhamento
├─ Pilar
├─ Forma de Medição
└─ Evidência Obrigatória
```

### Continuidade de Indicador (v2.2)

```sql
Colunas Novas:
├─ continuar_proximo_ciclo (BOOLEAN)
├─ contar_para_ppr (BOOLEAN)
├─ safra_origem_id (UUID, FK → safras)
├─ indicador_anterior_id (UUID, FK → indicadores)
└─ historico_clonado_de (UUID, FK → indicadores)
```

---

**Versão:** 2.1 + 2.2  
**Data:** 2026-09-14  
**Status:** ✅ ESPECIFICAÇÕES COMPLETAS + PRONTO PARA IMPLEMENTAÇÃO  
**Próximo:** Começar v2.1 conforme CHECKLIST_RAPIDO_v2.1.md
