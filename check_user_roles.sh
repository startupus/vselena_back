#!/bin/bash

echo "🔍 Checking user roles in database..."

cd /opt/vselena_back/vselena-backend

docker-compose exec postgres psql -U vselena -d vselena_dev << 'EOF'
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    r.name as role_name,
    o.name as organization_name,
    t.name as team_name,
    ura."assignedAt"
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN organizations o ON ura.organization_id = o.id
LEFT JOIN teams t ON ura.team_id = t.id
WHERE u.email = 'saschkaproshka100@mail.ru';

-- Also check all roles in system
SELECT 
    r.name as role_name,
    r.description,
    r."isSystem"
FROM roles r
ORDER BY r.name;
EOF
