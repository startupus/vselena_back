#!/bin/bash

echo "🔧 Assigning role to user saschkaproshka@yandex.ru (v2)..."

# Get user ID
USER_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM users WHERE email = 'saschkaproshka@yandex.ru';" | tr -d '[:space:]')
echo "User ID: $USER_ID"

# Get super_admin role ID
SUPER_ADMIN_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM roles WHERE name = 'super_admin';" | tr -d '[:space:]')
echo "Super admin role ID: $SUPER_ADMIN_ID"

# Assign super_admin role to user (without id column)
echo "🔗 Assigning super_admin role to user..."
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO user_roles (\"userId\", \"roleId\") VALUES ('$USER_ID', '$SUPER_ADMIN_ID') ON CONFLICT (\"userId\", \"roleId\") DO NOTHING;"

echo "✅ Role assigned! Checking result..."
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "
SELECT 
    u.email,
    r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.\"userId\"
JOIN roles r ON ur.\"roleId\" = r.id
WHERE u.email = 'saschkaproshka@yandex.ru';
"
