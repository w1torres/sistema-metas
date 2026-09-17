# ⚡ CHECKLIST RÁPIDO — Implementação v2.1 (COM CORREÇÕES)

**Versão:** 2.1 (Lacunas Preenchidas)  
**Data:** 2026-09-14  
**Status:** ✅ PRONTO PARA COMEÇAR

---

## 📥 ARQUIVOS NECESSÁRIOS

| Arquivo | Tamanho | Conteúdo | Quando Usar |
|---------|---------|----------|-------------|
| **backend-etapa-2.1-completo.zip** | 33 KB | Pacote completo | Descompactar e usar |
| **SUMARIO_CORRECOES_v2.1.md** | 11 KB | ⭐ LER PRIMEIRO | Entender correções |
| **ESPECIFICACOES_FALTANTES_v2.1.md** | 22 KB | Detalhe das lacunas | Desenvolvimento |
| **MIGRATION_USUARIOS_CAMPOS_v2.1.sql** | 9.2 KB | SQL dos campos novos | Executar em BD |

---

## 🚀 5 PASSOS INICIAIS

### **PASSO 1: Ler (15 minutos)**
```
Leia NESTA ORDEM:
1. SUMARIO_CORRECOES_v2.1.md (5 min) ← Entender o quê mudou
2. ESPECIFICACOES_FALTANTES_v2.1.md (10 min) ← Detalhe técnico
```

### **PASSO 2: Preparar BD (5 minutos)**
```bash
# Executar migrações na ordem:

1. DATABASE_SCHEMA.sql (original)
   psql -U postgres -d metas_db -f DATABASE_SCHEMA.sql

2. MIGRATION_v2.1.sql (roles simplificados)
   psql -U postgres -d metas_db -f MIGRATION_v2.1.sql

3. MIGRATION_USUARIOS_CAMPOS_v2.1.sql (campos novos)
   psql -U postgres -d metas_db -f MIGRATION_USUARIOS_CAMPOS_v2.1.sql

✅ BD atualizado!
```

### **PASSO 3: Verificar BD (5 minutos)**
```bash
# Testar campos novos
psql -U postgres -d metas_db -c "
  SELECT id, nome, cpf, data_admissao, filial 
  FROM users LIMIT 1;
"

# Testar view gestor
psql -U postgres -d metas_db -c "
  SELECT * FROM v_dashboard_gestor_colaboradores LIMIT 1;
"
```

### **PASSO 4: Backend — Implementar APIs (2-3 dias)**
```
Prioridade 1: GET /api/dashboard/stats
  └─ Retorna cards com colaboradores
  └─ Diferente para MASTER (todos) e GESTOR (seu dept)

Prioridade 2: POST/PUT /api/users
  └─ Aceitar 6 campos novos
  └─ Validar data_admissao (não futuro)

Prioridade 3: PATCH /api/indicators/:id/approve
  └─ Já tem observacao (verificar)
  └─ Registra em auditoria

Validações RBAC:
  ✓ GESTOR vê apenas seu departamento
  ✓ GESTOR aprova AGUARDANDO_APROVACAO (1º nível)
  ✓ MASTER aprova CONCLUIDO (final)
  ✓ COLABORADOR aprova: NÃO pode
```

### **PASSO 5: Frontend — Atualizar Componentes (2-3 dias)**
```
Componentes a Atualizar:
├─ DashboardGestorMaster.tsx
│  └─ Adicionar cards com colaboradores
│
├─ ColaboradorCard.tsx (NOVO)
│  └─ Componente para cada colaborador com métricas
│  └─ Mostrar indicadores
│  └─ Botão [Aprovar] por indicador
│
├─ AprovaIndicadorModal.tsx
│  └─ Já tem observacao (visto)
│  └─ Testar integração
│
├─ UsuariosPage.tsx
│  └─ Adicionar 6 campos no form
│
└─ NovoUsuarioModal.tsx
   └─ Adicionar 6 campos no form
```

---

## ✅ RBAC — Comportamentos Esperados

### **MASTER — O que VÊ**
```
✅ Dashboard com resumo GERAL
✅ Cards com TODOS departamentos (scroll horizontal)
✅ Ao clicar depto → Modal com TODOS colaboradores
✅ Ao clicar colaborador → Ver TODOS seus indicadores
✅ Botão [Aprovar] em TODOS indicadores
✅ Aprovar → status CONCLUIDO (final)
✅ Ver feedback com observação
```

### **GESTOR — O que VÊ**
```
✅ Dashboard com resumo do SEU departamento
✅ Cards com colaboradores do SEU departamento (expandidos)
✅ Cada colaborador mostra seus indicadores
✅ Indicadores já listados (sem modal)
✅ Botão [Aprovar] em indicadores do seu dept
✅ Aprovar → status AGUARDANDO_APROVACAO (1º nível)
✅ Não vê outros departamentos
✅ Não aprova final (vai para MASTER)
```

### **COLABORADOR — O que VÊ**
```
✅ Dashboard pessoal com seus indicadores
✅ Botão [Marcar Concluído]
✅ Feedback de aprovação/rejeição
✅ Observação do GESTOR/MASTER
✅ Não vê indicadores de outros
✅ Não aprova
```

---

## 📊 Novos Campos Cadastro (6 adicionados)

| Campo | Tipo | Obrigatório | Formato | Exemplo |
|-------|------|-------------|---------|---------|
| **data_nascimento** | Data | Não | YYYY-MM-DD | 1981-07-21 |
| **data_admissao** | Data | Sim | YYYY-MM-DD | 2023-10-16 |
| **filial** | Texto | Não | Texto livre | FORMOSA-GO |
| **endereco_completo** | Texto | Não | Texto livre | Rua X, 123, Formosa-GO |
| **telefone** | Texto | Não | (XX) XXXX-XXXX | (62) 3216-1234 |
| **celular** | Texto | Não | (XX) XXXXX-XXXX | (62) 98765-4321 |

**Form no Frontend:**
```
DADOS PESSOAIS
├─ Nome (obrigatório)
├─ Email (obrigatório)
├─ CPF (obrigatório)
├─ Data de Nascimento
├─ Telefone
└─ Celular

DADOS PROFISSIONAIS
├─ Matrícula (obrigatório)
├─ Cargo (obrigatório)
├─ Departamento
├─ Filial
├─ Data de Admissão
└─ Endereço

PERFIL
├─ Role: ○ COLABORADOR  ○ GESTOR  ○ MASTER
└─ Ativo: ☑ Sim
```

---

## 🔄 Ordem de Execução SQL

```bash
# ✅ CORRETO (fazer assim)

psql -U postgres -d metas_db -c "
  -- 1. ORIGINAL
  \i DATABASE_SCHEMA.sql
  
  -- 2. ROLES SIMPLIFICADOS (v2.0 → v2.1)
  \i MIGRATION_v2.1.sql
  
  -- 3. CAMPOS CADASTRO (NOVO)
  \i MIGRATION_USUARIOS_CAMPOS_v2.1.sql
"

# ✅ Pronto! BD está atualizado para v2.1
```

---

## 🆚 Diferenças Antes vs Depois

### **RBAC GESTOR**
```
ANTES: "Gestor aprova indicadores"
DEPOIS: "Gestor aprova indicadores do SEU departamento APENAS"
```

### **Dashboard**
```
ANTES: Sem cards de colaboradores
DEPOIS: Cards com cada colaborador + métricas + botão [Aprovar]
```

### **Cadastro Usuário**
```
ANTES: Nome, Email, CPF, Cargo, Depto, Role
DEPOIS: + Data Nascimento, Data Admissão, Filial, Telefone, Celular, Endereço
```

### **Fluxo Aprovação**
```
ANTES: COLABORADOR → GESTOR → MASTER → CONCLUIDO
DEPOIS: COLABORADOR → GESTOR (AGUARDANDO) → MASTER (CONCLUIDO)
```

---

## 🧪 Testes Mínimos

### **Backend**
- [ ] GET /api/dashboard/stats (MASTER) retorna todos os depts
- [ ] GET /api/dashboard/stats (GESTOR) retorna apenas seu dept
- [ ] POST /api/users com 6 campos novos
- [ ] PATCH /api/indicators/:id/approve com observacao
- [ ] RBAC: GESTOR não vê outro dept (403)
- [ ] RBAC: COLABORADOR não aprova (403)

### **Frontend**
- [ ] Dashboard MASTER mostra cards de depts
- [ ] Dashboard GESTOR mostra colaboradores do dept
- [ ] Botão [Aprovar] abre modal com observacao
- [ ] Novo usuário form tem 6 campos novos
- [ ] RBAC: GESTOR vê apenas seu dept (filtrado)
- [ ] Observação mostra no histórico

### **Database**
- [ ] Colunas criadas: data_nascimento, data_admissao, filial, etc
- [ ] Índices funcionando (performance)
- [ ] Views retornam dados corretos
- [ ] Trigger valida data_admissao

---

## 📞 Dúvidas Frequentes

**P: Por que GESTOR não aprova final?**  
R: GESTOR aprova 1º nível (valida localmente). MASTER aprova final (CONCLUIDO). Garante qualidade.

**P: GESTOR vê indicadores de outro departamento?**  
R: Não. SÓ seu departamento. Implementar RBAC em GET /api/indicators.

**P: Os 6 campos novos são obrigatórios?**  
R: Apenas data_admissao. Outros são opcionais.

**P: Observação vai onde?**  
R: Em indicador_updates.observacao. Mostra no histórico.

**P: Dashboard tem paginação?**  
R: Não especificado. Começar sem, adicionar se crescer.

---

## 📋 Arquivos a Usar

### **Descompactar o ZIP:**
```bash
unzip backend-etapa-2.1-completo.zip
```

### **Copiar SQLs para BD:**
```bash
# Ter prontos:
- DATABASE_SCHEMA.sql
- MIGRATION_v2.1.sql
- MIGRATION_USUARIOS_CAMPOS_v2.1.sql
```

### **Para Desenvolvimento:**
- BACKEND_SPECS_v2.1.md (API reference)
- ESPECIFICACOES_FALTANTES_v2.1.md (detalhe técnico)
- CHANGELOG_v2.1.md (antes/depois com código)

---

## 🎯 Timeline

| Semana | Atividade | Duração |
|--------|-----------|---------|
| 1 | Setup DB + Migrações | 2-3 dias |
| 2 | Backend (APIs + RBAC) | 3-4 dias |
| 3 | Frontend (Componentes) | 3-4 dias |
| 4 | Testes + Integração | 2-3 dias |
| 5 | Deploy | 1-2 dias |

**Total:** 20-25 dias (1-2 devs)

---

## ✨ Status Final

- [x] RBAC: Simplificado e documentado (3 roles)
- [x] Dashboard: Layout especificado (cards + colaboradores)
- [x] Cadastro: 6 campos novos adicionados
- [x] Aprovação: Com observação (já tinha)
- [x] SQL: Migrações prontas
- [x] API: Endpoints especificados
- [x] Frontend: Componentes identificados

**TUDO PRONTO PARA COMEÇAR! 🚀**

---

**Gerado:** 2026-09-14  
**Versão:** 2.1 (Completo)  
**Status:** ✅ LACUNAS PREENCHIDAS
