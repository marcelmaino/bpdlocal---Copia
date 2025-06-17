-- Criação da tabela BPD
CREATE TABLE IF NOT EXISTS bpd (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    playerName VARCHAR(100) NOT NULL,
    handId VARCHAR(50) NOT NULL,
    position VARCHAR(20),
    holeCards VARCHAR(10),
    communityCards VARCHAR(20),
    potSize DECIMAL(10,2) DEFAULT 0,
    netWinning DECIMAL(10,2) DEFAULT 0,
    actionSequence TEXT,
    gameType VARCHAR(50) DEFAULT 'Texas Hold\'em',
    tableSize INT DEFAULT 6,
    blindLevel VARCHAR(20),
    INDEX idx_player (playerName),
    INDEX idx_timestamp (timestamp),
    INDEX idx_hand (handId)
);

-- Inserir dados de exemplo
INSERT INTO bpd (timestamp, playerName, handId, position, holeCards, communityCards, potSize, netWinning, actionSequence, gameType, tableSize, blindLevel) VALUES
('2024-01-15 14:30:00', 'player1', 'H001', 'BTN', 'AhKs', 'Ac Kc 7h 2d 9s', 150.00, 75.50, 'fold,call,raise,call,check', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:32:00', 'player2', 'H002', 'SB', 'QdQh', 'Qs 8c 3h Jd As', 220.00, -45.00, 'raise,call,bet,fold', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:35:00', 'player1', 'H003', 'BB', 'JsJc', '9h 8s 7c 6d 5h', 180.00, 90.00, 'call,raise,call,bet,call', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:38:00', 'admin', 'H004', 'UTG', 'AsAd', 'Ah 2c 3h 4s 5d', 300.00, 150.00, 'raise,call,bet,call,bet,call', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:40:00', 'player2', 'H005', 'MP', 'KhQs', 'Kc Qd 7h 8s 9c', 120.00, -30.00, 'call,check,fold', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:42:00', 'player1', 'H006', 'CO', '10h10s', '10c 5d 2h Ac Kh', 200.00, 100.00, 'raise,call,bet,call,check,check', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:45:00', 'admin', 'H007', 'BTN', '9s9h', '9d 4c 2s Jh Qc', 160.00, 80.00, 'call,raise,call,bet,call', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:47:00', 'player2', 'H008', 'SB', 'AcKd', 'Ad Kh 7s 8c 9h', 140.00, -35.00, 'raise,call,check,fold', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:50:00', 'player1', 'H009', 'BB', '8h8c', '8s 3d 2h Ah Kc', 190.00, 95.00, 'call,raise,call,bet,call,check', 'Texas Hold\'em', 6, '1/2'),
('2024-01-15 14:52:00', 'admin', 'H010', 'UTG', 'QsQc', 'Qh Jd 10s 9c 8h', 250.00, 125.00, 'raise,call,bet,call,bet,call', 'Texas Hold\'em', 6, '1/2');

-- Inserir mais dados para demonstração
INSERT INTO bpd (timestamp, playerName, handId, position, holeCards, communityCards, potSize, netWinning, actionSequence, gameType, tableSize, blindLevel) VALUES
('2024-01-16 10:15:00', 'player1', 'H011', 'MP', 'AhQs', 'As Qc 7h 2d 9s', 130.00, 65.00, 'call,raise,call,check,bet', 'Texas Hold\'em', 6, '1/2'),
('2024-01-16 10:18:00', 'player2', 'H012', 'CO', 'KdKh', 'Kc 8c 3h Jd As', 280.00, -70.00, 'raise,call,bet,raise,fold', 'Texas Hold\'em', 6, '1/2'),
('2024-01-16 10:20:00', 'admin', 'H013', 'BTN', 'JdJh', '9h 8s 7c 6d 5h', 210.00, 105.00, 'call,raise,call,bet,call', 'Texas Hold\'em', 6, '1/2'),
('2024-01-16 10:25:00', 'player1', 'H014', 'SB', 'AcAs', 'Ah 2c 3h 4s 5d', 350.00, 175.00, 'raise,call,bet,call,bet,call', 'Texas Hold\'em', 6, '1/2'),
('2024-01-16 10:28:00', 'player2', 'H015', 'BB', 'QhJs', 'Qc Jd 7h 8s 9c', 110.00, -25.00, 'call,check,fold', 'Texas Hold\'em', 6, '1/2');

COMMIT;