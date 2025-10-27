-- Устанавливаем пароль для test@example.com (пароль: 123456)
UPDATE users 
SET "passwordHash" = '$2b$12$.XTXbpTtAo5iEz6Yw47SKergLQGzDTOUfmoHcbQAIOgQFXl.9hdoe'
WHERE email = 'test@example.com';
