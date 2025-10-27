-- Проверяем team_memberships для пользователя test@example.com
SELECT 
  tm.id,
  tm."userId",
  tm."teamId", 
  tm."roleId",
  u.email,
  t.name as team_name,
  tr.name as role_name
FROM team_memberships tm
JOIN users u ON tm."userId" = u.id
JOIN teams t ON tm."teamId" = t.id
LEFT JOIN team_roles tr ON tm."roleId" = tr.id
WHERE u.email = 'test@example.com';