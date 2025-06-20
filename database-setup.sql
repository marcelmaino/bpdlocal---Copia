-- ========================================
-- Script de Setup do Banco de Dados
-- BPD Dashboard - Produção
-- ========================================

-- INSTRUÇÕES DE USO:
-- 1. Substitua 'seu_usuario_db' pelo nome de usuário desejado
-- 2. Substitua 'sua_senha_forte' por uma senha segura
-- 3. Substitua 'bpd_database' pelo nome do banco desejado
-- 4. Execute este script como administrador do MySQL
-- 5. Importe os dados da aplicação após criar a estrutura

-- ========================================
-- CRIAÇÃO DO BANCO DE DADOS
-- ========================================

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS `bpd_database` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- ========================================
-- CRIAÇÃO DO USUÁRIO
-- ========================================

-- Criar usuário específico para a aplicação
CREATE USER IF NOT EXISTS 'seu_usuario_db'@'localhost' 
IDENTIFIED BY 'sua_senha_forte';

-- Conceder permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER 
ON `bpd_database`.* 
TO 'seu_usuario_db'@'localhost';

-- Aplicar as mudanças
FLUSH PRIVILEGES;

-- ========================================
-- CONFIGURAÇÕES DE SEGURANÇA
-- ========================================

-- Usar o banco criado
USE `bpd_database`;

-- Configurar timezone (ajustar conforme necessário)
SET time_zone = '-03:00'; -- Brasília

-- ========================================
-- ESTRUTURA BÁSICA DAS TABELAS
-- ========================================
-- (Ajustar conforme a estrutura real da aplicação)

-- Tabela de usuários (exemplo)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `salt` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'user') DEFAULT 'user',
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login` TIMESTAMP NULL,
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`),
    INDEX `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de sessões/tokens (exemplo)
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_token` (`token_hash`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de dados BPD (exemplo - ajustar conforme necessário)
CREATE TABLE IF NOT EXISTS `bpd_data` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `player_name` VARCHAR(100) NOT NULL,
    `club` VARCHAR(100),
    `date` DATE NOT NULL,
    `hands_played` INT DEFAULT 0,
    `balance` DECIMAL(10,2) DEFAULT 0.00,
    `rake` DECIMAL(10,2) DEFAULT 0.00,
    `volume` DECIMAL(10,2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_player` (`player_name`),
    INDEX `idx_club` (`club`),
    INDEX `idx_date` (`date`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de métricas (exemplo)
CREATE TABLE IF NOT EXISTS `metrics` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `metric_name` VARCHAR(100) NOT NULL,
    `metric_value` DECIMAL(15,4) NOT NULL,
    `metric_date` DATE NOT NULL,
    `category` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_name_date` (`metric_name`, `metric_date`),
    INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de sistema (exemplo)
CREATE TABLE IF NOT EXISTS `system_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `level` ENUM('error', 'warning', 'info', 'debug') NOT NULL,
    `message` TEXT NOT NULL,
    `context` JSON,
    `user_id` INT NULL,
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_level` (`level`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Criar usuário administrador padrão
-- IMPORTANTE: Alterar a senha após o primeiro login!
INSERT INTO `users` (`username`, `email`, `password_hash`, `salt`, `role`) 
VALUES (
    'admin', 
    'admin@seudominio.com', 
    SHA2(CONCAT('admin123', 'salt_temporario'), 256), 
    'salt_temporario', 
    'admin'
) ON DUPLICATE KEY UPDATE `username` = `username`;

-- ========================================
-- CONFIGURAÇÕES DE PERFORMANCE
-- ========================================

-- Configurar variáveis de sessão para melhor performance
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- ========================================
-- PROCEDURES ÚTEIS
-- ========================================

-- Procedure para limpeza de sessões expiradas
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanExpiredSessions()
BEGIN
    DELETE FROM `user_sessions` 
    WHERE `expires_at` < NOW();
    
    SELECT ROW_COUNT() as sessions_cleaned;
END //
DELIMITER ;

-- Procedure para backup de dados
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS BackupData(IN backup_date DATE)
BEGIN
    DECLARE backup_table_name VARCHAR(100);
    SET backup_table_name = CONCAT('bpd_data_backup_', DATE_FORMAT(backup_date, '%Y%m%d'));
    
    SET @sql = CONCAT('CREATE TABLE ', backup_table_name, ' AS SELECT * FROM bpd_data WHERE date = "', backup_date, '"');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SELECT CONCAT('Backup criado: ', backup_table_name) as result;
END //
DELIMITER ;

-- ========================================
-- VIEWS ÚTEIS
-- ========================================

-- View para métricas diárias
CREATE OR REPLACE VIEW `daily_metrics` AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_records,
    SUM(hands_played) as total_hands,
    SUM(balance) as total_balance,
    SUM(rake) as total_rake,
    AVG(balance) as avg_balance
FROM `bpd_data`
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View para estatísticas por clube
CREATE OR REPLACE VIEW `club_stats` AS
SELECT 
    club,
    COUNT(DISTINCT player_name) as unique_players,
    COUNT(*) as total_sessions,
    SUM(hands_played) as total_hands,
    SUM(balance) as total_balance,
    AVG(balance) as avg_balance
FROM `bpd_data`
WHERE club IS NOT NULL
GROUP BY club
ORDER BY total_balance DESC;

-- ========================================
-- TRIGGERS PARA AUDITORIA
-- ========================================

-- Trigger para log de alterações em usuários
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `users_audit_update`
AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
    INSERT INTO `system_logs` (`level`, `message`, `context`, `user_id`)
    VALUES (
        'info',
        'User updated',
        JSON_OBJECT(
            'user_id', NEW.id,
            'username', NEW.username,
            'old_email', OLD.email,
            'new_email', NEW.email
        ),
        NEW.id
    );
END //
DELIMITER ;

-- ========================================
-- EVENTOS PARA MANUTENÇÃO AUTOMÁTICA
-- ========================================

-- Evento para limpeza automática de sessões expiradas
CREATE EVENT IF NOT EXISTS `cleanup_expired_sessions`
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
  CALL CleanExpiredSessions();

-- Evento para limpeza de logs antigos (manter apenas 30 dias)
CREATE EVENT IF NOT EXISTS `cleanup_old_logs`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM `system_logs` WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ========================================
-- VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'bpd_database'
ORDER BY TABLE_NAME;

-- Verificar usuários criados
SELECT 
    User,
    Host,
    account_locked,
    password_expired
FROM mysql.user 
WHERE User = 'seu_usuario_db';

-- Verificar permissões
SHOW GRANTS FOR 'seu_usuario_db'@'localhost';

-- ========================================
-- COMANDOS DE MANUTENÇÃO
-- ========================================

-- Otimizar tabelas (executar periodicamente)
-- OPTIMIZE TABLE `users`, `bpd_data`, `metrics`, `system_logs`;

-- Analisar tabelas para estatísticas
-- ANALYZE TABLE `users`, `bpd_data`, `metrics`, `system_logs`;

-- Verificar integridade das tabelas
-- CHECK TABLE `users`, `bpd_data`, `metrics`, `system_logs`;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================

/*
IMPORTANTE - APÓS EXECUTAR ESTE SCRIPT:

1. SEGURANÇA:
   - Altere a senha do usuário 'admin' imediatamente
   - Configure firewall para restringir acesso ao MySQL
   - Use conexões SSL quando possível

2. BACKUP:
   - Configure backup automático do banco
   - Teste a restauração dos backups regularmente

3. MONITORAMENTO:
   - Configure alertas para espaço em disco
   - Monitore performance das queries
   - Acompanhe logs de erro do MySQL

4. MANUTENÇÃO:
   - Execute OPTIMIZE TABLE mensalmente
   - Monitore crescimento das tabelas de log
   - Revise e ajuste índices conforme necessário

5. COMANDOS ÚTEIS:
   - Verificar tamanho do banco: 
     SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='bpd_database';
   
   - Verificar conexões ativas:
     SHOW PROCESSLIST;
   
   - Verificar status do servidor:
     SHOW STATUS LIKE 'Threads_connected';
*/

-- ========================================
-- FIM DO SCRIPT
-- ========================================

SELECT 'Setup do banco de dados concluído com sucesso!' as status;
SELECT NOW() as timestamp;