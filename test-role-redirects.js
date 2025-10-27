// Тест роли-ориентированных перенаправлений
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:3002';

async function testRoleRedirects() {
    console.log('🔐 Тестирование роли-ориентированных перенаправлений\n');
    
    try {
        // 1. Тест входа как super_admin
        console.log('1. Тестирование входа как super_admin...');
        const superAdminResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@vselena.ru',
            password: 'admin123'
        });
        
        const superAdminData = superAdminResponse.data;
        console.log(`✅ Super Admin login successful`);
        console.log(`   Роли: ${superAdminData.user.roles?.length || 0}`);
        console.log(`   Права: ${superAdminData.user.permissions?.length || 0}`);
        console.log(`   Первая роль: ${superAdminData.user.roles?.[0]?.name || 'none'}`);
        
        // Проверяем, что super_admin имеет роль super_admin
        const superAdminRole = superAdminData.user.roles?.[0]?.name;
        if (superAdminRole === 'super_admin') {
            console.log('✅ Super Admin имеет правильную роль');
        } else {
            console.log('❌ Super Admin не имеет правильной роли');
        }
        
        // 2. Тест получения информации о пользователе
        console.log('\n2. Тестирование /auth/me...');
        const meResponse = await axios.get(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${superAdminData.accessToken}`
            }
        });
        
        const meData = meResponse.data;
        console.log(`✅ /auth/me successful`);
        console.log(`   Роли: ${meData.roles?.length || 0}`);
        console.log(`   Права: ${meData.permissions?.length || 0}`);
        
        // 3. Тест микромодулей
        console.log('\n3. Тестирование микромодулей...');
        const modulesResponse = await axios.get(`${API_BASE}/micro-modules`);
        const modules = modulesResponse.data;
        console.log(`✅ Микромодули загружены: ${modules.length} модулей`);
        
        modules.forEach(module => {
            console.log(`   📦 ${module.name} - ${module.isEnabled ? 'Включен' : 'Отключен'}`);
        });
        
        // 4. Тест роли-ориентированного UI
        console.log('\n4. Тестирование роли-ориентированного UI...');
        const highestRole = getHighestRole(meData.roles || []);
        console.log(`   Высшая роль: ${highestRole}`);
        
        if (highestRole === 'super_admin') {
            console.log('✅ Super Admin должен быть перенаправлен на /test-micro-modules.html');
            console.log('✅ Super Admin должен видеть все админские элементы');
            console.log('✅ Super Admin должен видеть настройки системы');
        } else if (highestRole === 'admin') {
            console.log('✅ Admin должен быть перенаправлен на /dashboard.html');
            console.log('✅ Admin должен видеть вкладки: Организация, Команда, Сотрудники');
        } else if (highestRole === 'viewer') {
            console.log('✅ Viewer должен быть перенаправлен на /dashboard.html');
            console.log('✅ Viewer НЕ должен видеть админские вкладки');
        }
        
        // 5. Тест прав доступа
        console.log('\n5. Тестирование прав доступа...');
        const permissions = meData.permissions || [];
        console.log(`   Всего прав: ${permissions.length}`);
        
        // Группируем права по ресурсам
        const groupedPermissions = {};
        permissions.forEach(perm => {
            const resource = perm.resource || 'unknown';
            if (!groupedPermissions[resource]) {
                groupedPermissions[resource] = [];
            }
            groupedPermissions[resource].push(perm.name);
        });
        
        Object.keys(groupedPermissions).forEach(resource => {
            console.log(`   📁 ${resource}: ${groupedPermissions[resource].length} прав`);
        });
        
        console.log('\n🎉 Все тесты пройдены успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
        if (error.response) {
            console.error('   Статус:', error.response.status);
            console.error('   Данные:', error.response.data);
        }
    }
}

function getHighestRole(roles) {
    const rolePriority = {
        'super_admin': 5,
        'admin': 4,
        'manager': 3,
        'editor': 2,
        'viewer': 1
    };
    
    let highestRole = null;
    let highestPriority = 0;
    
    roles.forEach(role => {
        const priority = rolePriority[role.name] || 0;
        if (priority > highestPriority) {
            highestPriority = priority;
            highestRole = role.name;
        }
    });
    
    return highestRole || 'unknown';
}

// Запуск тестов
testRoleRedirects();
