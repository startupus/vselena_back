#!/bin/bash

echo "🔍 Checking admin permissions for invitations..."

# Get admin token
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"admin@vselena.ru","password":"admin123"}' https://vselena.ldmco.ru/api/auth/login | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✅ Admin token obtained: ${TOKEN:0:20}..."

# Check admin info
echo ""
echo "👤 Admin info:"
curl -s -H "Authorization: Bearer $TOKEN" https://vselena.ldmco.ru/api/auth/me | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'Email: {data.get(\"email\", \"N/A\")}')
    print(f'Roles: {data.get(\"roles\", [])}')
    print(f'Permissions: {data.get(\"permissions\", [])}')
    print(f'Organization: {data.get(\"organizationId\", \"N/A\")}')
    print(f'Team: {data.get(\"teamId\", \"N/A\")}')
except Exception as e:
    print(f'Error: {e}')
"

# Check if admin has invitation permissions
echo ""
echo "🔑 Checking invitation permissions..."
INVITATION_PERMISSIONS=("invitations.create" "invitations.read" "invitations.update" "invitations.delete" "teams.members" "organizations.members")

for perm in "${INVITATION_PERMISSIONS[@]}"; do
    echo -n "  $perm: "
    if curl -s -H "Authorization: Bearer $TOKEN" https://vselena.ldmco.ru/api/auth/me | grep -q "\"$perm\""; then
        echo "✅"
    else
        echo "❌"
    fi
done
