SELECT u.email, ura."teamId", t.name as team_name 
FROM users u 
LEFT JOIN user_role_assignments ura ON u.id = ura."userId" 
LEFT JOIN teams t ON ura."teamId" = t.id 
WHERE u.email = 'saschkaproshka@yandex.ru';