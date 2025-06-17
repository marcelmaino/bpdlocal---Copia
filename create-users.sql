-- Script para criar usuários MySQL baseados nos playerNames da tabela bpd
-- Este script cria usuários com senhas padrão e permissões adequadas

USE bpd_database;

-- Criar usuário admin com privilégios completos
CREATE USER IF NOT EXISTS 'admin'@'%' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON bpd_database.* TO 'admin'@'%';
GRANT SELECT ON mysql.user TO 'admin'@'%';

-- Criar usuários baseados nos playerNames da tabela bpd
-- Usuário player1
CREATE USER IF NOT EXISTS 'player1'@'%' IDENTIFIED BY 'player1123';
GRANT SELECT, INSERT, UPDATE ON bpd_database.bpd TO 'player1'@'%';

-- Usuário player2
CREATE USER IF NOT EXISTS 'player2'@'%' IDENTIFIED BY 'player2123';
GRANT SELECT, INSERT, UPDATE ON bpd_database.bpd TO 'player2'@'%';

-- Aplicar as mudanças
FLUSH PRIVILEGES;

-- Verificar usuários criados
SELECT User, Host FROM mysql.user WHERE User IN ('admin', 'player1', 'player2');

COMMIT;