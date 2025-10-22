-- Получаем токен приглашения
SELECT token, "expiresAt" 
FROM invitations 
WHERE email = 'saschkaproshka@yandex.ru' 
  AND status = 'pending'
  AND "roleId" = '63adfb0a-6c57-4294-94bd-feb6a3ac9976'
ORDER BY "createdAt" DESC 
LIMIT 1;
