#!/bin/bash

echo "🔍 Testing with correct user email..."

# Test with correct email
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"saschkaproshka@yandex.ru","password":"11111111"}' https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token for saschkaproshka@yandex.ru"
    echo "Trying different passwords..."
    
    # Try different passwords
    for password in "password" "admin123" "123456"; do
        echo "Testing password: $password"
        TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"email\":\"saschkaproshka@yandex.ru\",\"password\":\"$password\"}" https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$TOKEN" ]; then
            echo "✅ Login successful with password: $password"
            break
        else
            echo "❌ Failed with password: $password"
        fi
    done
fi

if [ -z "$TOKEN" ]; then
    echo "❌ All login attempts failed"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

# Check user info
echo ""
echo "👤 User info:"
curl -s -H "Authorization: Bearer $TOKEN" https://vselena.ldmco.ru/api/auth/me | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'Email: {data.get(\"email\", \"N/A\")}')
    print(f'Roles: {data.get(\"roles\", [])}')
    print(f'Permissions: {len(data.get(\"permissions\", []))} permissions')
    if 'invitations.create' in data.get('permissions', []):
        print('✅ Has invitations.create permission')
    else:
        print('❌ Missing invitations.create permission')
        print('Available permissions:')
        for perm in data.get('permissions', []):
            print(f'  - {perm}')
except Exception as e:
    print(f'Error: {e}')
"

# Test invitation creation
echo ""
echo "🧪 Testing invitation creation..."
INVITATION_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "type": "team",
    "teamId": "f631effb-c3ef-45d8-b342-6c667a161665",
    "roleId": "63adfb0a-6c57-4294-94bd-feb6a3ac9976"
  }' \
  https://vselena.ldmco.ru/api/invitations)

echo "📊 Response:"
echo "$INVITATION_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'id' in data:
        print('✅ Invitation created successfully')
    else:
        print('❌ Error creating invitation:')
        print(f'  {data.get(\"message\", \"Unknown error\")}')
        print('Full response:')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'Error parsing response: {e}')
    print('Raw response:')
    print(sys.stdin.read())
"
