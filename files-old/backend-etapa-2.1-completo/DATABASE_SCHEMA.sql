-- ============================================================================
-- DATABASE SCHEMA — Sistema de Acompanhamento de Metas
-- ============================================================================
-- Execute esta script para criar a estrutura completa do banco de dados
-- Pré-requisito: PostgreSQL 14+
-- ============================================================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- ============================================================================
-- 1. DEPARTAMENTOS
-- ============================================================================

CREATE TABLE departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  gerente_id UUID,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departamentos_nome ON departamentos(nome);
CREATE INDEX idx_departamentos_gerente_id ON departamentos(gerente_id);

-- ============================================================================
-- 2. TRILHAS (Carreira)
-- ============================================================================

CREATE TABLE trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trilhas_nome ON trilhas(nome);

-- ============================================================================
-- 3. TRILHA_PILARES
-- ============================================================================

CREATE TABLE trilha_pilares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  pilar VARCHAR(255) NOT NULL,
  peso DECIMAL(5, 2) NOT NULL CHECK (peso > 0 AND peso <= 100),
  ordem INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trilha_id, pilar)
);

CREATE INDEX idx_trilha_pilares_trilha_id ON trilha_pilares(trilha_id);

-- ============================================================================
-- 4. CARGOS
-- ============================================================================

CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  nivel VARCHAR(50), -- OPERACIONAL, SUPERVISAO, GESTAO, DIRETORIA
  trilha_id UUID REFERENCES trilhas(id) ON DELETE SET NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cargos_nome ON cargos(nome);
CREATE INDEX idx_cargos_trilha_id ON cargos(trilha_id);

-- ============================================================================
-- 5. SAFRAS (Períodos)
-- ============================================================================

CREATE TABLE safras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) UNIQUE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativa BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_safra_datas CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_safras_ativa ON safras(ativa);
CREATE INDEX idx_safras_data ON safras(data_inicio, data_fim);

-- ============================================================================
-- 6. USERS
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  matricula VARCHAR(50) UNIQUE,
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'COLABORADOR'
    CHECK (role IN ('ADMIN', 'GERENTE_RH', 'GERENTE_DEPARTAMENTO', 'COLABORADOR')),
  microsoft_graph_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ativo_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  desativado_em TIMESTAMP,
  ultimo_login TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_departamento_id ON users(departamento_id);
CREATE INDEX idx_users_cargo_id ON users(cargo_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_ativo ON users(ativo);
CREATE INDEX idx_users_microsoft_graph_id ON users(microsoft_graph_id);

-- Adicionar constraint FK gerente_id em departamentos (APÓS users criada)
ALTER TABLE departamentos ADD CONSTRAINT fk_departamentos_gerente_id 
  FOREIGN KEY (gerente_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- 7. INDICADORES
-- ============================================================================

CREATE TABLE indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  usuario_responsavel_id UUID NOT NULL REFERENCES users(id),
  nome VARCHAR(255) NOT NULL,
  peso DECIMAL(5, 2) NOT NULL CHECK (peso >= 0 AND peso <= 100),
  status VARCHAR(50) NOT NULL DEFAULT 'EM_ANDAMENTO'
    CHECK (status IN ('EM_ANDAMENTO', 'AGUARDANDO_APROVACAO_GESTOR', 'AGUARDANDO_APROVACAO_RH', 
                      'CONCLUIDO', 'ATRASADO', 'PAUSADO')),
  atendimento DECIMAL(5, 2) DEFAULT 0 CHECK (atendimento >= 0 AND atendimento <= 100),
  detalhamento TEXT,
  objetivo TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  concluido_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- PPR/Trilha (opcional, para catálogo)
  funcao VARCHAR(255),
  pilar VARCHAR(255),
  meta TEXT,
  forma_medicao TEXT,
  evidencia_obrigatoria TEXT,
  
  CONSTRAINT chk_indicador_datas CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_indicadores_usuario_responsavel_id ON indicadores(usuario_responsavel_id);
CREATE INDEX idx_indicadores_departamento_id ON indicadores(departamento_id);
CREATE INDEX idx_indicadores_status ON indicadores(status);
CREATE INDEX idx_indicadores_data_fim ON indicadores(data_fim);
CREATE INDEX idx_indicadores_data_criacao ON indicadores(criado_em DESC);

-- ============================================================================
-- 8. INDICADOR_UPDATES (Auditoria)
-- ============================================================================

CREATE TABLE indicador_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id UUID NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  usuario_alterou_id UUID NOT NULL REFERENCES users(id),
  tipo_alteracao VARCHAR(50) NOT NULL
    CHECK (tipo_alteracao IN ('CRIACAO', 'EDICAO', 'CONCLUSAO', 'REATRIBUICAO', 
                             'SOLICITACAO_CONCLUSAO', 'APROVACAO_GESTOR', 'APROVACAO_RH', 'REJEICAO')),
  campo_alterado VARCHAR(255),
  valor_anterior JSONB,
  valor_novo JSONB,
  motivo TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indicador_updates_indicador_id ON indicador_updates(indicador_id);
CREATE INDEX idx_indicador_updates_usuario_alterou_id ON indicador_updates(usuario_alterou_id);
CREATE INDEX idx_indicador_updates_tipo_alteracao ON indicador_updates(tipo_alteracao);
CREATE INDEX idx_indicador_updates_criado_em ON indicador_updates(criado_em DESC);

-- ============================================================================
-- 9. ATTACHMENTS
-- ============================================================================

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id UUID NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES users(id),
  nome_arquivo VARCHAR(255) NOT NULL,
  url_s3 TEXT NOT NULL,
  tipo_mime VARCHAR(100),
  tamanho_bytes BIGINT,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_indicador_id ON attachments(indicador_id);
CREATE INDEX idx_attachments_usuario_id ON attachments(usuario_id);
CREATE INDEX idx_attachments_criado_em ON attachments(criado_em DESC);

-- ============================================================================
-- 10. PPR_FAIXAS
-- ============================================================================

CREATE TABLE ppr_faixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id UUID NOT NULL REFERENCES cargos(id) ON DELETE CASCADE,
  faixa_min DECIMAL(5, 2) NOT NULL,
  faixa_max DECIMAL(5, 2) NOT NULL,
  multiplo DECIMAL(5, 2) NOT NULL, -- multiplicador do salário
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_ppr_faixas CHECK (faixa_max >= faixa_min AND multiplo > 0)
);

CREATE INDEX idx_ppr_faixas_cargo_id ON ppr_faixas(cargo_id);

-- ============================================================================
-- DADOS INICIAIS (SEEDERS)
-- ============================================================================

-- Departamentos
INSERT INTO departamentos (nome, descricao) VALUES
('RECURSOS HUMANOS', 'Gestão de pessoas e desenvolvimento'),
('ADMINISTRATIVO', 'Operações administrativas'),
('TECNOLOGIA', 'TI e infraestrutura'),
('VENDAS', 'Comercial e pós-venda'),
('FINANCEIRO', 'Controladoria e contabilidade')
ON CONFLICT DO NOTHING;

-- Trilhas
INSERT INTO trilhas (nome, descricao) VALUES
('Operacional', 'Carreira de operações e suporte'),
('Gestão', 'Carreira de gestão e liderança'),
('Especialista', 'Carreira de especialização técnica')
ON CONFLICT DO NOTHING;

-- Trilha Pilares
INSERT INTO trilha_pilares (trilha_id, pilar, peso, ordem) 
SELECT t.id, pilar, peso, ordem FROM (
  VALUES 
    ('Operacional', 'Qualidade', 30, 1),
    ('Operacional', 'Produtividade', 30, 2),
    ('Operacional', 'Atendimento', 40, 3),
    ('Gestão', 'Liderança', 35, 1),
    ('Gestão', 'Gestão de Pessoas', 35, 2),
    ('Gestão', 'Resultados', 30, 3),
    ('Especialista', 'Inovação', 35, 1),
    ('Especialista', 'Expertise Técnica', 40, 2),
    ('Especialista', 'Mentorado', 25, 3)
) AS t(nome, pilar, peso, ordem)
JOIN trilhas ON trilhas.nome = t.nome
ON CONFLICT DO NOTHING;

-- Cargos
INSERT INTO cargos (nome, descricao, nivel, trilha_id) 
SELECT 'Analista', 'Profissional de nível operacional', 'OPERACIONAL', id FROM trilhas WHERE nome = 'Operacional'
ON CONFLICT DO NOTHING;

INSERT INTO cargos (nome, descricao, nivel, trilha_id) 
SELECT 'Gerente', 'Profissional de nível de gestão', 'GESTAO', id FROM trilhas WHERE nome = 'Gestão'
ON CONFLICT DO NOTHING;

INSERT INTO cargos (nome, descricao, nivel, trilha_id) 
SELECT 'Especialista', 'Profissional especializado', 'OPERACIONAL', id FROM trilhas WHERE nome = 'Especialista'
ON CONFLICT DO NOTHING;

-- Safras (períodos)
INSERT INTO safras (nome, data_inicio, data_fim, ativa) VALUES
('2026', '2026-01-01', '2026-12-31', true),
('2027', '2027-01-01', '2027-12-31', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VIEWS ÚTEIS (OPCIONAL)
-- ============================================================================

-- View: Indicadores com Info Completa
CREATE OR REPLACE VIEW v_indicadores_completo AS
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

-- View: Estatísticas por Departamento
CREATE OR REPLACE VIEW v_stats_departamento AS
SELECT 
  d.id,
  d.nome,
  COUNT(i.id) AS total_indicadores,
  SUM(CASE WHEN i.status = 'CONCLUIDO' THEN 1 ELSE 0 END) AS concluidos,
  SUM(CASE WHEN i.status IN ('EM_ANDAMENTO', 'AGUARDANDO_APROVACAO_GESTOR', 'AGUARDANDO_APROVACAO_RH') THEN 1 ELSE 0 END) AS em_andamento,
  SUM(CASE WHEN i.status = 'ATRASADO' THEN 1 ELSE 0 END) AS atrasados,
  ROUND(AVG(i.atendimento), 2) AS media_realizacao
FROM departamentos d
LEFT JOIN indicadores i ON d.id = i.departamento_id
GROUP BY d.id, d.nome
ORDER BY d.nome;

-- View: Estatísticas por Usuário
CREATE OR REPLACE VIEW v_stats_usuario AS
SELECT 
  u.id,
  u.nome,
  u.email,
  COUNT(i.id) AS total_indicadores,
  SUM(CASE WHEN i.status = 'CONCLUIDO' THEN 1 ELSE 0 END) AS concluidos,
  SUM(CASE WHEN i.status IN ('EM_ANDAMENTO', 'AGUARDANDO_APROVACAO_GESTOR', 'AGUARDANDO_APROVACAO_RH') THEN 1 ELSE 0 END) AS em_andamento,
  ROUND(AVG(i.atendimento), 2) AS media_realizacao
FROM users u
LEFT JOIN indicadores i ON u.id = i.usuario_responsavel_id
WHERE u.ativo = true
GROUP BY u.id, u.nome, u.email
ORDER BY u.nome;

-- ============================================================================
-- TRIGGERS (OPCIONAL)
-- ============================================================================

-- Trigger: Atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_update_departamentos_atualizado_em
BEFORE UPDATE ON departamentos
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER tg_update_trilhas_atualizado_em
BEFORE UPDATE ON trilhas
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER tg_update_cargos_atualizado_em
BEFORE UPDATE ON cargos
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER tg_update_users_atualizado_em
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER tg_update_indicadores_atualizado_em
BEFORE UPDATE ON indicadores
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE users IS 'Usuários do sistema com roles (ADMIN, GERENTE_RH, GERENTE_DEPARTAMENTO, COLABORADOR)';
COMMENT ON TABLE indicadores IS 'Indicadores/Metas com fluxo de aprovações (Gestor → RH)';
COMMENT ON TABLE indicador_updates IS 'Auditoria completa de alterações em indicadores';
COMMENT ON TABLE attachments IS 'Anexos/Documentos de comprovação para indicadores';
COMMENT ON TABLE trilhas IS 'Trilhas de carreira (Operacional, Gestão, Especialista)';
COMMENT ON TABLE cargos IS 'Cargos e posições na empresa';
COMMENT ON TABLE safras IS 'Períodos de avaliação (anos, semestres, etc)';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
-- Script finalizado com sucesso!
-- Próximos passos:
-- 1. Criar usuário de aplicação com permissões mínimas
-- 2. Executar migrations (knex) para controle de versão
-- 3. Popular seeders (cargos, departamentos, usuários iniciais)
-- ============================================================================
