import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Dimensions } from 'react-native';
import AuthScreen from './screens/AuthScreen';
import MenuScreen from './screens/MenuScreen';
import OrdersScreen from './screens/OrdersScreen';
import ConfigScreen from './screens/ConfigScreen';
import SuperAdminScreen from './screens/SuperAdminScreen';
import DashboardScreen from './screens/DashboardScreen';
import { colors } from './theme/colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import io from 'socket.io-client';
import { SOCKET_URL, API_URL, DEFAULT_HEADERS } from './services/config';

export default function App() {
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [restaurant, setRestaurant] = useState(null);

    const [socket, setSocket] = useState(null);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [toast, setToast] = useState(null);


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
        console.log(`📡 Intentando cargar restaurante para usuario ID: ${userId}...`);
        try {
            const res = await fetch(`${API_URL}/menu/restaurants`, {
                headers: DEFAULT_HEADERS
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            console.log(`📦 Restaurantes encontrados (${data.length}):`, data.map(r => `[${r.name}: owner=${r.owner_id}]`));

            const myRestaurant = data.find(r => Number(r.owner_id) === Number(userId));
            if (myRestaurant) {
                console.log(`✅ Restaurante asignado: ${myRestaurant.name} (ID: ${myRestaurant.id})`);
                setRestaurant(myRestaurant);
            } else {
                console.warn(`⚠️ No se encontró restaurante para el dueño ID: ${userId}`);
            }
        } catch (e) {
            console.error("❌ Error en loadRestaurant:", e);
        }
    };

    // Socket connection management
    useEffect(() => {
        if (user && restaurant) {
            console.log('🔌 Conectando socket admin...');
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                timeout: 20000
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket admin conectado');
                newSocket.emit('register_admin', { restaurantId: restaurant.id });
            });

            newSocket.on('new_order', (order) => {
                console.log('🔔 Nuevo pedido recibido!');
                setPendingOrdersCount(prev => prev + 1);
                showToast("¡Nuevo pedido recibido!");
            });


            setSocket(newSocket);
            return () => newSocket.disconnect();
        }
    }, [user, restaurant?.id]);

    const handleLogout = () => {
        if (socket) socket.disconnect();
        setUser(null);
        setAuthToken(null);
        setRestaurant(null);
        setCurrentScreen('dashboard');
        setPendingOrdersCount(0);

        if (Platform.OS === 'web') {
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
        }
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };


    if (!user) {
        return <AuthScreen onLoginSuccess={handleLogin} />;
    }

    // 4. SUPER ADMIN INTERFACE (Strict Separation)
    if (user.role === 'superadmin') {
        return (
            <View style={styles.container}>
                {/* Simplified Sidebar for Super Admin */}
                <View style={styles.sidebar}>
                    <View style={styles.branding}>
                        <Text style={styles.logo}>⚡ Pappi<Text style={{ color: colors.primary }}>GOD</Text></Text>
                        <Text style={styles.welcomeText}>Super Admin Access</Text>
                    </View>

                    <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
                        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                        <Text style={[styles.menuText, styles.menuTextActive]}>Aprobaciones</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                        <Text style={{ color: colors.danger, fontWeight: 'bold', marginLeft: 10 }}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>

                {/* Content Area */}
                <View style={styles.content}>
                    <SuperAdminScreen onExit={() => { }} />
                </View>
                <StatusBar style="auto" />
            </View>
        );
    }

    // 5. STANDARD RESTAURANT OWNER INTERFACE
    return (
        <View style={styles.container}>
            <View style={styles.sidebar}>
                <View style={styles.branding}>
                    <Text style={styles.logo}>⚡ Pappi<Text style={{ color: colors.primary }}>Admin</Text></Text>
                    <Text style={styles.welcomeText}>Hola, {user.name}</Text>
                </View>

                <View style={styles.navMenu}>
                    <TouchableOpacity
                        style={[styles.menuItem, currentScreen === 'dashboard' && styles.menuItemActive]}
                        onPress={() => setCurrentScreen('dashboard')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="stats-chart" size={20} color={currentScreen === 'dashboard' ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.menuText, currentScreen === 'dashboard' && styles.menuTextActive]}>Dashboard</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, currentScreen === 'orders' && styles.menuItemActive]}
                        onPress={() => {
                            setCurrentScreen('orders');
                            setPendingOrdersCount(0);
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <MaterialCommunityIcons name="motorbike" size={20} color={currentScreen === 'orders' ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.menuText, currentScreen === 'orders' && styles.menuTextActive]}>Pedidos</Text>
                        </View>
                        {pendingOrdersCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{pendingOrdersCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, currentScreen === 'menu' && styles.menuItemActive]}
                        onPress={() => setCurrentScreen('menu')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="fast-food" size={20} color={currentScreen === 'menu' ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.menuText, currentScreen === 'menu' && styles.menuTextActive]}>Menú</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, currentScreen === 'config' && styles.menuItemActive]}
                        onPress={() => setCurrentScreen('config')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="settings" size={20} color={currentScreen === 'config' ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.menuText, currentScreen === 'config' && styles.menuTextActive]}>Ajustes</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                    <Text style={{ color: colors.danger, fontWeight: 'bold', marginLeft: 10 }}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>


            <View style={styles.content}>
                {currentScreen === 'dashboard' && restaurant && <DashboardScreen user={user} restaurant={restaurant} />}


                {currentScreen === 'menu' && restaurant && <MenuScreen user={user} restaurant={restaurant} />}
                {currentScreen === 'orders' && restaurant && <OrdersScreen user={user} restaurant={restaurant} socket={socket} onOrdersUpdate={(count) => {
                    // This will be called by OrdersScreen if we want to sync total active orders
                }} />}
                {currentScreen === 'config' && restaurant && <ConfigScreen user={user} restaurant={restaurant} onRestaurantUpdate={setRestaurant} />}
            </View>

            {/* Toast System */}
            {toast && (
                <View style={styles.toastContainer}>
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            )}

            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: Platform.OS === 'web' || Dimensions.get('window').width > 768 ? 'row' : 'column',
        backgroundColor: '#121212', // Deep Dark BG
    },
    sidebar: {
        width: Platform.OS === 'web' ? 260 : '100%',
        backgroundColor: '#000000',
        padding: 25,
        minHeight: Platform.OS === 'web' ? '100vh' : 80,
        borderRightWidth: 1,
        borderRightColor: '#222'
    },
    branding: {
        marginBottom: 20
    },
    logo: {
        color: 'white',
        fontSize: 26,
        fontWeight: 'bold',
        letterSpacing: -0.5
    },
    welcomeText: {
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 5
    },
    navMenu: {
        flex: 1
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 5,
        borderRadius: 12,
    },
    menuItemActive: {
        backgroundColor: 'rgba(255, 69, 0, 0.15)'
    },
    menuText: {
        color: colors.textSecondary,
        fontSize: 15,
        marginLeft: 10,
        fontWeight: '500'
    },
    menuTextActive: {
        color: colors.primary,
        fontWeight: 'bold'
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#222'
    },
    content: {
        flex: 1,
        backgroundColor: colors.bgDark
    },
    badge: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold'
    },
    toastContainer: {
        position: 'absolute',
        top: 30,
        alignSelf: 'center',
        backgroundColor: 'rgba(30,30,30,0.95)',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: { boxShadow: '0 8px 30px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' },
            default: { elevation: 10 }
        }),
        zIndex: 9999
    },
    toastText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16
    }
});


