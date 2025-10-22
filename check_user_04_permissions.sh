#!/bin/bash

echo "🔍 Checking user saschkaproshka04@mail.ru permissions..."

# Check if user has role in database
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "
SELECT 
    u.email,
    r.name as role_name,
    rp.\"permissionId\",
    p.name as permission_name
FROM users u
JOIN user_roles ur ON u.id = ur.\"userId\"
JOIN roles r ON ur.\"roleId\" = r.id
LEFT JOIN role_permissions rp ON r.id = rp.\"roleId\"
LEFT JOIN permissions p ON rp.\"permissionId\" = p.id
WHERE u.email = 'saschkaproshka04@mail.ru'
ORDER BY p.name;
"

echo ""
echo "🔍 If no roles found, let's assign super_admin role to this user..."

# Get user ID
USER_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "SELECT id FROM users WHERE email = 'saschkaproshka04@mail.ru';" | tail -n 3 | head -n 1 | tr -d '[:space:]')
echo "User ID: $USER_ID"

# Get super_admin role ID
ROLE_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "SELECT id FROM roles WHERE name = 'super_admin';" | tail -n 3 | head -n 1 | tr -d '[:space:]')
echo "Super admin role ID: $ROLE_ID"

if [ -n "$USER_ID" ] && [ -n "$ROLE_ID" ]; then
    echo "🔗 Assigning super_admin role to user..."
    docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "
    INSERT INTO user_roles (\"userId\", \"roleId\") VALUES ('$USER_ID', '$ROLE_ID')
    ON CONFLICT (\"userId\", \"roleId\") DO NOTHING;
    "
    echo "✅ Role assigned! Checking result..."
    
    # Verify the assignment
    docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "
    SELECT 
        u.email,
        r.name as role_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.\"userId\"
    JOIN roles r ON ur.\"roleId\" = r.id
    WHERE u.email = 'saschkaproshka04@mail.ru';
    "
else
    echo "❌ User or Role not found. Exiting."
fi
