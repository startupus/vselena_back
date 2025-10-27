-- Проверяем статус приглашения
SELECT 
  i.id,
  i.email,
  i.status,
  i."teamId",
  i."roleId",
  i."acceptedById",
  i."acceptedAt",
  t.name as team_name,
  tr.name as role_name
FROM invitations i
LEFT JOIN teams t ON i."teamId" = t.id
LEFT JOIN team_roles tr ON i."roleId"::uuid = tr.id
WHERE i.email = 'test@example.com'
ORDER BY i."createdAt" DESC
LIMIT 1;
