-- Проверяем членство владельца в командах и организациях
SELECT
    u.id AS user_id,
    u.email,
    u."firstName",
    u."lastName",
    o.id AS organization_id,
    o.name AS organization_name,
    t.id AS team_id,
    t.name AS team_name
FROM
    users u
LEFT JOIN
    user_organizations uo ON u.id = uo.user_id
LEFT JOIN
    organizations o ON uo.organization_id = o.id
LEFT JOIN
    user_teams ut ON u.id = ut.user_id
LEFT JOIN
    teams t ON ut.team_id = t.id
WHERE
    u.email = 'saschkaproshka04@mail.ru'
ORDER BY
    o.name, t.name;
