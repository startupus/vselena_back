#!/bin/bash

echo "🔍 Checking user roles in database (final)..."

cd /opt/vselena_back/vselena-backend

docker-compose exec postgres psql -U vselena -d vselena_dev << 'EOF'
-- Check table structure
\d user_role_assignments

-- Check user roles with correct column names
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    r.name as role_name,
    o.name as organization_name,
    t.name as team_name,
    ura."assignedBy"
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
LEFT JOIN roles r ON ura."roleId" = r.id
LEFT JOIN organizations o ON ura."organizationId" = o.id
LEFT JOIN teams t ON ura."teamId" = t.id
WHERE u.email = 'saschkaproshka100@mail.ru';
EOF
