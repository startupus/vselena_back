#!/bin/bash

echo "🔍 Checking user by ID: f85c6d04-abc1-4408-9724-8d42d6692a28"

docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "SELECT email, \"firstName\", \"lastName\" FROM users WHERE id = 'f85c6d04-abc1-4408-9724-8d42d6692a28';"

echo ""
echo "🔍 Checking if this user has roles..."

docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "
SELECT 
    u.email,
    r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.\"userId\"
JOIN roles r ON ur.\"roleId\" = r.id
WHERE u.id = 'f85c6d04-abc1-4408-9724-8d42d6692a28';
"
