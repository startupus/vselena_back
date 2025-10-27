SELECT u.email, t.name as team_name, tm."roleId", team_role.name as role_name 
FROM users u 
JOIN team_memberships tm ON u.id = tm."userId" 
JOIN teams t ON tm."teamId" = t.id 
JOIN team_roles team_role ON tm."roleId" = team_role.id 
WHERE u.email = 'saschkaproshka04@mail.ru';
