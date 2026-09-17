# Especificação Backend Atualizada — Sistema de Metas

**Versão:** 2.1 (Com Ajustes de Roles e Dashboard)  
**Data:** 2026-09-12  
**Status:** Pronto para Implementação

---

## 🔄 MUDANÇAS PRINCIPAIS (vs 2.0)

### 1. Roles Simplificados: 4 → 3

| Antes | Novo | Descrição |
|-------|------|-----------|
| ADMIN | **MASTER** | Acesso total, todos os departamentos |
| GERENTE_RH | **GESTOR** | Acesso ao seu departamento |
| GERENTE_DEPARTAMENTO | _(removido)_ | Funcionalidade movida para GESTOR |
| COLABORADOR | **COLABORADOR** | Acesso apenas seus indicadores |

### 2. Dashboard com Métricas
- Nova seção: **GET /api/dashboard/stats** (GESTOR e MASTER)
- Mostra: Total, Pendente, Em Aprovação, Aprovado

### 3. Modal de Observação
- Novo campo em aprovação: `observacao` (texto)
- Armazenado em `indicador_updates` (auditoria)

### 4. Template de Planilha Import
- Novo arquivo: **IMPORT_PLANILHA_TEMPLATE.md**
- Colunas esperadas, formatos, exemplo completo

---

## 📋 Seção 1: Roles & Permissões (ATUALIZADO)

### Role: MASTER
```
Acesso: TUDO — Sistema Inteiro
├─ Visualizar todos os indicadores (todos os colaboradores, todos os departamentos)
├─ Editar indicadores (nome, peso, meta, objetivo, datas)
├─ Reatribuir indicadores para qualquer colaborador
├─ Gerenciar usuários (criar, ativar, desativar, alterar role)
├─ Gerenciar departamentos
├─ Gerenciar cargos e trilhas
├─ Visualizar histórico completo (auditoria)
├─ Aprovação de indicadores (sem restrição)
├─ Gerar relatórios e exportar dados
├─ Visualizar Dashboard com métricas de TODOS os departamentos
└─ Configurações do sistema

Endpoints: GET/POST/PUT/DELETE em /api/* (sem restrição)
Dashboard: GET /api/dashboard/stats (todos os depts)
```

### Role: GESTOR
```
Acesso: Seu Departamento + Aprovações
├─ Visualizar indicadores do SEU departamento (todos os colaboradores)
├─ Editar indicadores do seu departamento
├─ Reatribuir indicadores dentro do seu departamento
├─ Aprovar/Rejeitar indicadores do seu departamento
├─ Visualizar histórico do seu departamento
├─ Visualizar Dashboard com métricas do seu departamento
├─ Não pode: ver outros departamentos, deletar, gestão de cargos
├─ Não pode: gerar relatórios globais

Endpoints: 
  - GET /api/indicators?departamento={seu_dept}
  - PUT /api/indicators/:id/approve (próprio dept)
  - GET /api/dashboard/stats (apenas seu dept)
```

### Role: COLABORADOR
```
Acesso: Seus Indicadores APENAS
├─ Visualizar seus indicadores (dashboard pessoal)
├─ Marcar indicador como concluído (checkbox)
├─ Desmarcar indicador
├─ Solicitar conclusão (enviar para aprovação do gestor)
├─ Anexar documentos de comprovação
├─ Visualizar histórico pessoal
├─ Não pode: editar, ver outros indicadores, deletar, aprovar

Endpoints: 
  - GET /api/indicators/me
  - PATCH /api/indicators/:id/complete
  - POST /api/indicators/:id/attachments
```

---

## 📊 Seção 2: Dashboard & Métricas (NOVO)

### GET /api/dashboard/stats
**Protegido** — MASTER, GESTOR

Query Parameters:
- Nenhum (GESTOR vê seu dept automaticamente, MASTER vê todos)

#### Response (200) — MASTER
```json
{
  "success": true,
  "data": {
    "resumo_geral": {
      "total_indicadores": 42,
      "pendentes": 15,
      "em_aprovacao": 8,
      "aprovados": 19,
      "taxa_aprovacao": 45.2,
      "taxa_conclusao": 45.2
    },
    "por_departamento": [
      {
        "departamento": "ADMINISTRATIVO",
        "total": 10,
        "pendentes": 3,
        "em_aprovacao": 2,
        "aprovados": 5,
        "taxa_conclusao": 50
      },
      {
        "departamento": "TECNOLOGIA",
        "total": 12,
        "pendentes": 5,
        "em_aprovacao": 3,
        "aprovados": 4,
        "taxa_conclusao": 33.3
      }
    ],
    "por_colaborador": [
      {
        "nome": "João Santos",
        "email": "joao@empresa.com",
        "departamento": "ADMINISTRATIVO",
        "total": 5,
        "pendentes": 1,
        "em_aprovacao": 1,
        "aprovados": 3,
        "taxa_conclusao": 60
      }
    ]
  }
}
```

#### Response (200) — GESTOR (seu departamento)
```json
{
  "success": true,
  "data": {
    "resumo_departamento": {
      "departamento": "ADMINISTRATIVO",
      "total_indicadores": 10,
      "pendentes": 3,
      "em_aprovacao": 2,
      "aprovados": 5,
      "taxa_aprovacao": 50,
      "taxa_conclusao": 50
    },
    "por_colaborador": [
      {
        "nome": "João Santos",
        "email": "joao@empresa.com",
        "total": 5,
        "pendentes": 1,
        "em_aprovacao": 1,
        "aprovados": 3,
        "taxa_conclusao": 60
      }
    ]
  }
}
```

---

## 🔐 Seção 3: Aprovação com Observação (ATUALIZADO)

### PATCH /api/indicators/:id/approve
**Protegido** — MASTER, GESTOR (seu dept)

#### Request (NOVO — adiciona observacao)
```json
{
  "aprovado": true,
  "observacao": "Indicador validado conforme critérios de qualidade. Documentação completa e evidências anexadas.",
  "motivo": "Aprovação padrão"
}
```

#### Campos:
- `aprovado` (boolean, required) — aprovar ou rejeitar
- `observacao` (string, max 500 chars, optional) — comentário do gestor/approver
- `motivo` (string, optional) — razão (deprecated, manter por backward compat)

#### Behavior:
- Se `aprovado: true`:
  - Status → "CONCLUIDO" (se MASTER) ou "AGUARDANDO_RH" (se GESTOR)
  - `observacao` registrada em `indicador_updates`
  - Notifica colaborador com observação
  
- Se `aprovado: false`:
  - Status → "EM_ANDAMENTO"
  - `observacao` explica razão da rejeição
  - Colaborador vê feedback no dashboard

#### Response (200)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CONCLUIDO",
    "observacao": "Indicador validado conforme critérios..."
  },
  "audit": {
    "alterou": "Maria Silva",
    "timestamp": "2026-09-12T10:30:00Z",
    "observacao": "Indicador validado conforme critérios..."
  }
}
```

---

## 🗂️ Seção 4: Estrutura de Dados Atualizada

### Tabela: indicador_updates (MODIFICADA)

Adicionar coluna:
```sql
ALTER TABLE indicador_updates ADD COLUMN observacao VARCHAR(500);
```

Ou no schema original:
```sql
CREATE TABLE indicador_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id UUID NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  usuario_alterou_id UUID NOT NULL REFERENCES users(id),
  tipo_alteracao VARCHAR(50) NOT NULL,
  campo_alterado VARCHAR(255),
  valor_anterior JSONB,
  valor_novo JSONB,
  motivo TEXT,
  observacao VARCHAR(500),  -- ← NOVO
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: users (ROLE ATUALIZADO)

```sql
role VARCHAR(50) NOT NULL DEFAULT 'COLABORADOR'
  CHECK (role IN ('MASTER', 'GESTOR', 'COLABORADOR'))
```

---

## 📱 Seção 5: Frontend — Modal de Observação

### Componente: AprovaIndicadorModal.tsx (NOVO)

```tsx
interface AprovaIndicadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicador: Indicador;
  onApprove: (aprovado: boolean, observacao: string) => Promise<void>;
}

export default function AprovaIndicadorModal({
  isOpen,
  onClose,
  indicador,
  onApprove
}: AprovaIndicadorModalProps) {
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async (aprovado: boolean) => {
    setLoading(true);
    try {
      await onApprove(aprovado, observacao);
      toast.success(aprovado ? 'Aprovado' : 'Rejeitado');
      onClose();
    } catch (err) {
      toast.error('Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>Aprovar Indicador</h3>
      
      <div className="mb-4">
        <strong>{indicador.nome}</strong>
        <p className="text-sm text-gray-600">
          Responsável: {indicador.responsavel}
        </p>
      </div>

      <label className="block mb-4">
        <span className="block text-sm font-medium mb-2">
          Observação (opcional)
        </span>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full border rounded p-2"
          placeholder="Digite sua observação (máx 500 caracteres)..."
        />
        <span className="text-xs text-gray-500">
          {observacao.length}/500
        </span>
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => handleApprove(false)}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Rejeitar
        </button>
        <button
          onClick={() => handleApprove(true)}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Aprovar
        </button>
      </div>
    </Modal>
  );
}
```

---

## 🎯 Seção 6: Fluxo Atualizado

### Novo Fluxo: Colaborador → Gestor → Master

```
1. Colaborador marca indicador concluído
   └─ PATCH /api/indicators/:id/complete

2. Gestor vê no dashboard (stats)
   └─ GET /api/dashboard/stats
   └─ Vê: 3 pendentes, 2 em aprovação, 5 aprovados

3. Gestor clica [Aprovar]
   └─ Modal abre pedindo observação
   └─ Digita: "Indicador validado conforme critérios..."
   └─ Clica [Aprovar]
   └─ PATCH /api/indicators/:id/approve
     {
       aprovado: true,
       observacao: "Indicador validado conforme critérios..."
     }

4. Se Gestor:
   └─ Status → "AGUARDANDO_RH"
   └─ Envia para Master revisar
   └─ Notifica Master

5. Se Master:
   └─ Status → "CONCLUIDO"
   └─ Seta concluido_em = NOW()
   └─ Finaliza fluxo
   └─ Notifica colaborador

6. Colaborador vê feedback
   └─ "Aprovado em 12/09/2026 às 10:30"
   └─ Observação: "Indicador validado conforme critérios..."
```

---

## 📋 Seção 7: Tipos TypeScript Atualizados

### types/index.ts (ATUALIZADO)

```typescript
export type Role = 'MASTER' | 'GESTOR' | 'COLABORADOR';

export type IndicadorStatus =
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_APROVACAO'
  | 'CONCLUIDO'
  | 'ATRASADO'
  | 'PAUSADO';

export type TipoAlteracao =
  | 'CRIACAO'
  | 'EDICAO'
  | 'CONCLUSAO'
  | 'REATRIBUICAO'
  | 'SOLICITACAO_CONCLUSAO'
  | 'APROVACAO'
  | 'REJEICAO';

export interface DashboardStats {
  resumo_geral?: {
    total_indicadores: number;
    pendentes: number;
    em_aprovacao: number;
    aprovados: number;
    taxa_aprovacao: number;
    taxa_conclusao: number;
  };
  resumo_departamento?: {
    departamento: string;
    total_indicadores: number;
    pendentes: number;
    em_aprovacao: number;
    aprovados: number;
    taxa_aprovacao: number;
    taxa_conclusao: number;
  };
  por_departamento?: Array<{
    departamento: string;
    total: number;
    pendentes: number;
    em_aprovacao: number;
    aprovados: number;
    taxa_conclusao: number;
  }>;
  por_colaborador: Array<{
    nome: string;
    email: string;
    departamento: string;
    total: number;
    pendentes: number;
    em_aprovacao: number;
    aprovados: number;
    taxa_conclusao: number;
  }>;
}

export interface IndicadorUpdate extends IndicadorUpdateBase {
  observacao?: string; // ← NOVO
}

export interface ApproveIndicadorRequest {
  aprovado: boolean;
  observacao?: string; // ← NOVO
  motivo?: string; // deprecated
}
```

---

## 🔄 Migrações SQL Necessárias

```sql
-- 1. Atualizar constraints de role
ALTER TABLE users DROP CONSTRAINT chk_role_valid;
ALTER TABLE users ADD CONSTRAINT chk_role_valid 
  CHECK (role IN ('MASTER', 'GESTOR', 'COLABORADOR'));

-- 2. Adicionar coluna observacao
ALTER TABLE indicador_updates ADD COLUMN observacao VARCHAR(500);

-- 3. Atualizar tipo_alteracao constraint (simplificar)
ALTER TABLE indicador_updates DROP CONSTRAINT indicador_updates_tipo_alteracao_check;
ALTER TABLE indicador_updates ADD CONSTRAINT indicador_updates_tipo_alteracao_check 
  CHECK (tipo_alteracao IN ('CRIACAO', 'EDICAO', 'CONCLUSAO', 'REATRIBUICAO', 
                           'SOLICITACAO_CONCLUSAO', 'APROVACAO', 'REJEICAO'));
```

---

## 📊 Dashboard Layout (Frontend)

### Para MASTER
```
┌─────────────────────────────────────────────────────┐
│ Dashboard Master                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Resumo Geral da Empresa                            │
│ ┌────────┬─────────┬──────────┬──────────┐         │
│ │ Total  │Pendente │Em Aprov. │Aprovado  │         │
│ │  42    │   15    │    8     │   19     │         │
│ │ 100%   │ 35.7%   │  19.0%   │  45.2%   │         │
│ └────────┴─────────┴──────────┴──────────┘         │
│                                                     │
│ Por Departamento (gráfico ou tabela)               │
│ ┌──────────────┬─────┬──────────┬────────────┐    │
│ │ Depto        │Tot. │Pendente  │Taxa Concl. │    │
│ ├──────────────┼─────┼──────────┼────────────┤    │
│ │ADMINISTRATIVO│ 10  │    3     │    50%     │    │
│ │TECNOLOGIA    │ 12  │    5     │    33%     │    │
│ │VENDAS        │  8  │    2     │    62%     │    │
│ └──────────────┴─────┴──────────┴────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Para GESTOR
```
┌──────────────────────────────────────────────────┐
│ Dashboard — Departamento: ADMINISTRATIVO         │
├──────────────────────────────────────────────────┤
│                                                  │
│ Resumo do Departamento                          │
│ ┌────────┬─────────┬──────────┬──────────┐      │
│ │ Total  │Pendente │Em Aprov. │Aprovado  │      │
│ │  10    │    3    │    2     │    5     │      │
│ │ 100%   │  30%    │   20%    │   50%    │      │
│ └────────┴─────────┴──────────┴──────────┘      │
│                                                  │
│ Colaboradores do Departamento                   │
│ ┌──────────────┬──────┬──────┬──────┬────────┐ │
│ │ Nome         │Tot. │Pend. │Aprov.│Taxa %  │ │
│ ├──────────────┼──────┼──────┼──────┼────────┤ │
│ │João Santos   │  5  │  1   │  3   │  60%   │ │
│ │Ana Costa     │  3  │  1   │  2   │  66%   │ │
│ │Pedro Oliveira│  2  │  1   │  1   │  50%   │ │
│ └──────────────┴──────┴──────┴──────┴────────┘ │
│                                                  │
│ Ações Pendentes: [Ver Pendentes] [Aprovar]     │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

**Versão:** 2.1  
**Última atualização:** 2026-09-12  
**Status:** Pronto para Implementação

