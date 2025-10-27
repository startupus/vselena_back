-- Принимаем приглашение saschkaproshka100@mail.ru в организацию
-- Сначала обновляем статус приглашения
UPDATE invitations 
SET status = 'accepted', 
    "acceptedById" = (SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru'),
    "acceptedAt" = NOW()
WHERE email = 'saschkaproshka100@mail.ru' 
  AND status = 'pending' 
  AND type = 'organization';

-- Добавляем пользователя в организацию с ролью member (так как editor не существует)
INSERT INTO organization_memberships ("userId", "organizationId", "roleId", "createdAt", "updatedAt")
SELECT 
    u.id as "userId",
    '677e537d-6b05-49d0-8f3d-6771537d6285' as "organizationId",
    '3a667e85-2e9b-4038-b4b4-c6401fc899c6' as "roleId", -- member role
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM users u
WHERE u.email = 'saschkaproshka100@mail.ru'
  AND NOT EXISTS (
    SELECT 1 FROM organization_memberships om 
    WHERE om."userId" = u.id AND om."organizationId" = '677e537d-6b05-49d0-8f3d-6771537d6285'
  );
