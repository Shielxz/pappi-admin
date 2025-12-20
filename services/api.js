import { Platform } from 'react-native';

const BASE_URL = 'http://192.168.1.92:3000/api'; // Adjust IP if needed

export const api = {
    async register(name, email, password, role = 'admin') {
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Register failed');
            return data;
        } catch (e) {
            throw e;
        }
    },

    async login(email, password) {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');
            return data;
        } catch (e) {
            throw e;
        }
    }
};
