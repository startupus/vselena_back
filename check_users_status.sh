#!/bin/bash

echo "🔍 Checking users in database..."

# Check users in database
docker-compose -f /opt/vselena_back/vselena-backend/docker-compose.yml exec -T postgres psql -U vselena -d vselena_dev -c "
SELECT 
    email, 
    \"firstName\", 
    \"lastName\", 
    \"isActive\", 
    \"emailVerified\",
    \"createdAt\"
FROM users 
WHERE email LIKE '%saschkaproshka%' OR email LIKE '%admin%'
ORDER BY \"createdAt\" DESC;
"

echo ""
echo "🔑 Checking if user can login with different passwords..."

# Try different passwords for saschkaproshka@ya.ru
PASSWORDS=("11111111" "password" "admin123" "123456")

for password in "${PASSWORDS[@]}"; do
    echo "Testing password: $password"
    TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"email\":\"saschkaproshka@ya.ru\",\"password\":\"$password\"}" https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo "✅ Login successful with password: $password"
        echo "Token: ${TOKEN:0:20}..."
        break
    else
        echo "❌ Failed with password: $password"
    fi
done
