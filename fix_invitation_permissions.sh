#!/bin/bash

echo "🔧 Adding invitation permissions..."

# Add permissions one by one
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO permissions (id, name, description, resource, action, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'invitations.create', 'Создание приглашений', 'invitations', 'create', NOW(), NOW()) ON CONFLICT (name) DO NOTHING;"

docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO permissions (id, name, description, resource, action, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'invitations.read', 'Просмотр приглашений', 'invitations', 'read', NOW(), NOW()) ON CONFLICT (name) DO NOTHING;"

docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO permissions (id, name, description, resource, action, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'invitations.update', 'Редактирование приглашений', 'invitations', 'update', NOW(), NOW()) ON CONFLICT (name) DO NOTHING;"

docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO permissions (id, name, description, resource, action, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'invitations.delete', 'Удаление приглашений', 'invitations', 'delete', NOW(), NOW()) ON CONFLICT (name) DO NOTHING;"

docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO permissions (id, name, description, resource, action, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'teams.members', 'Управление участниками команд', 'teams', 'members', NOW(), NOW()) ON CONFLICT (name) DO NOTHING;"

docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO permissions (id, name, description, resource, action, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'organizations.members', 'Управление участниками организаций', 'organizations', 'members', NOW(), NOW()) ON CONFLICT (name) DO NOTHING;"

echo "✅ Permissions added"

# Assign permissions to super_admin role
echo "🔗 Assigning permissions to super_admin role..."

# Get super_admin role ID
SUPER_ADMIN_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM roles WHERE name = 'super_admin';" | tr -d '[:space:]')

echo "Super admin role ID: $SUPER_ADMIN_ID"

# Get permission IDs and assign them
for perm in "invitations.create" "invitations.read" "invitations.update" "invitations.delete" "teams.members" "organizations.members"; do
    echo "Assigning permission: $perm"
    PERM_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM permissions WHERE name = '$perm';" | tr -d '[:space:]')
    
    if [ -n "$PERM_ID" ] && [ "$PERM_ID" != "--------------------------------------" ]; then
        docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "INSERT INTO role_permissions (id, \"roleId\", \"permissionId\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), '$SUPER_ADMIN_ID', '$PERM_ID', NOW(), NOW()) ON CONFLICT (\"roleId\", \"permissionId\") DO NOTHING;"
        echo "  ✅ Assigned"
    else
        echo "  ❌ Permission not found"
    fi
done

echo "🎉 Done! Checking result..."
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "SELECT r.name as role_name, p.name as permission_name FROM roles r JOIN role_permissions rp ON r.id = rp.\"roleId\" JOIN permissions p ON rp.\"permissionId\" = p.id WHERE r.name = 'super_admin' AND p.name LIKE 'invitations.%' OR p.name LIKE '%.members' ORDER BY p.name;"
