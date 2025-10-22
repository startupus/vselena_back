#!/bin/bash
echo "=== Testing with saschkaproshka04@mail.ru ==="
echo ""

echo "1. Login with saschkaproshka04@mail.ru..."
LOGIN_RESPONSE=$(curl -X POST https://vselena.ldmco.ru/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"saschkaproshka04@mail.ru","password":"11111111"}' \
  -s)

echo "$LOGIN_RESPONSE" | python3 -m json.tool > /tmp/login_sascha.json
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["accessToken"])' 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ LOGIN FAILED:"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:50}..."
echo ""

echo "2. Testing /api/users/team-members..."
curl -X GET https://vselena.ldmco.ru/api/users/team-members \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ SUCCESS: Count: {len(data)}') if isinstance(data, list) else print(f'❌ ERROR: {data}')"
echo ""

echo "3. Testing /api/teams..."
curl -X GET https://vselena.ldmco.ru/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ SUCCESS: Count: {len(data)}') if isinstance(data, list) else print(f'❌ ERROR: {data}')"
echo ""

echo "4. Testing /api/organizations..."
curl -X GET https://vselena.ldmco.ru/api/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ SUCCESS: Count: {len(data)}') if isinstance(data, list) else print(f'❌ ERROR: {data}')"
echo ""

echo "5. Testing /api/auth/me..."
curl -X GET https://vselena.ldmco.ru/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ SUCCESS: User: {data.get(\"email\", \"unknown\")}') if isinstance(data, dict) else print(f'❌ ERROR: {data}')"
echo ""
