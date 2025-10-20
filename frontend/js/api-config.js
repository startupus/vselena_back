// Автоматическое определение API URL
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    
    // Если это localhost или 127.0.0.1 - используем локальный API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    
    // Иначе используем текущий домен
    return window.location.origin;
})();

console.log('API Base URL:', API_BASE_URL);
