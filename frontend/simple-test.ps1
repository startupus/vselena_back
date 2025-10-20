# Простой тест Vselena Frontend
Write-Host "🧪 ПРОСТОЙ ТЕСТ VSELENA FRONTEND" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

$API_BASE = "http://localhost:3001/api"

# Тест 1: Frontend доступен
Write-Host "`n1️⃣ Проверка frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Frontend доступен: http://localhost:3000" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Frontend недоступен" -ForegroundColor Red
}

# Тест 2: Backend доступен
Write-Host "`n2️⃣ Проверка backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/me" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Backend доступен: $API_BASE" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Backend недоступен" -ForegroundColor Red
}

# Тест 3: Регистрация
Write-Host "`n3️⃣ Тест регистрации..." -ForegroundColor Yellow
$registerData = @{
    email = "simpletest@example.com"
    password = "testpass123"
    firstName = "Simple"
    lastName = "Test"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "   ✅ Регистрация успешна (ID: $($response.id))" -ForegroundColor Green
    $userId = $response.id
}
catch {
    Write-Host "   ❌ Регистрация не удалась: $($_.Exception.Message)" -ForegroundColor Red
}

# Тест 4: Вход
Write-Host "`n4️⃣ Тест входа..." -ForegroundColor Yellow
$loginData = @{
    email = "simpletest@example.com"
    password = "testpass123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "   ✅ Вход успешен (Token: $($response.accessToken.Substring(0, 20))...)" -ForegroundColor Green
    $accessToken = $response.accessToken
}
catch {
    Write-Host "   ❌ Вход не удался: $($_.Exception.Message)" -ForegroundColor Red
}

# Тест 5: Получение данных пользователя
if ($accessToken) {
    Write-Host "`n5️⃣ Тест получения данных..." -ForegroundColor Yellow
    try {
        $headers = @{ "Authorization" = "Bearer $accessToken" }
        $response = Invoke-RestMethod -Uri "$API_BASE/auth/me" -Method GET -Headers $headers
        Write-Host "   ✅ Данные получены (Email: $($response.email))" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Получение данных не удалось: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Тест 6: Восстановление пароля
Write-Host "`n6️⃣ Тест восстановления пароля..." -ForegroundColor Yellow
$resetData = @{
    email = "simpletest@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/password-reset/forgot" -Method POST -Body $resetData -ContentType "application/json"
    Write-Host "   ✅ Восстановление пароля успешно" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Восстановление пароля не удалось: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔗 Ссылки для тестирования:" -ForegroundColor Magenta
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Test Page: http://localhost:3000/test.html" -ForegroundColor White
Write-Host "   Backend API: $API_BASE" -ForegroundColor White
Write-Host "   Swagger Docs: $API_BASE/docs" -ForegroundColor White

Write-Host "`n✨ Тестирование завершено!" -ForegroundColor Green
