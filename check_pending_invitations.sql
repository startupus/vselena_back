-- Проверяем все pending приглашения
SELECT 
  i.id, 
  i.email, 
  i.status, 
  i."teamId", 
  i."roleId",
  i.token,
  t.name as team_name,
  tr.name as role_name
FROM invitations i
LEFT JOIN teams t ON i."teamId" = t.id
LEFT JOIN team_roles tr ON i."roleId"::uuid = tr.id
WHERE i.status = 'pending'
ORDER BY i."createdAt" DESC;
