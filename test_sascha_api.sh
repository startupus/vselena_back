#!/bin/bash

# Login and get token
echo "=== LOGIN ==="
LOGIN_RESPONSE=$(curl -s -X POST https://vselena.ldmco.ru/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saschkaproshka04@mail.ru","password":"11111111"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['accessToken'])")

echo "Access token: ${ACCESS_TOKEN:0:50}..."

# Test /api/auth/me
echo -e "\n=== /api/auth/me ==="
curl -s -X GET https://vselena.ldmco.ru/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print('User:', data['email']); print('Organizations:', len(data.get('organizations', []))); print('Teams:', len(data.get('teams', [])))"

# Test /api/users/team-members
echo -e "\n=== /api/users/team-members ==="
curl -s -X GET https://vselena.ldmco.ru/api/users/team-members \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print('Team members count:', len(data))"
