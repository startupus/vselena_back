#!/bin/bash

# Получаем токен
echo "🔐 Получаем токен для saschkaproshka04@mail.ru..."
TOKEN=$(curl -s -X POST https://vselena.ldmco.ru/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"saschkaproshka04@mail.ru","password":"11111111"}' | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['accessToken'])")

echo "✅ Токен получен: ${TOKEN:0:50}..."

# Переносим пользователя 1@mail.ru из команды 1 в команду 2
echo "🔄 Переносим пользователя 1@mail.ru из команды 1 в команду 2..."
RESPONSE=$(curl -s -X PATCH https://vselena.ldmco.ru/api/users/23565664-c87f-4888-a2eb-55f49dfaf20e/transfer-team \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"fromTeamId":"0b712b6b-5f63-4681-81ca-692e4433b5c8","toTeamId":"c0d70d9c-c65a-463e-9fb0-4259f0df170f"}')

echo "📋 Ответ сервера:"
echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(json.dumps(data, indent=2, ensure_ascii=False))
except:
    print('Ошибка парсинга JSON:', sys.stdin.read())
"

# Проверяем результат - получаем обновленный список сотрудников
echo "👥 Проверяем результат - получаем обновленный список сотрудников..."
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

echo "✅ Тестирование переноса завершено!"
