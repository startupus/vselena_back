SELECT u.email, tm."teamId", t.name as team_name 
FROM users u 
LEFT JOIN team_memberships tm ON u.id = tm."userId" 
LEFT JOIN teams t ON tm."teamId" = t.id 
WHERE u.email = 'saschkaproshka100@mail.ru';