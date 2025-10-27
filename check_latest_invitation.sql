SELECT id, email, status, "teamId", "roleId", "createdAt", "acceptedAt"
FROM invitations 
WHERE email = 'saschkaproshka100@mail.ru' 
ORDER BY "createdAt" DESC 
LIMIT 1;