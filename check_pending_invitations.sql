-- Проверяем pending приглашения
SELECT 
    i.email,
    i.status,
    i."roleId",
    r.name as role_name,
    i.token,
    i."expiresAt"
FROM invitations i
LEFT JOIN roles r ON i."roleId"::text = r.id::text
WHERE i.status = 'pending'
ORDER BY i."createdAt" DESC;
