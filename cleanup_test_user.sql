-- Удаляем все приглашения для test@example.com
DELETE FROM invitations WHERE email = 'test@example.com';

-- Удаляем записи из team_memberships для test@example.com
DELETE FROM team_memberships 
WHERE "userId" = (SELECT id FROM users WHERE email = 'test@example.com');

-- Проверяем результат
SELECT 'Invitations deleted' as action;
SELECT 'Team memberships deleted' as action;
