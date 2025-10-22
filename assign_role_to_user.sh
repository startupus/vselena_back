#!/bin/bash

echo "🔧 Assigning role to user saschkaproshka@yandex.ru..."

# Get user ID
USER_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM users WHERE email = 'saschkaproshka@yandex.ru';" | tr -d '[:space:]')
echo "User ID: $USER_ID"

# Get super_admin role ID
SUPER_ADMIN_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM roles WHERE name = 'super_admin';" | tr -d '[:space:]')
echo "Super admin role ID: $SUPER_ADMIN_ID"

# Get admin user ID (to assign role)
ADMIN_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM users WHERE email = 'admin@vselena.ru';" | tr -d '[:space:]')
echo "Admin ID: $ADMIN_ID"

# Assign super_admin role to user
echo "🔗 Assigning super_admin role to user..."
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO user_roles (id, \"userId\", \"roleId\", \"assignedBy\", \"assignedAt\") VALUES (gen_random_uuid(), '$USER_ID', '$SUPER_ADMIN_ID', '$ADMIN_ID', NOW()) ON CONFLICT (\"userId\", \"roleId\") DO NOTHING;"

echo "✅ Role assigned! Checking result..."
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "
SELECT 
    u.email,
    r.name as role_name,
    ur.\"assignedAt\"
FROM users u
JOIN user_roles ur ON u.id = ur.\"userId\"
JOIN roles r ON ur.\"roleId\" = r.id
WHERE u.email = 'saschkaproshka@yandex.ru';
"
