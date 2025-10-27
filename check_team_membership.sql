SELECT u.email, tm."teamId", t.name as team_name, tm."roleId", tr.name as role_name 
FROM users u 
JOIN team_memberships tm ON u.id = tm."userId" 
JOIN teams t ON tm."teamId" = t.id 
JOIN team_roles tr ON tm."roleId" = tr.id 
WHERE u.email = 'saschkaproshka100@mail.ru';
