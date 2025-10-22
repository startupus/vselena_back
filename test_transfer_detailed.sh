#!/bin/bash

# Получаем токен
echo "🔐 Получаем токен для saschkaproshka04@mail.ru..."
TOKEN=$(curl -s -X POST https://vselena.ldmco.ru/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"saschkaproshka04@mail.ru","password":"11111111"}' | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['accessToken'])")

echo "✅ Токен получен: ${TOKEN:0:50}..."

# Получаем детальную информацию о сотрудниках
echo "👥 Получаем детальную информацию о сотрудниках..."
curl -s -X GET https://vselena.ldmco.ru/api/users/team-members \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Найдено сотрудников: {len(data)}')
for user in data:
    teams = user.get('teams', [])
    orgs = user.get('organizations', [])
    print(f'- {user[\"email\"]} (ID: {user[\"id\"]})')
    print(f'  Команды: {[t[\"name\"] for t in teams]}')
    print(f'  Организации: {[o[\"name\"] for o in orgs]}')
    print()
"

# Получаем детальную информацию о командах
echo "🏢 Получаем детальную информацию о командах..."
curl -s -X GET https://vselena.ldmco.ru/api/teams \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Найдено команд: {len(data)}')
for team in data:
    print(f'- {team[\"name\"]} (ID: {team[\"id\"]})')
    print(f'  Организация: {team.get(\"organization\", {}).get(\"name\", \"Не указана\")}')
    print()
"

echo "✅ Детальное тестирование завершено!"
