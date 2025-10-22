#!/bin/bash

echo "🔧 Fixing user roles (v2)..."

# Get user ID properly
USER_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM users WHERE email = 'saschkaproshka100@mail.ru';" | tr -d '[:space:]')

if [ -z "$USER_ID" ] || [ "$USER_ID" = "--------------------------------------" ]; then
    echo "❌ User not found or invalid ID: '$USER_ID'"
    exit 1
fi

echo "User ID: $USER_ID"

# Get team ID for team "1"
TEAM_ID=$(docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -t -c "SELECT id FROM teams WHERE name = '1';" | tr -d '[:space:]')

if [ -z "$TEAM_ID" ] || [ "$TEAM_ID" = "--------------------------------------" ]; then
    echo "❌ Team '1' not found or invalid ID: '$TEAM_ID'"
    exit 1
fi

echo "Team ID: $TEAM_ID"

# Delete old role assignment
echo "🗑️ Deleting old role assignment..."
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "DELETE FROM user_role_assignments WHERE \"userId\" = '$USER_ID' AND \"teamId\" = '$TEAM_ID';"

echo "✅ Role assignment deleted. Checking result..."
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "SELECT u.email, r.name as role_name, t.name as team_name FROM users u LEFT JOIN user_role_assignments ura ON u.id = ura.\"userId\" LEFT JOIN roles r ON ura.\"roleId\" = r.id LEFT JOIN teams t ON ura.\"teamId\" = t.id WHERE u.email = 'saschkaproshka100@mail.ru';"
