#!/bin/bash

echo "🔐 Getting new token..."
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"admin@vselena.ru","password":"admin123"}' https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

echo "🔍 Testing team members API..."
curl -s -H "Authorization: Bearer $TOKEN" https://vselena.ldmco.ru/api/users/team-members | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('📊 Team members response:')
    if isinstance(data, list):
        print(f'Found {len(data)} users')
        for user in data[:3]:  # Show first 3 users
            print(f'  - {user.get(\"email\", \"N/A\")}: {user.get(\"firstName\", \"\")} {user.get(\"lastName\", \"\")}')
            if 'rolesByContext' in user:
                print(f'    Roles: {user[\"rolesByContext\"]}')
            else:
                print(f'    Roles: {user.get(\"role\", \"N/A\")}')
    else:
        print(f'Response: {data}')
except Exception as e:
    print(f'Error parsing response: {e}')
    print('Raw response:')
    sys.stdin.seek(0)
    print(sys.stdin.read())
"
