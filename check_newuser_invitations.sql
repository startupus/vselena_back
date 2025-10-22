SELECT 
    i.email,
    i.status,
    i."roleId",
    r.name AS role_name,
    i."createdAt",
    i."acceptedAt"
FROM invitations i
LEFT JOIN roles r ON i."roleId"::uuid = r.id
WHERE i.email = 'newuser5@example.com'
ORDER BY i."createdAt" DESC;
