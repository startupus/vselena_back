-- Удаляем роль без контекста
DELETE FROM user_role_assignments 
WHERE "userId" = (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru')
AND "roleId" = '7d60061e-5f5e-4f71-a297-84c3f641f4d5'
AND "teamId" IS NULL;

-- Назначаем роль с правильным контекстом команды
INSERT INTO user_role_assignments ("userId", "roleId", "teamId")
SELECT 
    u.id,
    '7d60061e-5f5e-4f71-a297-84c3f641f4d5',
    'd47e3498-2000-4123-95e0-bc9ec3d10f4a'
FROM users u 
WHERE u.email = 'saschkaproshka100@mail.ru'
AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura."userId" = u.id 
    AND ura."roleId" = '7d60061e-5f5e-4f71-a297-84c3f641f4d5'
    AND ura."teamId" = 'd47e3498-2000-4123-95e0-bc9ec3d10f4a'
);
