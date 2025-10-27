SELECT i.id, i.email, i.status, i."teamId", i."roleId", r.name as role_name
FROM invitations i
LEFT JOIN roles r ON CAST(i."roleId" AS uuid) = r.id
WHERE i.email = 'saschkaproshka100@mail.ru'
ORDER BY i."createdAt" DESC;