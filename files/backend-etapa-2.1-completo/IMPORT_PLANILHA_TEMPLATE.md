# 📋 Guia de Import — Planilha de Indicadores

**Versão:** 1.0  
**Data:** 2026-09-12  
**Suporta:** XLSX (.xlsx) e CSV (.csv)

---

## 📥 Como Funciona o Import

1. **Gestor ou Master** clica em "Importar Planilha" → POST /api/indicators/import
2. Sistema faz **upload** do arquivo
3. Backend **valida** cada linha
4. **Inserir em massa** os indicadores validados
5. Retorna **resumo** (sucesso/erros)

---

## 📊 Colunas Esperadas (Ordem Importante)

| Coluna | Tipo | Obrigatório | Descrição | Exemplo |
|--------|------|-------------|-----------|---------|
| **Nome** | Texto | ✅ Sim | Nome/descrição do indicador | POLÍTICA DE COMPRAS |
| **Peso** | Número | ✅ Sim | Peso do indicador (0-100) | 20 |
| **Responsável** | Email | ✅ Sim | Email do colaborador | joao.santos@empresa.com |
| **Objetivo** | Texto | ✅ Sim | Objetivo do indicador | Estabelecer diretrizes... |
| **Detalhamento** | Texto | ⚠️ Recomendado | Detalhe técnico | Desenvolveu política de compras... |
| **Data Início** | Data | ✅ Sim | Quando começa (DD/MM/YYYY) | 01/01/2026 |
| **Data Fim** | Data | ✅ Sim | Quando termina (DD/MM/YYYY) | 31/12/2026 |
| **Pilar** | Texto | ⚠️ Opcional | Pilar de desenvolvimento | Eficiência Operacional |
| **Função** | Texto | ⚠️ Opcional | Cargo/função do responsável | Analista Administrativo |
| **Meta** | Texto | ⚠️ Opcional | Meta específica | Implementar sistema de compras |
| **Forma de Medição** | Texto | ⚠️ Opcional | Como medir resultado | Sistema implementado e em uso |
| **Evidência Obrigatória** | Texto | ⚠️ Opcional | Documento comprovante | Comprovante de implementação |

---

## 🔧 Formato de Dados

### Nome
- **Tipo:** Texto
- **Máximo:** 255 caracteres
- **Obrigatório:** ✅ Sim
- **Exemplo:** "POLÍTICA DE COMPRAS" ou "Implementar nova rotina de vendas"

### Peso
- **Tipo:** Número (decimal)
- **Range:** 0 a 100
- **Obrigatório:** ✅ Sim
- **Formato:** `20` ou `20.5` (usar ponto como separador)
- **Exemplo:** `20`, `15.5`, `100`
- ❌ NÃO aceita: `20,5` (vírgula), `20%` (percentual)

### Responsável (Email)
- **Tipo:** Email
- **Obrigatório:** ✅ Sim
- **Formato:** email@empresa.com
- **Validação:** Email deve existir no sistema
- **Exemplo:** `joao.santos@empresa.com`, `ana.costa@empresa.com`
- ❌ Se email não existir → Erro na linha (será reportado)

### Objetivo
- **Tipo:** Texto
- **Máximo:** 1000 caracteres
- **Obrigatório:** ✅ Sim
- **Exemplo:** "Estabelecer diretrizes claras de compras para melhorar eficiência operacional"

### Detalhamento
- **Tipo:** Texto
- **Máximo:** 2000 caracteres
- **Obrigatório:** ⚠️ Recomendado
- **Exemplo:** "Documento com política de compras, aprovação de fornecedores, prazos de pagamento"

### Data Início & Data Fim
- **Tipo:** Data
- **Formato:** `DD/MM/YYYY` (obrigatório)
- **Obrigatório:** ✅ Sim
- **Validação:** Data Fim ≥ Data Início
- **Exemplo:** `01/01/2026`, `15/06/2026`, `31/12/2026`
- ❌ NÃO aceita: `2026-01-01` (ISO), `01-01-2026` (outro formato)
- ❌ NÃO aceita: `1/1/2026` (sem zero à esquerda — deve ser `01/01/2026`)

### Pilar
- **Tipo:** Texto
- **Máximo:** 255 caracteres
- **Obrigatório:** ⚠️ Opcional
- **Valores válidos:** `Eficiência Operacional`, `Qualidade`, `Produtividade`, `Atendimento`, `Liderança`, etc.
- **Exemplo:** "Eficiência Operacional"
- ℹ️ Se deixar em branco, sistema preencherá como NULL

### Função
- **Tipo:** Texto
- **Máximo:** 255 caracteres
- **Obrigatório:** ⚠️ Opcional
- **Validação:** Deve existir em cargos (recomendado)
- **Exemplo:** "Analista Administrativo", "Gerente de Operações"
- ℹ️ Se não existir, será registrado como texto e pode ser ajustado depois

### Meta
- **Tipo:** Texto
- **Máximo:** 500 caracteres
- **Obrigatório:** ⚠️ Opcional
- **Exemplo:** "Implementar sistema de compras em 100% das unidades"

### Forma de Medição
- **Tipo:** Texto
- **Máximo:** 500 caracteres
- **Obrigatório:** ⚠️ Opcional
- **Exemplo:** "Sistema implementado e em uso em todas as filiais"

### Evidência Obrigatória
- **Tipo:** Texto
- **Máximo:** 500 caracteres
- **Obrigatório:** ⚠️ Opcional
- **Exemplo:** "Comprovante de implementação do sistema, screenshot, relatório"

---

## 📄 Exemplo Completo (Planilha)

### Formato XLSX (Recomendado)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ A              │ B    │ C                      │ D              │ E       │ F      │ G      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Nome           │Peso  │Responsável             │Data Início     │Data Fim │Pilar   │Função  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ POLÍTICA DE    │ 20   │joao.santos@empresa.com │01/01/2026      │31/12/   │Eficiên │Analista│
│ COMPRAS        │      │                        │                │2026     │cia Oper│Admin   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ROTINA DE      │ 15   │ana.costa@empresa.com   │15/01/2026      │30/06/   │Qualida │Coordena│
│ VENDAS         │      │                        │                │2026     │de      │dora    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ SISTEMA DE     │ 25   │pedro.oliveira@empresa. │01/02/2026      │31/12/   │Eficiên │Especialista│
│ RH             │      │com                     │                │2026     │cia Oper│Técnico │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ AUDITORIA      │ 30   │maria.silva@empresa.com │01/03/2026      │31/12/   │Qualida │Auditor │
│ INTERNA        │      │                        │                │2026     │de      │Interno │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Completo com Todas as Colunas

Arquivo: **indicadores_import_completo.xlsx**

| Nome | Peso | Responsável | Objetivo | Detalhamento | Data Início | Data Fim | Pilar | Função | Meta | Forma de Medição | Evidência Obrigatória |
|------|------|-------------|----------|--------------|-------------|----------|-------|--------|------|------------------|-----------------------|
| POLÍTICA DE COMPRAS | 20 | joao.santos@empresa.com | Estabelecer diretrizes de compras | Documento com política de compras, aprovação de fornecedores, prazos de pagamento | 01/01/2026 | 31/12/2026 | Eficiência Operacional | Analista Administrativo | Implementar sistema de compras | Sistema implementado e em uso | Comprovante de implementação |
| ROTINA DE VENDAS | 15 | ana.costa@empresa.com | Otimizar processo de vendas | Revisão de rotina de vendas com novos processos | 15/01/2026 | 30/06/2026 | Qualidade | Coordenadora de Vendas | Aumentar conversão 20% | Taxa de conversão aumentada | Relatório de vendas |
| SISTEMA DE RH | 25 | pedro.oliveira@empresa.com | Implementar novo sistema de RH | Implantação de sistema de RH moderno e integrado | 01/02/2026 | 31/12/2026 | Eficiência Operacional | Especialista Técnico | Sistema rodando em produção | Sistema acessível a todos | Acesso confirmado por usuários |
| AUDITORIA INTERNA | 30 | maria.silva@empresa.com | Realizar auditoria das operações | Auditoria interna completa dos processos | 01/03/2026 | 31/12/2026 | Qualidade | Auditor Interno | Identificar 100% dos processos | Relatório de auditoria | Documento de auditoria assinado |

---

## 🔄 Formato CSV (Alternativo)

**Nome do arquivo:** `indicadores_import.csv`  
**Encoding:** UTF-8  
**Separador:** Vírgula (,)  
**Delimitador:** Aspas duplas (")

```csv
"Nome","Peso","Responsável","Objetivo","Detalhamento","Data Início","Data Fim","Pilar","Função","Meta","Forma de Medição","Evidência Obrigatória"
"POLÍTICA DE COMPRAS","20","joao.santos@empresa.com","Estabelecer diretrizes de compras","Documento com política de compras, aprovação de fornecedores, prazos de pagamento","01/01/2026","31/12/2026","Eficiência Operacional","Analista Administrativo","Implementar sistema de compras","Sistema implementado e em uso","Comprovante de implementação"
"ROTINA DE VENDAS","15","ana.costa@empresa.com","Otimizar processo de vendas","Revisão de rotina de vendas com novos processos","15/01/2026","30/06/2026","Qualidade","Coordenadora de Vendas","Aumentar conversão 20%","Taxa de conversão aumentada","Relatório de vendas"
```

---

## ❌ Erros Comuns (O que NÃO fazer)

### 1. Datas em Formato Errado
❌ ERRADO:
- `2026-01-01` (ISO format)
- `01-01-2026` (com hífen)
- `1/1/2026` (sem zero)
- `Janeiro 1, 2026` (por extenso)

✅ CORRETO:
- `01/01/2026`

### 2. Peso com Símbolo
❌ ERRADO:
- `20%`
- `20,5` (vírgula)
- `R$ 20` (moeda)

✅ CORRETO:
- `20`
- `20.5`

### 3. Email Inválido
❌ ERRADO:
- `joao.santos` (sem @domínio)
- `joao.santos@` (sem domínio)
- `joao.santos@empressa.com` (domínio incorreto)
- `JOAO.SANTOS@EMPRESA.COM` (caso importa!)

✅ CORRETO:
- `joao.santos@empresa.com`

### 4. Responsável não Existe
❌ ERRADO:
```
Nome,Peso,Responsável
INDICADOR,20,usuario.inexistente@empresa.com
```

✅ CORRETO:
- Verificar se email existe no sistema antes
- Se não existe, criar usuário primeiro

### 5. Data Fim Anterior a Data Início
❌ ERRADO:
```
Data Início: 31/12/2026
Data Fim: 01/01/2026
```

✅ CORRETO:
```
Data Início: 01/01/2026
Data Fim: 31/12/2026
```

### 6. Célula Vazia Obrigatória
❌ ERRADO:
```
Nome: INDICADOR
Peso: (vazio)
Responsável: joao@empresa.com
```

✅ CORRETO:
```
Nome: INDICADOR
Peso: 20
Responsável: joao@empresa.com
```

---

## 🚀 Passo-a-Passo para Fazer Import

### 1. Preparar a Planilha

**Opção A: Usar Template (Recomendado)**
- [ ] Abrir Excel ou Google Sheets
- [ ] Criar cabeçalho com colunas:
  ```
  Nome | Peso | Responsável | Objetivo | Detalhamento | Data Início | Data Fim | Pilar | Função | Meta | Forma de Medição | Evidência Obrigatória
  ```
- [ ] Preencher dados (ver exemplo acima)

**Opção B: Importar do CSV/XLSX Template**
- [ ] Baixar arquivo: `indicadores_import_template.xlsx`
- [ ] Abrir no Excel/LibreOffice
- [ ] Preencher a partir da linha 2 (deixar cabeçalho igual)
- [ ] Salvar como `.xlsx` ou `.csv`

### 2. Validar Dados

**Antes de fazer upload, verificar:**

- [ ] Todas as linhas têm Nome, Peso, Responsável, Objetivo, Data Início, Data Fim
- [ ] Peso é número entre 0-100
- [ ] Responsável é email válido (formato `usuario@empresa.com`)
- [ ] Datas em formato `DD/MM/YYYY`
- [ ] Data Fim ≥ Data Início
- [ ] Nenhuma célula em branco nas colunas obrigatórias

### 3. Fazer Upload

- [ ] Acessar dashboard (GESTOR ou MASTER)
- [ ] Clique em "Importar Indicadores"
- [ ] Selecione arquivo `.xlsx` ou `.csv`
- [ ] Clique em "Importar"
- [ ] Sistema processa e retorna resultado

### 4. Verificar Resultado

O sistema retorna:
```json
{
  "success": true,
  "data": {
    "total_importados": 15,
    "sucesso": 14,
    "erros": 1,
    "detalhes": [
      {
        "linha": 8,
        "erro": "Responsável 'ana.costa.99@empresa.com' não encontrado"
      }
    ]
  }
}
```

**Ações:**

- ✅ Se `erros: 0` → Pronto! Todos os indicadores foram importados
- ⚠️ Se `erros > 0` → Corrigir linhas com erro e reimportar (apenas as linhas com erro)

### 5. Corrigir Erros (se houver)

1. Abrir resultado do import (lista de erros)
2. Identificar linhas com problema
3. Corrigir na planilha
4. Reimportar **apenas** as linhas problemáticas

Exemplo:
- Linha 8 → Email inválido
- Solução: Verificar email correto no sistema
- Reimportar só a linha 8

---

## 📊 Resposta do Sistema (Response)

### Sucesso Total

```json
{
  "success": true,
  "data": {
    "total_importados": 15,
    "sucesso": 15,
    "erros": 0,
    "detalhes": []
  },
  "timestamp": "2026-09-12T14:30:00Z"
}
```

**Toast:** ✅ "15 indicadores importados com sucesso"

### Com Erros

```json
{
  "success": true,
  "data": {
    "total_importados": 15,
    "sucesso": 14,
    "erros": 1,
    "detalhes": [
      {
        "linha": 8,
        "nome": "ROTINA DE VENDAS",
        "erro": "Responsável 'ana.costa.99@empresa.com' não encontrado no sistema",
        "sugestao": "Verificar email no cadastro de usuários"
      }
    ]
  },
  "timestamp": "2026-09-12T14:30:00Z"
}
```

**Toast:** ⚠️ "14 importados, 1 erro (linha 8)"

---

## 📥 Download de Templates

### Template Vazio (XLSX)

```excel
Nome | Peso | Responsável | Objetivo | Detalhamento | Data Início | Data Fim | Pilar | Função | Meta | Forma de Medição | Evidência Obrigatória
-----|------|-------------|----------|--------------|-------------|----------|-------|--------|------|------------------|-----------------------
     |      |             |          |              |             |          |       |        |      |                  |
     |      |             |          |              |             |          |       |        |      |                  |
     |      |             |          |              |             |          |       |        |      |                  |
```

**Download:** Botão [Baixar Template] no sistema

### Template com Exemplo (CSV)

```csv
"Nome","Peso","Responsável","Objetivo","Detalhamento","Data Início","Data Fim","Pilar","Função","Meta","Forma de Medição","Evidência Obrigatória"
"POLÍTICA DE COMPRAS","20","joao.santos@empresa.com","Estabelecer diretrizes de compras","Documento com política","01/01/2026","31/12/2026","Eficiência Operacional","Analista Admin","Implementar sistema","Sistema implementado","Comprovante"
"ROTINA DE VENDAS","15","ana.costa@empresa.com","Otimizar vendas","Revisão de rotina","15/01/2026","30/06/2026","Qualidade","Coordenadora","Aumentar 20%","Taxa aumentada","Relatório"
```

---

## 🔐 Segurança & Validações

### O que o Sistema Valida

- ✅ Arquivo é XLSX ou CSV (não aceita PDF, DOC, etc)
- ✅ Tamanho máximo: 5 MB
- ✅ Codificação UTF-8 (CSV)
- ✅ Peso entre 0-100
- ✅ Email válido
- ✅ Responsável existe no sistema
- ✅ Data Fim ≥ Data Início
- ✅ Nenhuma célula obrigatória vazia
- ✅ Comprimento máximo respeitado (255 chars para Nome, 2000 para Detalhamento)

### Limites de Import

- **Máximo por arquivo:** 1000 linhas
- **Máximo por requisição:** 5 MB
- **Máximo por dia:** 10.000 indicadores (rate limiting)
- **Frequency:** Máximo 1 import a cada 5 minutos por usuário

---

## 🆘 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| "Arquivo inválido" | Formato não é XLSX/CSV | Salvar como .xlsx ou .csv |
| "Email não encontrado" | Responsável não está cadastrado | Cadastrar usuário antes |
| "Peso inválido" | Valor > 100 ou não é número | Verificar peso entre 0-100 |
| "Data inválida" | Formato não é DD/MM/YYYY | Converter data para DD/MM/YYYY |
| "Data Fim menor que Data Início" | Datas invertidas | Data Fim deve ser ≥ Data Início |
| "Arquivo muito grande" | Maior que 5 MB | Dividir em múltiplos arquivos |
| "Timeout" | Arquivo com 1000+ linhas | Dividir em lotes menores |

---

## 📝 Logs & Auditoria

Cada import é registrado em `indicador_updates`:

```
tipo_alteracao: "CRIACAO"
usuario_alterou_id: <user_id_who_imported>
criado_em: <timestamp>
campo_alterado: null
valor_anterior: null
valor_novo: <full_indicador_data>
motivo: "Import em massa via planilha"
```

Gestores podem ver histórico completo:
```
GET /api/indicators/:id/history
```

---

## 📄 Arquivo para Download

Nome: **indicadores_import_template.xlsx**  
Formato: Excel (Office Open XML)  
Tamanho: ~30 KB  
Última atualização: 2026-09-12

**Versão:** 1.0  
**Data:** 2026-09-12  
**Suporte:** Telefone (XX) XXXX-XXXX ou email suporte@empresa.com

