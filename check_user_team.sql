SELECT u.email, ut.team_id, t.name as team_name 
FROM users u 
LEFT JOIN user_teams ut ON u.id = ut.user_id 
LEFT JOIN teams t ON ut.team_id = t.id 
WHERE u.email = 'saschkaproshka@yandex.ru';
