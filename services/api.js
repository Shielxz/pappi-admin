import { API_URL as BASE_URL, DEFAULT_HEADERS } from './config';

export const api = {
    ver: console.log("✨ API CLIENT v0.5.33 (Login Logic Fix) LOADED ✨"),
    async register(name, email, password, role = 'admin') {
        // Legacy register
        return this.registerV2(name, email, password, '', 'Restaurante Sin Nombre');
    },

    async registerV2(name, email, password, phone, restaurantName) {
        try {
            const response = await fetch(`${BASE_URL}/auth/register-v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...DEFAULT_HEADERS
                },
                body: JSON.stringify({ name, email, password, role: 'admin', phone, restaurantName })
            });
            const data = await response.json();
            if (!response.ok) {
                const error = new Error(data.error || 'Request failed');
                error.data = data;
                throw error;
            }
            return data;
        } catch (e) {
            throw e;
        }
    },

    async verify(userId, emailCode, smsCode, email) {
        try {
            const response = await fetch(`${BASE_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...DEFAULT_HEADERS },
                body: JSON.stringify({ userId, emailCode, smsCode, email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Verification failed');
            return data;
        } catch (e) {
            throw e;
        }
    },

    async login(email, password) {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...DEFAULT_HEADERS
                },
                body: JSON.stringify({ email, password })
            });
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (!response.ok) {
                    const error = new Error(data.error || 'Login failed');
                    error.code = data.code;
                    throw error;
                }
                return data;
            } catch (e) {
                // If it's already an Error object with the message we want, just rethrow it
                if (e.message && e.message !== "Unexpected token " && !e.message.includes("JSON")) {
                    throw e;
                }
                console.error("[API] Login Parse Error. Raw response:", text);
                throw new Error("Error de conexión con el servidor (Respuesta no válida).");
            }
        } catch (e) {
            throw e;
        }
    },

    // SUPER ADMIN METHODS
    async getPendingUsers() {
        const res = await fetch(`${BASE_URL}/auth/pending`, { headers: DEFAULT_HEADERS });
        if (!res.ok) throw new Error('Failed to fetch pending');
        return await res.json();
    },

    async approveUser(userId) {
        const res = await fetch(`${BASE_URL}/auth/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...DEFAULT_HEADERS },
            body: JSON.stringify({ userId })
        });
        if (!res.ok) throw new Error('Failed to approve');
        return await res.json();
    },

    async rejectUser(userId) {
        const res = await fetch(`${BASE_URL}/auth/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...DEFAULT_HEADERS },
            body: JSON.stringify({ userId })
        });
        if (!res.ok) throw new Error('Failed to reject');
        return await res.json();
    }
};
