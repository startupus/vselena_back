SELECT u.email, t.name as team_name 
FROM users u 
JOIN team_memberships tm ON u.id = tm."userId" 
JOIN teams t ON tm."teamId" = t.id 
WHERE u.email = 'saschkaproshka04@mail.ru';
