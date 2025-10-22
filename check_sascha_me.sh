#!/bin/bash
echo "=== Checking /api/auth/me for saschkaproshka04@mail.ru ==="
echo ""

echo "1. Login..."
LOGIN_RESPONSE=$(curl -X POST https://vselena.ldmco.ru/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"saschkaproshka04@mail.ru","password":"11111111"}' \
  -s)

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["accessToken"])' 2>/dev/null)

echo "2. Testing /api/auth/me..."
curl -X GET https://vselena.ldmco.ru/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -m json.tool
echo ""
