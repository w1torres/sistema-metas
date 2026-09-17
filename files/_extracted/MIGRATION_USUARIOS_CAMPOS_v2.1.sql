-- ============================================================================
-- MIGRAÇÕES SQL ADICIONAIS — Campos Faltantes Cadastro Colaborador
-- ============================================================================
-- Executar APÓS MIGRATION_v2.1.sql
-- Adiciona campos necessários: data_admissao, data_nascimento, filial, etc

-- ============================================================================
-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA USERS
-- ============================================================================

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS data_admissao DATE,
  ADD COLUMN IF NOT EXISTS filial VARCHAR(255),
  ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS celular VARCHAR(20);

-- Comentários para documentação
COMMENT ON COLUMN users.data_nascimento IS 'Data de nascimento do usuário (DD/MM/YYYY)';
COMMENT ON COLUMN users.data_admissao IS 'Data de admissão na empresa';
COMMENT ON COLUMN users.filial IS 'Filial onde trabalha (ex: FORMOSA-GO)';
COMMENT ON COLUMN users.endereco_completo IS 'Endereço comercial ou residencial';
COMMENT ON COLUMN users.telefone IS 'Telefone comercial';
COMMENT ON COLUMN users.celular IS 'Celular corporativo';

-- ============================================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para busca e filtro
CREATE INDEX IF NOT EXISTS idx_users_cpf 
  ON users(cpf) WHERE cpf IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_filial 
  ON users(filial) WHERE filial IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_data_admissao 
  ON users(data_admissao) WHERE data_admissao IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_departamento_role 
  ON users(departamento_id, role);

-- Índice composto para dashboard (listar colaboradores de um dept)
CREATE INDEX IF NOT EXISTS idx_users_depto_ativo 
  ON users(departamento_id, ativo) WHERE ativo = true;

-- ============================================================================
-- 3. CRIAR VIEW PARA VISUALIZAÇÃO DE USUÁRIOS COM DADOS COMPLETOS
-- ============================================================================

CREATE OR REPLACE VIEW v_usuarios_completo AS
SELECT 
  u.id,
  u.email,
  u.nome,
  u.cpf,
  u.data_nascimento,
  u.matricula,
  u.data_admissao,
  u.filial,
  u.telefone,
  u.celular,
  u.endereco_completo,
  u.role,
  d.nome AS departamento,
  c.nome AS cargo,
  u.ativo,
  u.ultimo_login,
  u.criado_em,
  u.atualizado_em,
  -- Calcular idade
  EXTRACT(YEAR FROM AGE(u.data_nascimento))::INT AS idade,
  -- Calcular tempo de empresa
  EXTRACT(YEAR FROM AGE(u.data_admissao))::INT AS anos_empresa
FROM users u
LEFT JOIN departamentos d ON u.departamento_id = d.id
LEFT JOIN cargos c ON u.cargo_id = c.id
ORDER BY d.nome, u.nome;

-- ============================================================================
-- 4. TRIGGER PARA VALIDAÇÃO DE DATA (data_admissao não pode ser no futuro)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_data_admissao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_admissao > CURRENT_DATE THEN
    RAISE EXCEPTION 'Data de admissão não pode ser no futuro';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_validate_data_admissao
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION validate_data_admissao();

-- ============================================================================
-- 5. CRIAR VIEW PARA DASHBOARD GESTOR — COLABORADORES DO DEPARTAMENTO
-- ============================================================================

CREATE OR REPLACE VIEW v_dashboard_gestor_colaboradores AS
SELECT 
  u.id AS usuario_id,
  u.nome,
  u.email,
  u.matricula,
  u.cargo_id,
  c.nome AS cargo,
  u.role,
  d.id AS departamento_id,
  d.nome AS departamento,
  u.data_admissao,
  u.filial,
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
LEFT JOIN cargos c ON u.cargo_id = c.id
LEFT JOIN indicadores i ON u.id = i.usuario_responsavel_id
WHERE u.ativo = true AND u.role IN ('COLABORADOR', 'GESTOR')
GROUP BY u.id, u.nome, u.email, u.matricula, u.cargo_id, c.nome, u.role, 
         d.id, d.nome, u.data_admissao, u.filial
ORDER BY d.nome, u.nome;

-- ============================================================================
-- 6. VALIDAR MIGRAÇÃO
-- ============================================================================

DO $$
DECLARE
  v_users_with_new_fields INT;
BEGIN
  -- Contar usuários com campos novos preenchidos
  SELECT COUNT(*) INTO v_users_with_new_fields 
  FROM users 
  WHERE data_admissao IS NOT NULL OR filial IS NOT NULL;
  
  RAISE NOTICE '
    ╔════════════════════════════════════════════════════════╗
    ║ MIGRAÇÕES ADICIONAIS COMPLETADAS                       ║
    ╠════════════════════════════════════════════════════════╣
    ║ Colunas adicionadas: 6 (data_admissao, filial, etc)  ║
    ║ Índices criados: 5                                  ║
    ║ Views criadas: 2                                    ║
    ║ Triggers criados: 1                                 ║
    ╚════════════════════════════════════════════════════════╝
  ';
END $$;

-- ============================================================================
-- 7. EXAMPLE DATA (OPCIONAL - para testes)
-- ============================================================================

-- Se precisar adicionar dados de exemplo:

/*
INSERT INTO users (
  email, nome, cpf, data_nascimento, matricula, 
  departamento_id, cargo_id, role, filial, 
  data_admissao, telefone, celular, endereco_completo, ativo
)
SELECT 
  'marcia.garcia@empresa.com',
  'MARCIA GARCIA NUNES',
  '69559430149',
  '1981-07-21'::DATE,
  'EMP-00001',
  (SELECT id FROM departamentos WHERE nome = 'ADMINISTRATIVO' LIMIT 1),
  (SELECT id FROM cargos WHERE nome = 'Gerente' LIMIT 1),
  'GESTOR',
  'FORMOSA-GO',
  '2023-10-16'::DATE,
  '(62) 3216-1234',
  '(62) 98765-4321',
  'Rua X, 123, Formosa-GO',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'marcia.garcia@empresa.com'
);
*/

-- ============================================================================
-- 8. ATUALIZAR DOCUMENTAÇÃO DA TABELA
-- ============================================================================

COMMENT ON TABLE users IS 'Usuários do sistema com roles (MASTER, GESTOR, COLABORADOR) e dados completos de RH';

COMMENT ON COLUMN users.id IS 'ID único do usuário (UUID)';
COMMENT ON COLUMN users.email IS 'Email corporativo (único)';
COMMENT ON COLUMN users.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN users.cpf IS 'CPF (único, formato: 11111111111)';
COMMENT ON COLUMN users.data_nascimento IS 'Data de nascimento (YYYY-MM-DD)';
COMMENT ON COLUMN users.matricula IS 'Matrícula de funcionário (único)';
COMMENT ON COLUMN users.departamento_id IS 'FK para departamentos';
COMMENT ON COLUMN users.cargo_id IS 'FK para cargos';
COMMENT ON COLUMN users.role IS 'Perfil de acesso (MASTER, GESTOR, COLABORADOR)';
COMMENT ON COLUMN users.microsoft_graph_id IS 'Object ID do Entra ID';
COMMENT ON COLUMN users.filial IS 'Filial/unidade de trabalho (ex: FORMOSA-GO)';
COMMENT ON COLUMN users.endereco_completo IS 'Endereço completo (comercial ou residencial)';
COMMENT ON COLUMN users.telefone IS 'Telefone comercial (formato: (XX) XXXX-XXXX)';
COMMENT ON COLUMN users.celular IS 'Celular corporativo (formato: (XX) XXXXX-XXXX)';
COMMENT ON COLUMN users.avatar_url IS 'URL da foto/avatar do usuário';
COMMENT ON COLUMN users.ativo IS 'Status do usuário (true = ativo, false = desativado)';
COMMENT ON COLUMN users.ativo_em IS 'Quando foi ativado';
COMMENT ON COLUMN users.desativado_em IS 'Quando foi desativado (null se ativo)';
COMMENT ON COLUMN users.ultimo_login IS 'Último acesso ao sistema';
COMMENT ON COLUMN users.criado_em IS 'Timestamp de criação';
COMMENT ON COLUMN users.atualizado_em IS 'Timestamp da última atualização';

-- ============================================================================
-- FIM DAS MIGRAÇÕES ADICIONAIS
-- ============================================================================
-- Próximos passos:
-- 1. Testar campos novos: SELECT * FROM users LIMIT 1;
-- 2. Testar view: SELECT * FROM v_usuarios_completo LIMIT 1;
-- 3. Testar view gestor: SELECT * FROM v_dashboard_gestor_colaboradores;
-- ============================================================================
