#!/bin/bash

echo "🔍 Final check: User role assignment..."

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
WHERE u.email = 'saschkaproshka@yandex.ru'
ORDER BY p.name;
"

echo ""
echo "📋 Instructions for user:"
echo "1. Logout from the application"
echo "2. Clear browser cache/localStorage"
echo "3. Login again with email: saschkaproshka@yandex.ru"
echo "4. Try creating invitation again"
echo ""
echo "🌐 Test URLs:"
echo "  Dashboard: https://vselena.ldmco.ru/dashboard.html"
echo "  Login: https://vselena.ldmco.ru/login.html"
