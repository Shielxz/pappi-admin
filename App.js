import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import AuthScreen from './screens/AuthScreen';
import MenuScreen from './screens/MenuScreen';
import OrdersScreen from './screens/OrdersScreen';
import ConfigScreen from './screens/ConfigScreen';

export default function App() {
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [restaurant, setRestaurant] = useState(null);

    // Load session from localStorage
    useEffect(() => {
        if (Platform.OS === 'web') {
            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('authToken');
            if (savedUser && savedToken) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setAuthToken(savedToken);
                loadRestaurant(userData.id);
            }
        }
    }, []);

    const handleLogin = (userData, token) => {
        setUser(userData);
        setAuthToken(token);
        if (Platform.OS === 'web') {
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('authToken', token);
        }
        loadRestaurant(userData.id);
    };

    const loadRestaurant = async (userId) => {
        try {
            const res = await fetch('http://192.168.1.92:3000/api/menu/restaurants');
            const data = await res.json();
            const myRestaurant = data.find(r => r.owner_id === userId);
            if (myRestaurant) {
                setRestaurant(myRestaurant);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        setUser(null);
        setAuthToken(null);
        setRestaurant(null);
        setCurrentScreen('dashboard');
        if (Platform.OS === 'web') {
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
        }
    };

    if (!user) {
        return <AuthScreen onLoginSuccess={handleLogin} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.sidebar}>
                <Text style={styles.logo}>👨‍🍳 Pappi Admin</Text>
                <Text style={{ color: '#aaa', marginBottom: 20 }}>Hola, {user.name}</Text>

                <TouchableOpacity
                    style={[styles.menuItem, currentScreen === 'dashboard' && styles.menuItemActive]}
                    onPress={() => setCurrentScreen('dashboard')}
                >
                    <Text style={styles.menuText}>📊 Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, currentScreen === 'menu' && styles.menuItemActive]}
                    onPress={() => setCurrentScreen('menu')}
                >
                    <Text style={styles.menuText}>🍔 Menús</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, currentScreen === 'orders' && styles.menuItemActive]}
                    onPress={() => setCurrentScreen('orders')}
                >
                    <Text style={styles.menuText}>🛵 Pedidos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, currentScreen === 'config' && styles.menuItemActive]}
                    onPress={() => setCurrentScreen('config')}
                >
                    <Text style={styles.menuText}>⚙️ Configuración</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, { marginTop: 'auto', borderBottomWidth: 0 }]} onPress={handleLogout}>
                    <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>🚪 Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {currentScreen === 'dashboard' && (
                    <>
                        <Text style={styles.header}>Bienvenido, {user.name}</Text>
                        <Text style={styles.subtext}>Selecciona una opción del menú.</Text>

                        <View style={styles.card}>
                            <Text style={{ fontWeight: 'bold' }}>Estado del Sistema:</Text>
                            <Text>✅ Conectado como {user.role}</Text>
                            {restaurant && <Text style={{ marginTop: 5 }}>🏪 {restaurant.name}</Text>}
                        </View>
                    </>
                )}

                {currentScreen === 'menu' && <MenuScreen user={user} />}
                {currentScreen === 'orders' && restaurant && <OrdersScreen user={user} restaurant={restaurant} />}
                {currentScreen === 'config' && restaurant && <ConfigScreen user={user} restaurant={restaurant} onRestaurantUpdate={setRestaurant} />}
            </View>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: Platform.OS === 'web' || Platform.width > 768 ? 'row' : 'column',
        backgroundColor: '#f5f5f5',
    },
    sidebar: {
        width: Platform.OS === 'web' ? 250 : '100%',
        backgroundColor: '#202020',
        padding: 20,
        minHeight: Platform.OS === 'web' ? '100%' : 100,
    },
    logo: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30
    },
    menuItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: '#333'
    },
    menuItemActive: {
        backgroundColor: '#333'
    },
    menuText: {
        color: '#ddd',
        fontSize: 16
    },
    content: {
        flex: 1,
        padding: 30
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10
    },
    subtext: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10
    }
});
