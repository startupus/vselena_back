-- Проверяем членство пользователя в организации
SELECT 
  u.email,
  om."organizationId",
  o.name as org_name,
  om."roleId",
  or_role.name as role_name
FROM users u
LEFT JOIN organization_memberships om ON u.id = om."userId"
LEFT JOIN organizations o ON om."organizationId" = o.id
LEFT JOIN organization_roles or_role ON om."roleId" = or_role.id
WHERE u.email = 'saschkaproshka100@mail.ru';