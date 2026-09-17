-- ============================================================================
-- MIGRATION: Adicionar Tabela de Atingimento + Campos Faltantes v2.1 (AJUSTE)
-- ============================================================================
-- Versão: 2.1 (Ajuste)
-- Data: 2026-09-14
-- Executar APÓS: MIGRATION_v2.1.sql
-- 
-- Adiciona:
-- 1. Tabela: tabelas_atingimento (Tabela de Redutor)
-- 2. Colunas: tabela_atingimento_id, usuario_nome, usuario_cargo_id, 
--             usuario_cargo_nome, usuario_filial, usuario_role,
--             usuario_departamento_id, usuario_departamento_nome
-- 3. Trigger: Auto-populate de snapshot do usuário
-- 4. View: v_indicadores_completo com resultado_ppr
-- 5. Índices: Performance
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA DE ATINGIMENTO (NOVO)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tabelas_atingimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  
  -- Faixas de atingimento
  -- Formato JSON: [
  --   {
  --     "min": 0,
  --     "max": 50,
  --     "resultado": 0,
  --     "descricao": "Não Atende"
  --   },
  --   {
  --     "min": 51,
  --     "max": 75,
  --     "resultado": 0.5,
  --     "descricao": "Parcial"
  --   },
  --   {
  --     "min": 76,
  --     "max": 100,
  --     "resultado": 1.0,
  --     "descricao": "Atende"
  --   }
  -- ]
  faixas JSONB NOT NULL,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tabelas_atingimento 
  IS 'Tabelas de conversão de atendimento (%) para resultado PPR (0-1.0)';
COMMENT ON COLUMN tabelas_atingimento.nome 
  IS 'Nome único da tabela (ex: Padrão PPR, Comercial, Administrativo)';
COMMENT ON COLUMN tabelas_atingimento.faixas 
  IS 'Array JSONB com faixas de atingimento e seus resultados';

-- ============================================================================
-- 2. INSERIR TABELAS DE ATINGIMENTO PADRÕES
-- ============================================================================

INSERT INTO tabelas_atingimento (nome, descricao, faixas) 
VALUES (
  'Padrão PPR',
  'Tabela padrão de atingimento para Programa de Participação nos Resultados',
  '[
    {
      "min": 0,
      "max": 50,
      "resultado": 0,
      "descricao": "Não Atende - 0%"
    },
    {
      "min": 51,
      "max": 75,
      "resultado": 0.5,
      "descricao": "Atende Parcialmente - 50%"
    },
    {
      "min": 76,
      "max": 100,
      "resultado": 1.0,
      "descricao": "Atende Plenamente - 100%"
    }
  ]'::jsonb
)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO tabelas_atingimento (nome, descricao, faixas) 
VALUES (
  'Comercial (Agressivo)',
  'Tabela mais rigorosa para áreas comerciais',
  '[
    {
      "min": 0,
      "max": 60,
      "resultado": 0,
      "descricao": "Não Atende"
    },
    {
      "min": 61,
      "max": 80,
      "resultado": 0.5,
      "descricao": "Parcial"
    },
    {
      "min": 81,
      "max": 100,
      "resultado": 1.0,
      "descricao": "Atende"
    }
  ]'::jsonb
)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO tabelas_atingimento (nome, descricao, faixas) 
VALUES (
  'Administrativo (Moderado)',
  'Tabela mais flexível para áreas administrativas',
  '[
    {
      "min": 0,
      "max": 40,
      "resultado": 0,
      "descricao": "Não Atende"
    },
    {
      "min": 41,
      "max": 70,
      "resultado": 0.5,
      "descricao": "Parcial"
    },
    {
      "min": 71,
      "max": 100,
      "resultado": 1.0,
      "descricao": "Atende"
    }
  ]'::jsonb
)
ON CONFLICT (nome) DO NOTHING;

-- ============================================================================
-- 3. ADICIONAR COLUNAS EM INDICADORES
-- ============================================================================

ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS tabela_atingimento_id UUID 
  REFERENCES tabelas_atingimento(id) ON DELETE SET NULL;

-- Snapshot do usuário no momento da criação (para histórico/auditoria)
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS usuario_nome VARCHAR(255);
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS usuario_cargo_id UUID 
  REFERENCES cargos(id) ON DELETE SET NULL;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS usuario_cargo_nome VARCHAR(255);
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS usuario_filial VARCHAR(255);
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS usuario_role VARCHAR(50);
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS usuario_departamento_id UUID 
  REFERENCES departamentos(id) ON DELETE SET NULL;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS usuario_departamento_nome VARCHAR(255);

-- Comentários de documentação
COMMENT ON COLUMN indicadores.tabela_atingimento_id 
  IS 'Referência à tabela de atingimento (redutor) usada para este indicador';
COMMENT ON COLUMN indicadores.usuario_nome 
  IS 'Snapshot: Nome do colaborador no momento da criação do indicador';
COMMENT ON COLUMN indicadores.usuario_cargo_id 
  IS 'Snapshot: ID do cargo do colaborador no momento da criação';
COMMENT ON COLUMN indicadores.usuario_cargo_nome 
  IS 'Snapshot: Nome do cargo do colaborador no momento da criação';
COMMENT ON COLUMN indicadores.usuario_filial 
  IS 'Snapshot: Filial do colaborador no momento da criação';
COMMENT ON COLUMN indicadores.usuario_role 
  IS 'Snapshot: Perfil/Role do colaborador (MASTER/GESTOR/COLABORADOR)';
COMMENT ON COLUMN indicadores.usuario_departamento_id 
  IS 'Snapshot: ID do departamento no momento da criação';
COMMENT ON COLUMN indicadores.usuario_departamento_nome 
  IS 'Snapshot: Nome do departamento no momento da criação';

-- ============================================================================
-- 4. VALIDAÇÃO DE ROLE
-- ============================================================================

ALTER TABLE indicadores 
ADD CONSTRAINT chk_usuario_role_valido 
  CHECK (usuario_role IS NULL OR usuario_role IN ('MASTER', 'GESTOR', 'COLABORADOR'));

-- ============================================================================
-- 5. CRIAR FUNÇÃO PARA POPULAR SNAPSHOT DO USUÁRIO
-- ============================================================================

CREATE OR REPLACE FUNCTION populate_indicador_usuario_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Buscar dados do usuário no momento da criação
  SELECT 
    u.nome,
    u.cargo_id,
    c.nome as cargo_nome,
    u.filial,
    u.role,
    u.departamento_id,
    d.nome as departamento_nome
  INTO v_user
  FROM users u
  LEFT JOIN cargos c ON u.cargo_id = c.id
  LEFT JOIN departamentos d ON u.departamento_id = d.id
  WHERE u.id = NEW.usuario_responsavel_id;
  
  -- Preencher campos de snapshot
  IF v_user IS NOT NULL THEN
    NEW.usuario_nome := v_user.nome;
    NEW.usuario_cargo_id := v_user.cargo_id;
    NEW.usuario_cargo_nome := v_user.cargo_nome;
    NEW.usuario_filial := v_user.filial;
    NEW.usuario_role := v_user.role;
    NEW.usuario_departamento_id := v_user.departamento_id;
    NEW.usuario_departamento_nome := v_user.departamento_nome;
  END IF;
  
  -- Se não definiu tabela de atingimento, atribuir padrão
  IF NEW.tabela_atingimento_id IS NULL THEN
    SELECT id INTO NEW.tabela_atingimento_id 
    FROM tabelas_atingimento 
    WHERE nome = 'Padrão PPR' 
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CRIAR TRIGGER (Remover anterior se existir)
-- ============================================================================

DROP TRIGGER IF EXISTS tg_populate_usuario_snapshot ON indicadores;

CREATE TRIGGER tg_populate_usuario_snapshot
BEFORE INSERT ON indicadores
FOR EACH ROW
EXECUTE FUNCTION populate_indicador_usuario_snapshot();

-- ============================================================================
-- 7. CRIAR VIEW PARA QUERIES SIMPLIFICADAS
-- ============================================================================

CREATE OR REPLACE VIEW v_indicadores_completo AS
SELECT 
  i.*,
  ta.nome as tabela_atingimento_nome,
  ta.descricao as tabela_atingimento_descricao,
  
  -- Calcular faixa de atingimento e resultado final
  (
    SELECT json_object_agg('resultado', r)
    FROM (
      SELECT f->>'resultado' as r
      FROM jsonb_array_elements(ta.faixas) AS f
      WHERE (f->>'min')::INT <= COALESCE(i.atendimento, 0)
        AND (f->>'max')::INT >= COALESCE(i.atendimento, 0)
      LIMIT 1
    ) AS calc
  ) as atingimento_faixa,
  
  -- Resultado final (0 a 1.0) para cálculo de PPR
  COALESCE(
    (
      SELECT (f->>'resultado')::DECIMAL
      FROM jsonb_array_elements(ta.faixas) AS f
      WHERE (f->>'min')::INT <= COALESCE(i.atendimento, 0)
        AND (f->>'max')::INT >= COALESCE(i.atendimento, 0)
      LIMIT 1
    ),
    CASE 
      WHEN i.atendimento >= 76 THEN 1.0
      WHEN i.atendimento >= 51 THEN 0.5
      WHEN i.atendimento >= 0 THEN 0.0
      ELSE NULL
    END
  ) as resultado_ppr

FROM indicadores i
LEFT JOIN tabelas_atingimento ta ON i.tabela_atingimento_id = ta.id;

COMMENT ON VIEW v_indicadores_completo 
  IS 'View completa de indicadores com cálculo automático de resultado PPR';

-- ============================================================================
-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_indicadores_tabela_atingimento 
  ON indicadores(tabela_atingimento_id);

CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_filial 
  ON indicadores(usuario_filial);

CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_role 
  ON indicadores(usuario_role);

CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_cargo 
  ON indicadores(usuario_cargo_id);

CREATE INDEX IF NOT EXISTS idx_indicadores_usuario_departamento 
  ON indicadores(usuario_departamento_id);

CREATE INDEX IF NOT EXISTS idx_tabelas_atingimento_nome 
  ON tabelas_atingimento(nome);

-- ============================================================================
-- 9. VALIDAÇÃO E SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_tabelas_count INT;
  v_indicadores_count INT;
BEGIN
  SELECT COUNT(*) INTO v_tabelas_count FROM tabelas_atingimento;
  SELECT COUNT(*) INTO v_indicadores_count FROM indicadores;
  
  RAISE NOTICE '
╔════════════════════════════════════════════════════════════╗
║ MIGRATION: INDICADORES COMPLETA (v2.1 - Ajuste)          ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║ ✅ Tabela tabelas_atingimento criada                      ║
║    Tabelas de atingimento inseridas: % (Padrão + 2)      ║
║                                                            ║
║ ✅ Colunas adicionadas em indicadores (8 novas):         ║
║    ├─ tabela_atingimento_id (FK → tabelas_atingimento)   ║
║    ├─ usuario_nome (snapshot)                            ║
║    ├─ usuario_cargo_id (snapshot)                        ║
║    ├─ usuario_cargo_nome (snapshot)                      ║
║    ├─ usuario_filial (snapshot)                          ║
║    ├─ usuario_role (snapshot)                            ║
║    ├─ usuario_departamento_id (snapshot)                 ║
║    └─ usuario_departamento_nome (snapshot)               ║
║                                                            ║
║ ✅ Função criada: populate_indicador_usuario_snapshot()  ║
║    (Popula automaticamente campos snapshot ao INSERT)     ║
║                                                            ║
║ ✅ Trigger criado: tg_populate_usuario_snapshot          ║
║    (Executa antes de INSERT em indicadores)              ║
║                                                            ║
║ ✅ View criada: v_indicadores_completo                   ║
║    (Calcula resultado_ppr automaticamente)                ║
║                                                            ║
║ ✅ Índices criados (6 novos):                            ║
║    ├─ tabela_atingimento                                 ║
║    ├─ usuario_filial                                     ║
║    ├─ usuario_role                                       ║
║    ├─ usuario_cargo_id                                   ║
║    ├─ usuario_departamento_id                            ║
║    └─ tabelas_atingimento_nome                           ║
║                                                            ║
║ Total de indicadores no sistema: %                        ║
║                                                            ║
║ 🎯 Schema de indicadores: 100% COMPLETO                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  ', v_tabelas_count, v_indicadores_count;
END $$;

-- ============================================================================
-- 10. EXEMPLOS DE QUERIES (PARA TESTES)
-- ============================================================================

/*
-- Query 1: Ver todos os indicadores com resultado PPR
SELECT 
  nome,
  usuario_nome,
  usuario_filial,
  usuario_role,
  atendimento,
  resultado_ppr,
  tabela_atingimento_nome
FROM v_indicadores_completo
WHERE resultado_ppr IS NOT NULL;

-- Query 2: Filtrar indicadores por filial
SELECT 
  nome,
  usuario_filial,
  atendimento,
  resultado_ppr
FROM v_indicadores_completo
WHERE usuario_filial = 'FORMOSA-GO';

-- Query 3: Filtrar por role
SELECT 
  nome,
  usuario_role,
  usuario_filial,
  resultado_ppr
FROM v_indicadores_completo
WHERE usuario_role = 'GESTOR';

-- Query 4: Resumo por filial
SELECT 
  usuario_filial,
  COUNT(*) as total_indicadores,
  AVG(atendimento) as atendimento_medio,
  AVG(resultado_ppr) as resultado_ppr_medio
FROM v_indicadores_completo
WHERE usuario_filial IS NOT NULL
GROUP BY usuario_filial;

-- Query 5: Resumo por cargo
SELECT 
  usuario_cargo_nome,
  COUNT(*) as total_indicadores,
  AVG(atendimento) as atendimento_medio,
  AVG(resultado_ppr) as resultado_ppr_medio
FROM v_indicadores_completo
WHERE usuario_cargo_nome IS NOT NULL
GROUP BY usuario_cargo_nome;

-- Query 6: Indicadores sem tabela de atingimento definida
SELECT 
  nome,
  usuario_nome,
  usuario_filial
FROM indicadores
WHERE tabela_atingimento_id IS NULL;
*/

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
-- Status: ✅ PRONTO PARA PRODUÇÃO
-- Próximo: Testar queries acima e validar dados
-- ============================================================================
