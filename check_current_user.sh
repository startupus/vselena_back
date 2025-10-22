#!/bin/bash

echo "🔍 Checking current user permissions..."

# Test with different users
USERS=("admin@vselena.ru:admin123" "saschkaproshka@ya.ru:11111111")

for user_creds in "${USERS[@]}"; do
    IFS=':' read -r email password <<< "$user_creds"
    echo ""
    echo "👤 Testing user: $email"
    
    # Get token
    TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$email\",\"password\":\"$password\"}" https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Failed to get token for $email"
        continue
    fi
    
    echo "✅ Token obtained: ${TOKEN:0:20}..."
    
    # Check user info
    echo "📊 User info:"
    curl -s -H "Authorization: Bearer $TOKEN" https://vselena.ldmco.ru/api/auth/me | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Email: {data.get(\"email\", \"N/A\")}')
    print(f'  Roles: {data.get(\"roles\", [])}')
    print(f'  Permissions: {len(data.get(\"permissions\", []))} permissions')
    if 'invitations.create' in data.get('permissions', []):
        print('  ✅ Has invitations.create permission')
    else:
        print('  ❌ Missing invitations.create permission')
except Exception as e:
    print(f'  Error: {e}')
"
    
    # Test invitation creation
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
        print('  ✅ Invitation created successfully')
    else:
        print('  ❌ Error creating invitation:')
        print(f'    {data.get(\"message\", \"Unknown error\")}')
except Exception as e:
    print(f'  Error parsing response: {e}')
"
done
