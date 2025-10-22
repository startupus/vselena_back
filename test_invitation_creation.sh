#!/bin/bash

echo "🧪 Testing invitation creation..."

# Get admin token
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"admin@vselena.ru","password":"admin123"}' https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✅ Admin token obtained: ${TOKEN:0:20}..."

# Test creating invitation
echo ""
echo "📧 Creating invitation..."
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

echo "📊 Invitation response:"
echo "$INVITATION_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'id' in data:
        print(f'✅ Invitation created: {data[\"id\"]}')
        print(f'📧 Email: {data.get(\"email\", \"N/A\")}')
        print(f'🔗 Smart link: {data.get(\"invitationLink\", \"N/A\")}')
        print(f'⏰ Expires: {data.get(\"expiresAt\", \"N/A\")}')
    else:
        print('❌ Error creating invitation:')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'Error parsing response: {e}')
    print('Raw response:', sys.stdin.read())
"
