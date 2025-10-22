#!/bin/bash

echo "🔍 Checking user roles after transfer..."

# Check user roles
echo "📋 User roles:"
ssh -i C:\Users\teramisuslik\.ssh\id_ed25519 root@45.144.176.42 "docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c \"SELECT u.email, r.name as role_name, t.name as team_name FROM users u LEFT JOIN user_role_assignments ura ON u.id = ura.\\\"userId\\\" LEFT JOIN roles r ON ura.\\\"roleId\\\" = r.id LEFT JOIN teams t ON ura.\\\"teamId\\\" = t.id WHERE u.email = 'saschkaproshka100@mail.ru';\""

echo ""
echo "👥 User team memberships:"
ssh -i C:\Users\teramisuslik\.ssh\id_ed25519 root@45.144.176.42 "docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c \"SELECT u.email, t.name as team_name FROM users u LEFT JOIN user_teams ut ON u.id = ut.user_id LEFT JOIN teams t ON ut.team_id = t.id WHERE u.email = 'saschkaproshka100@mail.ru';\""
