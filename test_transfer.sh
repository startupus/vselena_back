#!/bin/bash

# Получаем токен
echo "🔐 Получаем токен для saschkaproshka04@mail.ru..."
TOKEN=$(curl -s -X POST https://vselena.ldmco.ru/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"saschkaproshka04@mail.ru","password":"11111111"}' | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['accessToken'])")

echo "✅ Токен получен: ${TOKEN:0:50}..."

# Получаем список сотрудников
echo "👥 Получаем список сотрудников..."
curl -s -X GET https://vselena.ldmco.ru/api/users/team-members \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Найдено сотрудников: {len(data)}'); [print(f'- {user[\"email\"]} (ID: {user[\"id\"]})') for user in data]"

# Получаем список команд
echo "🏢 Получаем список команд..."
curl -s -X GET https://vselena.ldmco.ru/api/teams \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Найдено команд: {len(data)}'); [print(f'- {team[\"name\"]} (ID: {team[\"id\"]})') for team in data]"

echo "✅ Тестирование завершено!"
