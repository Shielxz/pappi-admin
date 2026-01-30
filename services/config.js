import { Platform } from 'react-native';

// URL Fija del Backend (Render)
export const BASE_URL_CONFIG = 'https://pappi-backend.onrender.com';

const getBaseUrl = () => {
    return BASE_URL_CONFIG;
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
