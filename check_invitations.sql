-- Проверяем все приглашения
SELECT 
    i.email,
    i.status,
    i."roleId",
    r.name as role_name,
    i."createdAt",
    i."acceptedAt"
FROM invitations i
LEFT JOIN roles r ON i."roleId"::text = r.id::text
ORDER BY i."createdAt" DESC;