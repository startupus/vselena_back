-- Проверяем последнее приглашение
SELECT 
  i.id, 
  i.email, 
  i.status, 
  i."teamId", 
  i."roleId",
  t.name as team_name,
  tr.name as role_name,
  tr."teamId" as role_team_id
FROM invitations i
LEFT JOIN teams t ON i."teamId" = t.id
LEFT JOIN team_roles tr ON i."roleId"::uuid = tr.id
WHERE i.email = 'test@example.com'
ORDER BY i."createdAt" DESC 
LIMIT 1;
