SELECT u.email, o.name as org_name, om."roleId", org_role.name as role_name 
FROM users u 
JOIN organization_memberships om ON u.id = om."userId" 
JOIN organizations o ON om."organizationId" = o.id 
JOIN organization_roles org_role ON om."roleId" = org_role.id 
WHERE u.email = 'saschkaproshka04@mail.ru';