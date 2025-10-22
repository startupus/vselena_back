// Автоматическое определение API URL
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    
    // Если это localhost или 127.0.0.1 - используем локальный API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    
    // Если это IP адрес - используем порт 3001
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    
    // Для домена используем тот же протокол и хост (nginx проксирует на /api/)
    return `${window.location.protocol}//${window.location.hostname}`;
})();

console.log('API Base URL:', API_BASE_URL);
