-- Проверяем текущее состояние team_memberships для test@example.com
SELECT 
  tm.id,
  tm."userId",
  tm."teamId",
  tm."roleId",
  u.email,
  t.name as team_name,
  tr.name as role_name
FROM team_memberships tm
LEFT JOIN users u ON tm."userId" = u.id
LEFT JOIN teams t ON tm."teamId" = t.id
LEFT JOIN team_roles tr ON tm."roleId" = tr.id
WHERE u.email = 'test@example.com';
