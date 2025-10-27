#!/bin/bash

# Тест API микромодулей
echo "🧪 Тестирование API микромодулей..."

# Базовый URL
BASE_URL="http://localhost:3001/api"

# Функция для выполнения HTTP запросов
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4
    
    if [ -n "$data" ]; then
        curl -s -X $method "$url" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data"
    else
        curl -s -X $method "$url" \
            -H "$headers"
    fi
}

echo "1. Проверка доступности API..."
response=$(make_request "GET" "$BASE_URL/micro-modules")
if [ $? -eq 0 ]; then
    echo "✅ API доступен"
    echo "Ответ: $response"
else
    echo "❌ API недоступен"
    exit 1
fi

echo ""
echo "2. Получение списка микромодулей..."
response=$(make_request "GET" "$BASE_URL/micro-modules")
echo "Список микромодулей: $response"

echo ""
echo "3. Получение информации о конкретном модуле..."
response=$(make_request "GET" "$BASE_URL/micro-modules/email-auth")
echo "Информация о email-auth модуле: $response"

echo ""
echo "4. Проверка UI элементов..."
response=$(make_request "GET" "$BASE_URL/ui-permissions/elements")
echo "UI элементы: $response"

echo ""
echo "5. Проверка навигационного меню..."
response=$(make_request "GET" "$BASE_URL/ui-permissions/navigation")
echo "Навигационное меню: $response"

echo ""
echo "🎉 Тестирование завершено!"
