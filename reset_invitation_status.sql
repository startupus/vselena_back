-- Сбрасываем статус приглашения для повторного принятия
UPDATE invitations 
SET status = 'pending', 
    "acceptedById" = NULL, 
    "acceptedAt" = NULL
WHERE email = 'saschkaproshka@yandex.ru' 
  AND status = 'accepted'
  AND "roleId" = '63adfb0a-6c57-4294-94bd-feb6a3ac9976';
