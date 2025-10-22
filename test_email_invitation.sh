#!/bin/bash

echo "🧪 Testing Email Invitation System"
echo "=================================="

# Get admin token
echo "🔐 Getting admin token..."
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"admin@vselena.ru","password":"admin123"}' https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

# Create invitation
echo ""
echo "📧 Creating email invitation..."
INVITATION_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "type": "team",
    "teamId": "f631effb-c3ef-45d8-b342-6c667a161665",
    "roleId": "63adfb0a-6c57-4294-94bd-feb6a3ac9976",
    "expiresInDays": 7
  }' \
  https://vselena.ldmco.ru/api/invitations)

echo "📊 Invitation response:"
echo "$INVITATION_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Invitation created: {data.get(\"id\", \"N/A\")}')
    print(f'📧 Email: {data.get(\"email\", \"N/A\")}')
    print(f'🔗 Smart link: {data.get(\"invitationLink\", \"N/A\")}')
    print(f'⏰ Expires: {data.get(\"expiresAt\", \"N/A\")}')
except Exception as e:
    print(f'Error parsing response: {e}')
    print('Raw response:')
    sys.stdin.seek(0)
    print(sys.stdin.read())
"

# Test smart link handling
echo ""
echo "🔗 Testing smart link handling..."
TOKEN_FROM_RESPONSE=$(echo "$INVITATION_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -n "$TOKEN_FROM_RESPONSE" ]; then
    echo "🔍 Testing invitation link: https://vselena.ldmco.ru/invitation?token=$TOKEN_FROM_RESPONSE"
    
    # Test the handle endpoint
    HANDLE_RESPONSE=$(curl -s -X GET "https://vselena.ldmco.ru/api/invitations/handle?token=$TOKEN_FROM_RESPONSE")
    
    echo "📊 Handle response:"
    echo "$HANDLE_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Invitation found: {data.get(\"invitation\", {}).get(\"email\", \"N/A\")}')
    print(f'🔗 Redirect to: {data.get(\"redirectTo\", \"N/A\")}')
    print(f'🔐 Is authenticated: {data.get(\"isAuthenticated\", \"N/A\")}')
    print(f'💬 Message: {data.get(\"message\", \"N/A\")}')
except Exception as e:
    print(f'Error parsing response: {e}')
    print('Raw response:')
    sys.stdin.seek(0)
    print(sys.stdin.read())
"
else
    echo "❌ No token found in invitation response"
fi

echo ""
echo "🌐 Test pages:"
echo "   Smart link: https://vselena.ldmco.ru/invitation?token=$TOKEN_FROM_RESPONSE"
echo "   Dashboard: https://vselena.ldmco.ru/dashboard.html"
