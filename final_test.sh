#!/bin/bash

echo "🎯 FINAL TEST: User Roles After Transfer"
echo "========================================"

echo "🔐 Getting token..."
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"admin@vselena.ru","password":"admin123"}' https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token obtained"

echo ""
echo "🔍 Testing corrected user roles..."
curl -s -H "Authorization: Bearer $TOKEN" https://vselena.ldmco.ru/api/users/team-members | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('📊 FINAL RESULT: User roles after transfer')
    print('=' * 50)
    
    if isinstance(data, list):
        for user in data:
            if user.get('email') == 'saschkaproshka100@mail.ru':
                print(f'👤 User: {user.get(\"firstName\", \"\")} {user.get(\"lastName\", \"\")} ({user.get(\"email\", \"N/A\")})')
                print('')
                
                if 'rolesByContext' in user:
                    roles = user['rolesByContext']
                    
                    print(f'📋 Organizations ({len(roles.get(\"organizations\", []))} roles):')
                    for org_role in roles.get('organizations', []):
                        print(f'   🏢 {org_role[\"role\"]} in {org_role[\"organization\"]}')
                    
                    print(f'')
                    print(f'👥 Teams ({len(roles.get(\"teams\", []))} roles):')
                    for team_role in roles.get('teams', []):
                        print(f'   🏃 {team_role[\"role\"]} in {team_role[\"team\"]}')
                    
                    print('')
                    print('✅ EXPECTED RESULT:')
                    print('   - editor in organization \"1\"')
                    print('   - super_admin in team \"Поддержка\"')
                    print('   - viewer in team \"2\"')
                    print('   - NO admin in team \"1\" (removed during transfer)')
                    
                    # Check if old role is gone
                    has_old_role = any(role.get('role') == 'admin' and role.get('team') == '1' for role in roles.get('teams', []))
                    if has_old_role:
                        print('')
                        print('❌ ERROR: Old role \"admin (1)\" still exists!')
                    else:
                        print('')
                        print('🎉 SUCCESS: Old role \"admin (1)\" has been removed!')
                else:
                    print('   ❌ No rolesByContext found')
                break
    else:
        print(f'Response: {data}')
except Exception as e:
    print(f'Error parsing response: {e}')
"

echo ""
echo "🌐 Test page available at: https://vselena.ldmco.ru/test_final.html"
echo "📱 Dashboard available at: https://vselena.ldmco.ru/dashboard.html"
