import { Platform } from 'react-native';

// 1. URL MANUAL (Túnel): Si la pegas// URL Fija del Backend (Render)
export const BASE_URL_CONFIG = 'https://pappi-backend.onrender.com';

const getBaseUrl = () => {
    // Mobile / Otros check first (or Web Localhost)
    if (Platform.OS === 'web') {
        const hostname = window.location.hostname;

        // 1. PRIORITY: Localhost always uses local backend (FAST)
        // Ignoramos localStorage si estamos en localhost para garantizar velocidad
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `http://127.0.0.1:3000`;
        }

        const savedUrl = localStorage.getItem('server_url');
        if (savedUrl) return savedUrl;

        // 2. Si es una IP de red local (ej. 192.168.1.50)

        // 2. Si es una IP de red local (ej. 192.168.1.50)
        const ipPattern = /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/;
        if (ipPattern.test(hostname)) {
            return `http://${hostname}:3000`;
        }

        // 3. Si entraste por túnel del Frontend, intenta usar la URL manual del Backend
        if (BASE_URL_CONFIG && BASE_URL_CONFIG.startsWith('http')) {
            return BASE_URL_CONFIG;
        }

        // 4. Fallback: usar el mismo origin
        return window.location.origin;
    }

    // Si es App Nativa y hay config manual, usarla
    if (BASE_URL_CONFIG && BASE_URL_CONFIG.startsWith('http')) {
        return BASE_URL_CONFIG;
    }

    // Fallback nativo final
    return 'http://192.168.1.95:3000'; // Ajusta esto a tu IP local fija
};

export const SERVER_URL = getBaseUrl();
console.log('🌐 APP CONNECTING TO:', SERVER_URL);

// Safe construction
const cleanUrl = SERVER_URL.replace(/\/$/, ''); // remove trailing slash
export const API_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
export const SOCKET_URL = SERVER_URL;
export const UPLOADS_URL = `${SERVER_URL}`;

// Headers to skip Pinggy/Localtunnel warning pages
export const DEFAULT_HEADERS = {
    'bypass-tunnel-reminder': 'true',
    'pinggy-skip-browser-warning': 'true'
};
