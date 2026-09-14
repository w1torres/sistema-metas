-- ============================================================================
-- MIGRAÇÕES SQL — Etapa 2.1 (Roles 4→3 + Observação)
-- ============================================================================
-- Executar após DATABASE_SCHEMA.sql original
-- Atualiza: roles simplificados + coluna observacao

-- ============================================================================
-- 1. ATUALIZAR CONSTRAINT DE ROLES (users table)
-- ============================================================================

-- Remover constraint antigas
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_role_valid;

-- Adicionar nova constraint (3 roles)
ALTER TABLE users ADD CONSTRAINT chk_role_valid 
  CHECK (role IN ('MASTER', 'GESTOR', 'COLABORADOR'));

-- Atualizar valores existentes (se houver dados antigos)
UPDATE users 
SET role = 'MASTER' 
WHERE role IN ('ADMIN', 'GERENTE_RH');

UPDATE users 
SET role = 'GESTOR' 
WHERE role IN ('GERENTE_DEPARTAMENTO');

-- Verify
SELECT DISTINCT role FROM users;
-- Esperado: MASTER, GESTOR, COLABORADOR

-- ============================================================================
-- 2. ADICIONAR COLUNA OBSERVACAO (indicador_updates table)
-- ============================================================================

-- Verificar se coluna já existe
ALTER TABLE indicador_updates 
ADD COLUMN IF NOT EXISTS observacao VARCHAR(500);

-- ============================================================================
-- 3. ATUALIZAR TIPO_ALTERACAO CONSTRAINT
-- ============================================================================

-- Remover constraint antiga (8 valores → 7 valores)
ALTER TABLE indicador_updates 
DROP CONSTRAINT IF EXISTS indicador_updates_tipo_alteracao_check;

-- Adicionar nova constraint (simplificada)
ALTER TABLE indicador_updates 
ADD CONSTRAINT indicador_updates_tipo_alteracao_check 
  CHECK (tipo_alteracao IN (
    'CRIACAO', 
    'EDICAO', 
    'CONCLUSAO', 
    'REATRIBUICAO', 
    'SOLICITACAO_CONCLUSAO', 
    'APROVACAO',      -- substitui APROVACAO_GESTOR + APROVACAO_RH
    'REJEICAO'
  ));

-- Migrate existing data (se houver)
UPDATE indicador_updates 
SET tipo_alteracao = 'APROVACAO' 
WHERE tipo_alteracao IN ('APROVACAO_GESTOR', 'APROVACAO_RH');

-- Verify
SELECT DISTINCT tipo_alteracao FROM indicador_updates;

-- ============================================================================
-- 4. SIMPLIFICAR STATUS DE INDICADORES
-- ============================================================================

-- Opcional: simplificar status também
-- Remover constraint antiga
ALTER TABLE indicadores 
DROP CONSTRAINT IF EXISTS indicadores_status_check;

-- Adicionar nova constraint (simplificada)
ALTER TABLE indicadores 
ADD CONSTRAINT indicadores_status_check 
  CHECK (status IN (
    'EM_ANDAMENTO', 
    'AGUARDANDO_APROVACAO',  -- substitui GESTOR + RH
    'CONCLUIDO', 
    'ATRASADO', 
    'PAUSADO'
  ));

-- Migrate existing data
UPDATE indicadores 
SET status = 'AGUARDANDO_APROVACAO' 
WHERE status IN ('AGUARDANDO_APROVACAO_GESTOR', 'AGUARDANDO_APROVACAO_RH');

-- Verify
SELECT DISTINCT status FROM indicadores;

-- ============================================================================
-- 5. INDEX PARA PERFORMANCE (opcional, mas recomendado)
-- ============================================================================

-- Index para dashboard stats
CREATE INDEX IF NOT EXISTS idx_indicadores_status_departamento 
  ON indicadores(status, departamento_id);

CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_status 
  ON indicadores(usuario_responsavel_id, status);

CREATE INDEX IF NOT EXISTS idx_indicador_updates_observacao 
  ON indicador_updates(observacao) 
  WHERE observacao IS NOT NULL;

-- ============================================================================
-- 6. UPDATE VIEWS (se houver)
-- ============================================================================

-- Recriar view se existir
DROP VIEW IF EXISTS v_indicadores_completo CASCADE;

CREATE VIEW v_indicadores_completo AS
SELECT 
  i.id,
  i.nome,
  i.peso,
  i.status,
  i.atendimento,
  i.objetivo,
  i.detalhamento,
  i.data_inicio,
  i.data_fim,
  i.concluido_em,
  u.id AS usuario_responsavel_id,
  u.nome AS usuario_responsavel_nome,
  u.email AS usuario_responsavel_email,
  u.role AS usuario_role,
  d.id AS departamento_id,
  d.nome AS departamento_nome,
  (SELECT COUNT(*) FROM attachments WHERE indicador_id = i.id) AS total_anexos,
  (SELECT COUNT(*) FROM indicador_updates WHERE indicador_id = i.id) AS total_alteracoes,
  i.criado_em,
  i.atualizado_em
FROM indicadores i
JOIN users u ON i.usuario_responsavel_id = u.id
JOIN departamentos d ON i.departamento_id = d.id
ORDER BY i.criado_em DESC;

-- ============================================================================
-- 7. CRIAR VIEW PARA DASHBOARD STATS (NOVO)
-- ============================================================================

-- View: Stats por Departamento (para GESTOR)
CREATE OR REPLACE VIEW v_dashboard_stats_departamento AS
SELECT 
  d.id AS departamento_id,
  d.nome AS departamento_nome,
  COUNT(i.id) AS total_indicadores,
  COUNT(CASE WHEN i.status = 'EM_ANDAMENTO' THEN 1 END) AS pendentes,
  COUNT(CASE WHEN i.status = 'AGUARDANDO_APROVACAO' THEN 1 END) AS em_aprovacao,
  COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END) AS aprovados,
  ROUND(
    (COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(i.id), 0)) * 100, 
    2
  ) AS taxa_conclusao
FROM departamentos d
LEFT JOIN indicadores i ON d.id = i.departamento_id
GROUP BY d.id, d.nome
ORDER BY d.nome;

-- View: Stats por Colaborador (para MASTER/GESTOR)
CREATE OR REPLACE VIEW v_dashboard_stats_colaborador AS
SELECT 
  u.id AS usuario_id,
  u.nome AS usuario_nome,
  u.email,
  u.departamento_id,
  d.nome AS departamento_nome,
  COUNT(i.id) AS total_indicadores,
  COUNT(CASE WHEN i.status = 'EM_ANDAMENTO' THEN 1 END) AS pendentes,
  COUNT(CASE WHEN i.status = 'AGUARDANDO_APROVACAO' THEN 1 END) AS em_aprovacao,
  COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END) AS aprovados,
  ROUND(
    (COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(i.id), 0)) * 100, 
    2
  ) AS taxa_conclusao
FROM users u
LEFT JOIN departamentos d ON u.departamento_id = d.id
LEFT JOIN indicadores i ON u.id = i.usuario_responsavel_id
WHERE u.ativo = true
GROUP BY u.id, u.nome, u.email, u.departamento_id, d.nome
ORDER BY d.nome, u.nome;

-- View: Stats Geral (para MASTER)
CREATE OR REPLACE VIEW v_dashboard_stats_geral AS
SELECT 
  COUNT(i.id) AS total_indicadores,
  COUNT(CASE WHEN i.status = 'EM_ANDAMENTO' THEN 1 END) AS pendentes,
  COUNT(CASE WHEN i.status = 'AGUARDANDO_APROVACAO' THEN 1 END) AS em_aprovacao,
  COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END) AS aprovados,
  ROUND(
    (COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(i.id), 0)) * 100, 
    2
  ) AS taxa_conclusao
FROM indicadores i;

-- ============================================================================
-- 8. EXEMPLO DE DADOS MIGRADOS (VERIFICAÇÃO)
-- ============================================================================

-- Verificar users com novo role
SELECT id, nome, email, role, departamento_id 
FROM users 
WHERE ativo = true 
ORDER BY role, nome;

-- Exemplo resultado esperado:
-- ┌──────────────┬────────────────┬──────────────────────┬────────────┬─────────────────┐
-- │ id           │ nome           │ email                │ role       │ departamento_id │
-- ├──────────────┼────────────────┼──────────────────────┼────────────┼─────────────────┤
-- │ uuid-master  │ Master User    │ master@empresa.com   │ MASTER     │ dept-adm        │
-- │ uuid-gestor1 │ Gestor Admin   │ gestor.adm@emp.com   │ GESTOR     │ dept-adm        │
-- │ uuid-colab1  │ João Santos    │ joao@empresa.com     │ COLABORADOR│ dept-adm        │
-- │ uuid-colab2  │ Ana Costa      │ ana@empresa.com      │ COLABORADOR│ dept-tech       │
-- └──────────────┴────────────────┴──────────────────────┴────────────┴─────────────────┘

-- Verificar status simplificado
SELECT DISTINCT status FROM indicadores ORDER BY status;
-- Esperado: AGUARDANDO_APROVACAO, ATRASADO, CONCLUIDO, EM_ANDAMENTO, PAUSADO

-- Verificar observacao em audit
SELECT id, tipo_alteracao, observacao 
FROM indicador_updates 
WHERE observacao IS NOT NULL 
LIMIT 5;

-- ============================================================================
-- 9. DADOS DE TESTE (OPCIONAL)
-- ============================================================================

-- Atualizar departamento para ter gestor
UPDATE departamentos 
SET gerente_id = (
  SELECT id FROM users 
  WHERE role = 'GESTOR' AND departamento_id = departamentos.id 
  LIMIT 1
)
WHERE gerente_id IS NULL;

-- Criar usuário MASTER para testes (se não existir)
INSERT INTO users (
  email, nome, departamento_id, role, microsoft_graph_id, ativo
)
SELECT 
  'master@empresa.com',
  'Administrador Sistema',
  (SELECT id FROM departamentos WHERE nome = 'RECURSOS HUMANOS' LIMIT 1),
  'MASTER',
  'master-oid-' || gen_random_uuid()::text,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'master@empresa.com'
);

-- ============================================================================
-- 10. VALIDAÇÃO FINAL
-- ============================================================================

-- Verificar migrações
DO $$
DECLARE
  v_roles_count INTEGER;
  v_status_count INTEGER;
  v_observacao_exists BOOLEAN;
BEGIN
  -- Contar roles únicos
  SELECT COUNT(DISTINCT role) INTO v_roles_count FROM users;
  
  -- Contar status únicos
  SELECT COUNT(DISTINCT status) INTO v_status_count FROM indicadores;
  
  -- Verificar coluna observacao
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'indicador_updates' 
    AND column_name = 'observacao'
  ) INTO v_observacao_exists;
  
  -- Log resultados
  RAISE NOTICE '
    ╔════════════════════════════════════════════════════════╗
    ║ MIGRAÇÕES COMPLETADAS COM SUCESSO                      ║
    ╠════════════════════════════════════════════════════════╣
    ║ Roles únicos na tabela users: %                    ║
    ║ Status únicos na tabela indicadores: %             ║
    ║ Coluna observacao existe: %                       ║
    ╚════════════════════════════════════════════════════════╝
  ', v_roles_count, v_status_count, v_observacao_exists;
END $$;

-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================
-- Próximos passos:
-- 1. Testar GET /api/dashboard/stats
-- 2. Verificar RBAC (MASTER, GESTOR, COLABORADOR)
-- 3. Testar aprovação com observacao
-- ============================================================================
