# 📊 MODELO DE DADOS — Import de Indicadores com Referências

**Versão:** 2.1 (Complemento)  
**Data:** 2026-09-14  
**Status:** Estrutura de referências + Safras

---

## 🗂️ PARTE 1: Estrutura de Dados para Import

### Entidades Necessárias (Referências)

Para importar indicadores, é preciso ter **IDs corretos** de:

```
1. COLABORADOR → users.id (UUID)
   └─ Quem é responsável pelo indicador
   
2. DEPARTAMENTO → departamentos.id (UUID)
   └─ Qual depto o indicador pertence
   
3. CARGO → cargos.id (UUID)
   └─ Qual cargo está associado
   
4. PERFIL/ROLE → users.role (VARCHAR)
   └─ MASTER, GESTOR, COLABORADOR
   
5. SAFRA → safras.id (UUID)
   └─ Período de avaliação (ano, trimestre, etc)
```

---

## 📋 PARTE 2: Tabelas de Referência (Lookup Tables)

### Tabela: departamentos

```sql
SELECT id, nome FROM departamentos;

Resultado:
┌──────────────────────────────────────────┬─────────────────┐
│ id                                       │ nome            │
├──────────────────────────────────────────┼─────────────────┤
│ 123e4567-e89b-12d3-a456-426614174001    │ ADMINISTRATIVO  │
│ 223e4567-e89b-12d3-a456-426614174002    │ TECNOLOGIA      │
│ 323e4567-e89b-12d3-a456-426614174003    │ VENDAS          │
│ 423e4567-e89b-12d3-a456-426614174004    │ FINANCEIRO      │
│ 523e4567-e89b-12d3-a456-426614174005    │ RECURSOS HUMANOS│
└──────────────────────────────────────────┴─────────────────┘
```

**Para usar no import:** Use o `id` (UUID)

---

### Tabela: cargos

```sql
SELECT id, nome, trilha_id FROM cargos;

Resultado:
┌──────────────────────────────────────────┬─────────────────────────┬──────────────────────────────┐
│ id                                       │ nome                    │ trilha_id                    │
├──────────────────────────────────────────┼─────────────────────────┼──────────────────────────────┤
│ 621e4567-e89b-12d3-a456-426614174001    │ Analista Administrativo │ 111e4567-e89b-12d3-a456-... │
│ 621e4567-e89b-12d3-a456-426614174002    │ Coordenador             │ 111e4567-e89b-12d3-a456-... │
│ 621e4567-e89b-12d3-a456-426614174003    │ Gerente Administrativo  │ 222e4567-e89b-12d3-a456-... │
│ 721e4567-e89b-12d3-a456-426614174001    │ Programador             │ 333e4567-e89b-12d3-a456-... │
│ 821e4567-e89b-12d3-a456-426614174001    │ Analista de Vendas      │ 444e4567-e89b-12d3-a456-... │
└──────────────────────────────────────────┴─────────────────────────┴──────────────────────────────┘
```

**Para usar no import:** Use o `id` (UUID)

---

### Tabela: users (Colaboradores)

```sql
SELECT id, nome, email, role, departamento_id, cargo_id FROM users 
WHERE role = 'COLABORADOR';

Resultado:
┌──────────────────────────────────────────┬──────────────────────────┬────────────────────────┬──────────────┬───────────────────┬──────────────────┐
│ id                                       │ nome                     │ email                  │ role         │ departamento_id   │ cargo_id         │
├──────────────────────────────────────────┼──────────────────────────┼────────────────────────┼──────────────┼───────────────────┼──────────────────┤
│ 821e4567-e89b-12d3-a456-426614174001    │ João Santos              │ joao@empresa.com       │ COLABORADOR  │ 123e4567-e89b... │ 621e4567-e89b... │
│ 821e4567-e89b-12d3-a456-426614174002    │ Ana Costa                │ ana@empresa.com        │ COLABORADOR  │ 123e4567-e89b... │ 621e4567-e89b... │
│ 821e4567-e89b-12d3-a456-426614174003    │ Pedro Oliveira           │ pedro@empresa.com      │ COLABORADOR  │ 223e4567-e89b... │ 721e4567-e89b... │
│ 821e4567-e89b-12d3-a456-426614174004    │ MARCIA GARCIA NUNES      │ marcia@empresa.com     │ GESTOR       │ 123e4567-e89b... │ 621e4567-e89b... │
└──────────────────────────────────────────┴──────────────────────────┴────────────────────────┴──────────────┴───────────────────┴──────────────────┘
```

**Para usar no import:** Use o `id` (UUID do colaborador)

---

### Tabela: safras

```sql
SELECT id, nome, data_inicio, data_fim, ativa FROM safras;

Resultado:
┌──────────────────────────────────────────┬─────────────────────┬───────────────┬─────────────┬────────┐
│ id                                       │ nome                │ data_inicio   │ data_fim    │ ativa  │
├──────────────────────────────────────────┼─────────────────────┼───────────────┼─────────────┼────────┤
│ 921e4567-e89b-12d3-a456-426614174001    │ SAFRA 2024 Q1       │ 2024-01-01    │ 2024-03-31  │ false  │
│ 921e4567-e89b-12d3-a456-426614174002    │ SAFRA 2024 Q2       │ 2024-04-01    │ 2024-06-30  │ false  │
│ 921e4567-e89b-12d3-a456-426614174003    │ SAFRA 2024 Q3       │ 2024-07-01    │ 2024-09-30  │ false  │
│ 921e4567-e89b-12d3-a456-426614174004    │ SAFRA 2024 Q4       │ 2024-10-01    │ 2024-12-31  │ true   │
│ 921e4567-e89b-12d3-a456-426614174005    │ SAFRA 2025 Q1       │ 2025-01-01    │ 2025-03-31  │ false  │
└──────────────────────────────────────────┴─────────────────────┴───────────────┴─────────────┴────────┘
```

**Para usar no import:** Use o `id` (UUID da safra)

---

## 📥 PARTE 3: Estrutura do Arquivo Import (COM IDs)

### Colunas Esperadas (ATUALIZADO)

```
Nome | Peso | Responsável_ID | Departamento_ID | Cargo_ID | Safra_ID | 
Objetivo | Detalhamento | Data Início | Data Fim | Pilar | 
Forma de Medição | Evidência Obrigatória
```

---

### Exemplo 1: Com UUIDs Completos

```
Nome | Peso | Responsável_ID | Departamento_ID | Cargo_ID | Safra_ID | Objetivo | Data Início | Data Fim
-----|------|-----------------|-----------------|----------|----------|----------|-------------|----------
POLÍTICA DE COMPRAS | 20 | 821e4567-e89b-12d3-a456-426614174001 | 123e4567-e89b-12d3-a456-426614174001 | 621e4567-e89b-12d3-a456-426614174003 | 921e4567-e89b-12d3-a456-426614174004 | Estabelecer diretrizes de compras | 01/10/2024 | 31/12/2024
ROTINA DE VENDAS | 15 | 821e4567-e89b-12d3-a456-426614174003 | 323e4567-e89b-12d3-a456-426614174003 | 821e4567-e89b-12d3-a456-426614174001 | 921e4567-e89b-12d3-a456-426614174004 | Otimizar processo de vendas | 01/10/2024 | 31/12/2024
SISTEMA DE RH | 25 | 821e4567-e89b-12d3-a456-426614174002 | 523e4567-e89b-12d3-a456-426614174005 | 721e4567-e89b-12d3-a456-426614174001 | 921e4567-e89b-12d3-a456-426614174004 | Implementar novo sistema | 01/10/2024 | 31/12/2024
```

---

### Exemplo 2: Formato CSV (Recomendado)

**Nome do arquivo:** `indicadores_import_com_ids.csv`

```csv
"Nome","Peso","Responsável_ID","Departamento_ID","Cargo_ID","Safra_ID","Objetivo","Detalhamento","Data Início","Data Fim","Pilar","Forma de Medição","Evidência Obrigatória"
"POLÍTICA DE COMPRAS","20","821e4567-e89b-12d3-a456-426614174001","123e4567-e89b-12d3-a456-426614174001","621e4567-e89b-12d3-a456-426614174003","921e4567-e89b-12d3-a456-426614174004","Estabelecer diretrizes de compras","Documento com política, aprovação fornecedores","01/10/2024","31/12/2024","Eficiência Operacional","Sistema implementado","Comprovante implementação"
"ROTINA DE VENDAS","15","821e4567-e89b-12d3-a456-426614174003","323e4567-e89b-12d3-a456-426614174003","821e4567-e89b-12d3-a456-426614174001","921e4567-e89b-12d3-a456-426614174004","Otimizar processo de vendas","Revisão de rotina com novos processos","01/10/2024","30/06/2025","Qualidade","Taxa de conversão aumentada","Relatório de vendas"
"SISTEMA DE RH","25","821e4567-e89b-12d3-a456-426614174002","523e4567-e89b-12d3-a456-426614174005","721e4567-e89b-12d3-a456-426614174001","921e4567-e89b-12d3-a456-426614174004","Implementar novo sistema","Implantação de sistema moderno","01/10/2024","31/12/2024","Eficiência Operacional","Sistema rodando em produção","Acesso confirmado por usuários"
```

---

### Exemplo 3: Validação de Referências

**Sistema DEVE validar:**

```sql
-- 1. Responsável_ID existe em users e é COLABORADOR
SELECT COUNT(*) FROM users 
WHERE id = '821e4567-e89b-12d3-a456-426614174001' 
  AND role = 'COLABORADOR';
-- Resultado: 1 (válido) ou 0 (erro)

-- 2. Departamento_ID existe em departamentos
SELECT COUNT(*) FROM departamentos 
WHERE id = '123e4567-e89b-12d3-a456-426614174001';
-- Resultado: 1 (válido) ou 0 (erro)

-- 3. Cargo_ID existe em cargos
SELECT COUNT(*) FROM cargos 
WHERE id = '621e4567-e89b-12d3-a456-426614174003';
-- Resultado: 1 (válido) ou 0 (erro)

-- 4. Safra_ID existe em safras
SELECT COUNT(*) FROM safras 
WHERE id = '921e4567-e89b-12d3-a456-426614174004';
-- Resultado: 1 (válido) ou 0 (erro)

-- 5. Colaborador pertence ao departamento indicado
SELECT COUNT(*) FROM users 
WHERE id = '821e4567-e89b-12d3-a456-426614174001'
  AND departamento_id = '123e4567-e89b-12d3-a456-426614174001';
-- Resultado: 1 (válido) ou 0 (erro)

-- 6. Cargo do colaborador corresponde ao informado
SELECT COUNT(*) FROM users 
WHERE id = '821e4567-e89b-12d3-a456-426614174001'
  AND cargo_id = '621e4567-e89b-12d3-a456-426614174003';
-- Resultado: 1 (válido) ou 0 (erro)
```

---

## 🔄 PARTE 4: API POST /api/indicators/import (ATUALIZADO)

### Request (COM IDs)

```bash
POST /api/indicators/import
Content-Type: multipart/form-data

file: indicadores_import_com_ids.csv
```

### Body do arquivo:

```csv
"Nome","Peso","Responsável_ID","Departamento_ID","Cargo_ID","Safra_ID","Objetivo"
"POLÍTICA DE COMPRAS","20","821e4567-e89b-12d3-a456-426614174001","123e4567-e89b-12d3-a456-426614174001","621e4567-e89b-12d3-a456-426614174003","921e4567-e89b-12d3-a456-426614174004","Estabelecer diretrizes"
```

### Response (201)

```json
{
  "success": true,
  "data": {
    "total_importados": 3,
    "sucesso": 3,
    "erros": 0,
    "resumo": {
      "por_departamento": {
        "ADMINISTRATIVO": 1,
        "VENDAS": 1,
        "RECURSOS HUMANOS": 1
      },
      "por_safra": {
        "SAFRA 2024 Q4": 3
      },
      "por_status": {
        "EM_ANDAMENTO": 3
      }
    },
    "detalhes": []
  }
}
```

### Response com Erro (422)

```json
{
  "success": false,
  "data": {
    "total_importados": 3,
    "sucesso": 2,
    "erros": 1,
    "detalhes": [
      {
        "linha": 3,
        "nome": "SISTEMA DE RH",
        "erro": "Colaborador '821e4567-e89b-12d3-a456-426614174002' não pertence ao departamento 'RECURSOS HUMANOS'",
        "sugestao": "Verificar departamento_id do colaborador"
      }
    ]
  }
}
```

---

## 📊 PARTE 5: Query Auxiliar — Gerar Arquivo Template

### Para MASTER ou GESTOR gerar template pré-preenchido:

```bash
GET /api/indicators/import/template
Query Params:
  - departamento_id?: uuid (opcional)
  - safra_id?: uuid (obrigatório)

Response: CSV com:
  ├─ Colaboradores do departamento (se informado)
  ├─ IDs corretos preenchidos
  ├─ Safra informada preenchida
  └─ Colunas vazias para indicadores novos
```

**Exemplo de resposta:**

```csv
"Nome","Peso","Responsável_ID","Departamento_ID","Cargo_ID","Safra_ID","Objetivo","Data Início","Data Fim"
"INDICADOR 1","","821e4567-e89b-12d3-a456-426614174001","123e4567-e89b-12d3-a456-426614174001","621e4567-e89b-12d3-a456-426614174003","921e4567-e89b-12d3-a456-426614174004","","01/10/2024","31/12/2024"
"INDICADOR 2","","821e4567-e89b-12d3-a456-426614174002","123e4567-e89b-12d3-a456-426614174001","621e4567-e89b-12d3-a456-426614174001","921e4567-e89b-12d3-a456-426614174004","","01/10/2024","31/12/2024"
"INDICADOR 3","","821e4567-e89b-12d3-a456-426614174003","123e4567-e89b-12d3-a456-426614174001","621e4567-e89b-12d3-a456-426614174002","921e4567-e89b-12d3-a456-426614174004","","01/10/2024","31/12/2024"
```

---

## 🔧 PARTE 6: Campos Obrigatórios vs Opcionais

### Com IDs de Referência

| Campo | Tipo | Obrigatório | Validação | Exemplo |
|-------|------|-------------|-----------|---------|
| **Nome** | Texto | ✅ Sim | 255 chars max | POLÍTICA DE COMPRAS |
| **Peso** | Número | ✅ Sim | 0-100 | 20 |
| **Responsável_ID** | UUID | ✅ Sim | Deve existir em users (role=COLABORADOR) | 821e4567-e89b-12d3-a456-426614174001 |
| **Departamento_ID** | UUID | ✅ Sim | Deve existir em departamentos | 123e4567-e89b-12d3-a456-426614174001 |
| **Cargo_ID** | UUID | ✅ Sim | Deve existir em cargos | 621e4567-e89b-12d3-a456-426614174003 |
| **Safra_ID** | UUID | ✅ Sim | Deve existir em safras | 921e4567-e89b-12d3-a456-426614174004 |
| **Objetivo** | Texto | ✅ Sim | 1000 chars max | Estabelecer diretrizes... |
| **Detalhamento** | Texto | ⚠️ Recomendado | 2000 chars max | Documento com política... |
| **Data Início** | Data | ✅ Sim | DD/MM/YYYY | 01/10/2024 |
| **Data Fim** | Data | ✅ Sim | DD/MM/YYYY, ≥ Data Início | 31/12/2024 |
| **Pilar** | Texto | ⚠️ Opcional | Texto livre | Eficiência Operacional |
| **Forma de Medição** | Texto | ⚠️ Opcional | Texto livre | Sistema implementado |
| **Evidência Obrigatória** | Texto | ⚠️ Opcional | Texto livre | Comprovante implementação |

---

## 🛠️ PARTE 7: Erro Comum — Referência Circular

### ❌ ERRADO (Colaborador não pertence ao departamento informado)

```csv
"Nome","Peso","Responsável_ID","Departamento_ID"
"INDICADOR","20","821e4567-e89b-...","123e4567-e89b-..."  
  ↑ João Santos
    ↓ pertence a ADMINISTRATIVO
      mas informamos TECNOLOGIA ❌
```

**Erro retornado:**
```json
{
  "erro": "Colaborador não pertence ao departamento informado"
}
```

### ✅ CORRETO

```csv
"Nome","Peso","Responsável_ID","Departamento_ID"
"INDICADOR","20","821e4567-e89b-...","123e4567-e89b-..."  
  ↑ João Santos
    ↓ pertence a ADMINISTRATIVO
      informamos ADMINISTRATIVO ✅
```

---

## 📋 PARTE 8: Procedimento para Usuário

### Passo 1: Obter IDs (MASTER ou GESTOR)

```bash
# Acessar dashboard
# Clicar em [Importar Indicadores]
# Sistema oferece: "Baixar Template Pré-preenchido"

# Template já vem com:
├─ Colaboradores_ID (UUID)
├─ Departamento_ID (UUID)
├─ Cargo_ID (UUID)
├─ Safra_ID (UUID)
└─ Apenas preencher: Nome, Peso, Objetivo, etc
```

### Passo 2: Preencher Indicadores

```csv
"Nome","Peso","Responsável_ID","Departamento_ID","Cargo_ID","Safra_ID","Objetivo"
"POLÍTICA DE COMPRAS","20","821e4567-e89b-12d3-a456-426614174001","123e4567-e89b-12d3-a456-426614174001","621e4567-e89b-12d3-a456-426614174003","921e4567-e89b-12d3-a456-426614174004","Estabelecer diretrizes"
```

### Passo 3: Fazer Upload

```bash
POST /api/indicators/import
File: arquivo_preenchido.csv

Response: ✅ Indicadores importados
```

---

## 🎯 Resumo

**Estrutura Mínima para Import:**

```
1. Nome (obrigatório)
2. Peso (obrigatório)
3. Responsável_ID (UUID do users) (obrigatório)
4. Departamento_ID (UUID) (obrigatório)
5. Cargo_ID (UUID) (obrigatório)
6. Safra_ID (UUID) (obrigatório)
7. Objetivo (obrigatório)
8. Data Início (obrigatório)
9. Data Fim (obrigatório)
10. Detalhamento, Pilar, Forma de Medição, Evidência (opcionais)
```

**Validações Automáticas:**

```
✓ Responsável_ID existe em users
✓ Responsável é COLABORADOR (não MASTER/GESTOR)
✓ Departamento_ID existe
✓ Cargo_ID existe
✓ Safra_ID existe
✓ Colaborador pertence ao departamento
✓ Cargo do colaborador está correto
✓ Data Fim ≥ Data Início
✓ Nenhuma célula obrigatória vazia
```

---

**Versão:** 2.1 (Complemento)  
**Data:** 2026-09-14  
**Status:** ✅ Estrutura de Referências Completa
