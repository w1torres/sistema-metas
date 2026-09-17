# 🔄 FEATURE FUTURA: Continuidade do Indicador — Histórico + PPR Desacoplados

**Versão:** 2.2 (Planejado)  
**Data:** 2026-09-14  
**Status:** Especificação de Feature Futura (NÃO implementar agora)

---

## 📌 Problema Que Resolve

### Cenário Atual (v2.1)
```
SAFRA 2024 Q4: Indicador criado, avaliado, concluído
              ↓
SAFRA 2025 Q1: Indicador é DESCARTADO (perdido) ❌
              ↓
              Sem histórico, sem continuidade
```

### Cenário Desejado (v2.2)
```
SAFRA 2024 Q4: Indicador criado, avaliado, concluído
              ↓ (continuar_proximo_ciclo = true)
SAFRA 2025 Q1: Indicador continua
              ├─ contar_para_ppr = false (não pagamento)
              ├─ Mantém histórico (análise)
              └─ Não aparece em visualização PPR
              ↓
SAFRA 2025 Q2: Indicador segue adiante
              └─ Histórico acumula (2024 Q4, 2025 Q1, 2025 Q2, ...)
```

---

## 🎯 Objetivo

```
"Um indicador pode:
  ├─ Ser avaliado para HISTÓRIA (sim)
  ├─ Ser avaliado para PPR/PAGAMENTO (sim ou não)
  └─ Continuar acompanhamento sem ser visível em metas PPR"
```

**Aplicação:**
```
Indicador crítico para empresa mas não para bonificação do colaborador
├─ Exemplo: Política de Compras (obrigatório)
│  └─ Monitora continuidade
│  └─ Mas Analista não recebe bonus por isso (contar_para_ppr=false)
│
├─ Exemplo: Compliance/Segurança
│  └─ Continua monitorando
│  └─ Mas não é meta de desempenho individual
│
└─ Exemplo: Projeto Multi-Safra
   └─ Pode não contar para PPR em uma safra
   └─ Contar em outra (quando for finalizado)
```

---

## 🗄️ PARTE 1: Mudanças no Banco de Dados (v2.2)

### Adicionar Colunas na Tabela `indicadores`

```sql
-- Flags de continuidade e PPR
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS (
  continuar_proximo_ciclo BOOLEAN DEFAULT false,
  -- true: indicador segue para próxima safra
  -- false: indicador encerra nesta safra
  
  contar_para_ppr BOOLEAN DEFAULT true,
  -- true: conta para cálculo de PPR/bonificação
  -- false: só para histórico/acompanhamento
  
  safra_origem_id UUID REFERENCES safras(id),
  -- Referência à safra onde foi criado
  
  indicador_anterior_id UUID REFERENCES indicadores(id),
  -- FK para indicador da safra anterior (continuidade)
  
  historico_clonado_de UUID REFERENCES indicadores(id)
  -- Se é uma clonagem, referencia o original
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_indicadores_continuar_proximo 
  ON indicadores(continuar_proximo_ciclo);

CREATE INDEX IF NOT EXISTS idx_indicadores_contar_ppr 
  ON indicadores(contar_para_ppr);

CREATE INDEX IF NOT EXISTS idx_indicadores_cadeia_historica 
  ON indicadores(indicador_anterior_id, safra_origem_id);
```

---

### Tabela Completa (indicadores) v2.2

```sql
CREATE TABLE indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados básicos
  nome VARCHAR(255) NOT NULL,
  peso NUMERIC(5,2) NOT NULL CHECK (peso >= 0 AND peso <= 100),
  status VARCHAR(50) NOT NULL 
    CHECK (status IN ('EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'CONCLUIDO', 'ATRASADO', 'PAUSADO')),
  
  -- Referências
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  usuario_responsavel_id UUID NOT NULL REFERENCES users(id),
  safra_id UUID NOT NULL REFERENCES safras(id),
  
  -- Detalhes
  objetivo TEXT NOT NULL,
  detalhamento TEXT,
  atendimento NUMERIC(3,2),
  funcao VARCHAR(255),
  pilar VARCHAR(255),
  meta TEXT,
  forma_medicao TEXT,
  evidencia_obrigatoria TEXT,
  
  -- Datas
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  concluido_em TIMESTAMP,
  
  -- Continuidade (NOVO v2.2)
  continuar_proximo_ciclo BOOLEAN DEFAULT false,
  contar_para_ppr BOOLEAN DEFAULT true,
  safra_origem_id UUID REFERENCES safras(id),
  indicador_anterior_id UUID REFERENCES indicadores(id),
  historico_clonado_de UUID REFERENCES indicadores(id),
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 PARTE 2: Fluxo de Continuidade

### Estado: Indicador com Continuidade

```
┌─────────────────────────────────────────────────────────────┐
│ Indicador: POLÍTICA DE COMPRAS                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Safra: SAFRA 2024 Q4                                        │
│ Status: CONCLUIDO                                           │
│ Atendimento: 85%                                            │
│ contar_para_ppr: true  (conta para bonificação)             │
│ continuar_proximo_ciclo: true  (segue adiante)              │
│                                                             │
│ [Aprovar] [Finalizar] [Continuar Próximo Ciclo]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                        ↓ (CLONE AUTOMÁTICO)

┌─────────────────────────────────────────────────────────────┐
│ Indicador: POLÍTICA DE COMPRAS (Cópia)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Safra: SAFRA 2025 Q1 (NOVA)                                │
│ Status: EM_ANDAMENTO (novo ciclo)                          │
│ Atendimento: — (vazio, novo ciclo)                         │
│ contar_para_ppr: false  (não conta, só histórico)          │
│ continuar_proximo_ciclo: true  (pode continuar)             │
│ indicador_anterior_id: <uuid de 2024 Q4>                   │
│ historico_clonado_de: <uuid de 2024 Q4>                    │
│                                                             │
│ [Editar] [Ver Histórico da Cadeia]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 PARTE 3: Visualização — O que Mostra/Esconde

### Dashboard GESTOR/MASTER — Visualização de Metas PPR

**Query Filtrada:**
```sql
SELECT * FROM indicadores 
WHERE safra_id = $safra_atual
  AND contar_para_ppr = true  -- ← APENAS indicadores que contam
  AND status NOT IN ('PAUSADO');
```

**Resultado: MOSTRA**
```
Indicador 1: POLÍTICA DE COMPRAS (2024 Q4)
├─ contar_para_ppr: true ✅
└─ Atendimento: 85% (conta para PPR)

Indicador 2: AUDITORIA INTERNA (2024 Q4)
├─ contar_para_ppr: true ✅
└─ Atendimento: 92% (conta para PPR)
```

**Resultado: ESCONDE**
```
❌ NÃO MOSTRA: Indicadores com contar_para_ppr = false
   (Política de Compras 2025 Q1 — continuidade)
```

---

### Dashboard — Visualização de Histórico

**Query para Histórico Completo:**
```sql
SELECT * FROM indicadores 
WHERE safra_origem_id = $safra_origem
  AND indicador_anterior_id IS NOT NULL  -- ← Só continuidades
ORDER BY safra_id DESC;
```

**Resultado: MOSTRA TUDO**
```
Timeline: POLÍTICA DE COMPRAS
├─ 2024 Q4 (Original) — Atendimento: 85%, contar_para_ppr: true
├─ 2025 Q1 (Continuação) — Atendimento: 90%, contar_para_ppr: false
├─ 2025 Q2 (Continuação) — Atendimento: 88%, contar_para_ppr: false
└─ 2025 Q3 (Continuação) — Atendimento: 92%, contar_para_ppr: true

Histórico completo da métrica ao longo do tempo (4 safras)
```

---

## 🔧 PARTE 4: API — Endpoints Novos (v2.2)

### 1. POST /api/indicators/:id/continue-next-cycle

**Propósito:** Criar clonagem automática do indicador para próxima safra

**Request:**
```json
{
  "indicador_id": "uuid-2024-q4",
  "safra_proxima_id": "uuid-2025-q1",
  "contar_para_ppr": false,
  "observacao": "Continua monitoramento sem bonificação"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "indicador_original": {
      "id": "uuid-2024-q4",
      "nome": "POLÍTICA DE COMPRAS",
      "safra_id": "uuid-2024-q4",
      "continuar_proximo_ciclo": true,
      "contar_para_ppr": true
    },
    "indicador_novo": {
      "id": "uuid-2025-q1",
      "nome": "POLÍTICA DE COMPRAS",
      "safra_id": "uuid-2025-q1",
      "status": "EM_ANDAMENTO",
      "indicador_anterior_id": "uuid-2024-q4",
      "historico_clonado_de": "uuid-2024-q4",
      "continuar_proximo_ciclo": true,
      "contar_para_ppr": false
    }
  }
}
```

---

### 2. GET /api/indicators/:id/historico-cadeia

**Propósito:** Traçar cadeia completa de um indicador (todas as safras)

**Request:**
```bash
GET /api/indicators/uuid-2025-q1/historico-cadeia
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cadeia": [
      {
        "ordem": 1,
        "id": "uuid-2024-q4",
        "nome": "POLÍTICA DE COMPRAS",
        "safra": "SAFRA 2024 Q4",
        "status": "CONCLUIDO",
        "atendimento": 85,
        "contar_para_ppr": true,
        "continuar_proximo_ciclo": true,
        "criado_em": "2024-10-01T10:00:00Z"
      },
      {
        "ordem": 2,
        "id": "uuid-2025-q1",
        "nome": "POLÍTICA DE COMPRAS",
        "safra": "SAFRA 2025 Q1",
        "status": "EM_ANDAMENTO",
        "atendimento": 90,
        "contar_para_ppr": false,
        "continuar_proximo_ciclo": true,
        "criado_em": "2025-01-01T00:00:00Z"
      },
      {
        "ordem": 3,
        "id": "uuid-2025-q2",
        "nome": "POLÍTICA DE COMPRAS",
        "safra": "SAFRA 2025 Q2",
        "status": "CONCLUIDO",
        "atendimento": 88,
        "contar_para_ppr": false,
        "continuar_proximo_ciclo": false,
        "criado_em": "2025-04-01T00:00:00Z"
      }
    ],
    "resumo": {
      "total_safras": 3,
      "primeira_safra": "SAFRA 2024 Q4",
      "ultima_safra": "SAFRA 2025 Q2",
      "media_atendimento": 87.67,
      "contas_para_ppr": 1,
      "nao_contam_para_ppr": 2
    }
  }
}
```

---

### 3. PATCH /api/indicators/:id/flags-continuidade

**Propósito:** Atualizar flags de continuidade (após criação)

**Request:**
```json
{
  "continuar_proximo_ciclo": true,
  "contar_para_ppr": false,
  "motivo": "Decisão do gestor: monitorar sem bonificação"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "continuar_proximo_ciclo": true,
    "contar_para_ppr": false
  }
}
```

---

## 📈 PARTE 5: Dashboard Layout — Filtro de Continuidade

### Novo Filtro/Toggle

```
Dashboard GESTOR/MASTER

┌─────────────────────────────────────────────────┐
│ Filtros:                                        │
├─────────────────────────────────────────────────┤
│ Safra: [SAFRA 2025 Q1 ▼]                       │
│ Departamento: [Todos ▼]                         │
│ Status: [Todos ▼]                               │
│                                                 │
│ ☑ Mostrar indicadores de METAS (contar_para_ppr=true) │
│ ☐ Mostrar indicadores de HISTÓRICO (contar_para_ppr=false) │
│ ☑ Mostrar indicadores em CONTINUIDADE          │
│                                                 │
│ [Aplicar Filtros]                              │
│                                                 │
└─────────────────────────────────────────────────┘

Resultado:
├─ POLÍTICA DE COMPRAS (2025 Q1) — Histórico (escondido)
├─ AUDITORIA INTERNA (2025 Q1) — Meta (mostrado)
└─ [1 indicador de histórico não exibido]
```

---

## 🔐 PARTE 6: RBAC e Permissões (v2.2)

### Quem Pode Mudar contar_para_ppr?

```
MASTER:
├─ Pode mudar contar_para_ppr: sim
├─ Pode clonar indicador: sim
├─ Pode pausar continuidade: sim
└─ Pode deletar cadeia: sim

GESTOR:
├─ Pode mudar contar_para_ppr: SIM (seu dept)
├─ Pode clonar indicador: SIM (seu dept)
├─ Pode pausar continuidade: SIM (seu dept)
└─ Pode deletar: NÃO

COLABORADOR:
├─ Pode mudar contar_para_ppr: NÃO
├─ Pode clonar: NÃO
├─ Pode ver histórico: SIM (seus indicadores)
└─ Pode pausar: NÃO
```

---

## 📋 PARTE 7: Trigger de Clonagem Automática (v2.2)

### Fluxo Automático na Transição de Safra

```sql
-- Quando nova safra é ativada:
-- Sistema cria clones automáticos

CREATE OR REPLACE FUNCTION clonar_indicadores_proxima_safra()
RETURNS TRIGGER AS $$
DECLARE
  v_safra_proxima RECORD;
  v_indicador_novo UUID;
  v_count INT := 0;
BEGIN
  -- Encontrar safra anterior
  SELECT id INTO v_safra_proxima 
  FROM safras 
  WHERE ativa = true 
  ORDER BY data_inicio DESC 
  LIMIT 1 OFFSET 1;
  
  IF v_safra_proxima.id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma safra anterior encontrada';
  END IF;
  
  -- Clonar indicadores marcados como "continuar"
  INSERT INTO indicadores (
    nome, peso, status, departamento_id, usuario_responsavel_id,
    safra_id, objetivo, detalhamento, data_inicio, data_fim,
    continuar_proximo_ciclo, contar_para_ppr, 
    safra_origem_id, indicador_anterior_id, historico_clonado_de,
    criado_em, atualizado_em
  )
  SELECT 
    i.nome, i.peso, 'EM_ANDAMENTO', i.departamento_id, i.usuario_responsavel_id,
    NEW.id, i.objetivo, i.detalhamento, NEW.data_inicio, NEW.data_fim,
    i.continuar_proximo_ciclo, false,  -- contar_para_ppr = false (default)
    i.safra_id, i.id, i.id,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM indicadores i
  WHERE i.safra_id = v_safra_proxima.id
    AND i.continuar_proximo_ciclo = true
    AND i.status = 'CONCLUIDO';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Clonados % indicadores para safra %', v_count, NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_clonar_indicadores_safra
AFTER UPDATE ON safras
FOR EACH ROW
WHEN (NEW.ativa = true AND OLD.ativa = false)
EXECUTE FUNCTION clonar_indicadores_proxima_safra();
```

---

## 🎯 PARTE 8: Timeline de Implementação (v2.2)

```
Q1 2025:
├─ Fase 1: Design + Documentação ✅ (este doc)
├─ Fase 2: Migrações DB (colunas + triggers)
├─ Fase 3: APIs (endpoints + validações)
└─ Fase 4: Frontend (filtros + histórico)

Q2 2025:
├─ Testes (unit + integration + e2e)
├─ Performance (índices, queries otimizadas)
├─ Deploy staging
└─ Deploy produção

Estimativa: 4-6 semanas (1-2 devs)
```

---

## ✅ Checklist Implementação (v2.2)

**Banco de Dados:**
- [ ] Adicionar 5 colunas (continuar_proximo_ciclo, contar_para_ppr, etc)
- [ ] Criar 3 índices
- [ ] Criar trigger de clonagem automática
- [ ] Testar transição de safra

**Backend:**
- [ ] POST /api/indicators/:id/continue-next-cycle
- [ ] GET /api/indicators/:id/historico-cadeia
- [ ] PATCH /api/indicators/:id/flags-continuidade
- [ ] Atualizar GET /api/indicators (adicionar filtro contar_para_ppr)
- [ ] Validações RBAC

**Frontend:**
- [ ] Dashboard: novo toggle [Mostrar Histórico]
- [ ] Dashboard: novo filtro de continuidade
- [ ] Componente: Timeline/Cadeia Histórica
- [ ] Form: checkboxes continuar_proximo_ciclo e contar_para_ppr
- [ ] Vista de histórico completo

**Testes:**
- [ ] Clonagem automática funciona
- [ ] Filtro contar_para_ppr funciona
- [ ] Histórico mostra cadeia correta
- [ ] RBAC aplicado corretamente

---

## 📝 Exemplo de Caso de Uso Real

### Cenário: "Política de Compras" — Multi-Safra

```
SAFRA 2024 Q4:
  Indicador: Política de Compras
  Objetivo: Implementar política de compras padronizada
  Responsável: João Santos
  contar_para_ppr: true ✅ (conta para bônus)
  continuar_proximo_ciclo: true ✅
  Status: CONCLUIDO
  Atendimento: 85%
  Resultado: João recebe bônus por isso

         ↓ (TRANSIÇÃO DE SAFRA)

SAFRA 2025 Q1:
  Indicador: Política de Compras (clonado)
  Objetivo: (mantém) Manter e revisar política...
  Responsável: João Santos
  contar_para_ppr: false ❌ (não conta para bônus)
  continuar_proximo_ciclo: true ✅
  Status: EM_ANDAMENTO
  Atendimento: 90% (em andamento)
  Resultado: João monitora, mas não ganha bônus adicional

         ↓ (TRANSIÇÃO DE SAFRA)

SAFRA 2025 Q2:
  Indicador: Política de Compras (clonado)
  Objetivo: (mantém) Auditoria final...
  Responsável: João Santos
  contar_para_ppr: false ❌
  continuar_proximo_ciclo: false ❌ (fim da continuidade)
  Status: CONCLUIDO
  Atendimento: 92%
  Resultado: Fim da continuidade, histórico preservado

HISTÓRICO COMPLETO:
  └─ Timeline: 2024 Q4 (85%) → 2025 Q1 (90%) → 2025 Q2 (92%)
     Média: 89% | Tendência: Crescimento ⬆️
```

---

## 💡 Benefícios

✅ **Continuidade:** Indicadores não se perdem entre safras  
✅ **Flexibilidade:** Pode não contar para bônus mas continua monitorado  
✅ **Histórico:** Análise temporal completa (tendências, padrões)  
✅ **Transparência:** Colaborador vê que acompanhamento continua  
✅ **Auditoria:** Rastreabilidade completa da métrica  
✅ **PPR Desacoplado:** Meta de desempenho ≠ Monitoramento contínuo  

---

**Versão:** 2.2 (Feature Futura)  
**Data:** 2026-09-14  
**Status:** 📋 Especificação Completa (NÃO implementar agora)  
**Próximo:** Implementar depois de v2.1 estável em produção
