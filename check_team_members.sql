SELECT 
    t.name AS team_name,
    t.id AS team_id,
    u.email AS member_email,
    u.id AS user_id
FROM teams t
LEFT JOIN user_teams ut ON t.id = ut.team_id
LEFT JOIN users u ON ut.user_id = u.id
WHERE t.id = 'd47e3498-2000-4123-95e0-bc9ec3d10f4a';
