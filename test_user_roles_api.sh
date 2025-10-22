#!/bin/bash

echo "🔐 Getting token..."
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"admin@vselena.ru","password":"admin123"}' https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token obtained"

echo "🔍 Testing user roles API..."
curl -s -H "Authorization: Bearer $TOKEN" https://vselena.ldmco.ru/api/users/team-members | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('📊 Current user roles:')
    if isinstance(data, list):
        for user in data:
            if user.get('email') == 'saschkaproshka100@mail.ru':
                print(f'👤 User: {user.get(\"firstName\", \"\")} {user.get(\"lastName\", \"\")} ({user.get(\"email\", \"N/A\")})')
                
                if 'rolesByContext' in user:
                    roles = user['rolesByContext']
                    print(f'   📋 Organizations: {len(roles.get(\"organizations\", []))} roles')
                    for org_role in roles.get('organizations', []):
                        print(f'      🏢 {org_role[\"role\"]} in {org_role[\"organization\"]}')
                    
                    print(f'   👥 Teams: {len(roles.get(\"teams\", []))} roles')
                    for team_role in roles.get('teams', []):
                        print(f'      🏃 {team_role[\"role\"]} in {team_role[\"team\"]}')
                else:
                    print(f'   ❌ No rolesByContext found')
                break
    else:
        print(f'Response: {data}')
except Exception as e:
    print(f'Error parsing response: {e}')
"
