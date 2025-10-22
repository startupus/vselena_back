-- Назначаем роль viewer пользователю saschkaproshka@yandex.ru
INSERT INTO user_role_assignments ("userId", "roleId", "createdAt", "updatedAt")
SELECT 
    u.id as "userId",
    r.id as "roleId", 
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM users u, roles r
WHERE u.email = 'saschkaproshka@yandex.ru' 
  AND r.name = 'viewer'
  AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura."userId" = u.id AND ura."roleId" = r.id
  );