import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Dimensions, useWindowDimensions, Animated } from 'react-native';
import AuthScreen from './screens/AuthScreen';
import MenuScreen from './screens/MenuScreen';
import OrdersScreen from './screens/OrdersScreen';
import ConfigScreen from './screens/ConfigScreen';
import SuperAdminLoginScreen from './screens/SuperAdminLoginScreen';
import SuperAdminScreen from './screens/SuperAdminScreen';
import DashboardScreen from './screens/DashboardScreen';
import { colors } from './theme/colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import io from 'socket.io-client';
import { SOCKET_URL, API_URL, DEFAULT_HEADERS } from './services/config';
import { api } from './services/api';

// WEB SCROLLBAR STYLING
if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.textContent = `
        * {
            scrollbar-width: thin;
            scrollbar-color: #333 #121212;
        }
        ::-webkit-scrollbar { width: 8px !important; height: 8px !important; }
        ::-webkit-scrollbar-track { background: #121212 !important; }
        ::-webkit-scrollbar-thumb { background: #333 !important; border-radius: 4px !important; }
        ::-webkit-scrollbar-thumb:hover { background: #555 !important; }
    `;
    document.head.appendChild(style);
}

export default function App() {
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [restaurant, setRestaurant] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [socket, setSocket] = useState(null);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [toast, setToast] = useState(null);

    // Dynamic responsive width
    const { width: windowWidth } = useWindowDimensions();
    const isMobile = windowWidth < 768;

    // Super Admin Portal Mode Detection
    const [isSuperPortal, setIsSuperPortal] = useState(() => {
        if (Platform.OS === 'web') {
            const path = window.location.pathname;
            return path.includes('/admin') || path.includes('/super');
        }
        return false;
    });

    // Load session from localStorage
    useEffect(() => {
        if (Platform.OS === 'web') {
            const userKey = isSuperPortal ? 'super_user' : 'user';
            const tokenKey = isSuperPortal ? 'super_token' : 'authToken';

            const savedUser = localStorage.getItem(userKey);
            const savedToken = localStorage.getItem(tokenKey);

            if (savedUser && savedToken) {
                const userData = JSON.parse(savedUser);
                if (!isSuperPortal && userData.role === 'superadmin') return;

                setUser(userData);
                setAuthToken(savedToken);
                loadRestaurant(userData.id);
            }
        }
    }, [isSuperPortal]);

    const handleLogin = (userData, token) => {
        setUser(userData);
        setAuthToken(token);
        if (Platform.OS === 'web') {
            const userKey = isSuperPortal ? 'super_user' : 'user';
            const tokenKey = isSuperPortal ? 'super_token' : 'authToken';

            localStorage.setItem(userKey, JSON.stringify(userData));
            localStorage.setItem(tokenKey, token);
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
            console.log(`📋 Restaurantes encontrados: ${data.length}`, data.map(r => ({ id: r.id, owner_id: r.owner_id, name: r.name })));
            const myRestaurant = data.find(r => Number(r.owner_id) === Number(userId));
            if (myRestaurant) {
                console.log(`✅ Restaurante encontrado:`, myRestaurant.name);
                setRestaurant(myRestaurant);
            } else {
                console.log(`⚠️ No se encontró restaurante. Creando uno automáticamente (Self-Healing)...`);
                try {
                    const newRest = await api.ensureRestaurant(userId, "Mi Restaurante");
                    console.log(`✨ Restaurante creado/recuperado:`, newRest);
                    setRestaurant(newRest);
                } catch (err) {
                    console.error("❌ Falló autocuración de restaurante:", err);
                    setRestaurant(null);
                }
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
                newSocket.emit('register_admin', { restaurantId: restaurant.id });
            });

            newSocket.on('new_order', (order) => {
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
            const userKey = isSuperPortal ? 'super_user' : 'user';
            const tokenKey = isSuperPortal ? 'super_token' : 'authToken';
            localStorage.removeItem(userKey);
            localStorage.removeItem(tokenKey);
        }
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const navigateTo = (screen) => {
        setCurrentScreen(screen);
        if (screen === 'orders') setPendingOrdersCount(0);
        if (isMobile) setSidebarOpen(false); // Auto-close on mobile
    };

    // --- AUTH SCREENS ---
    if (!user) {
        if (isSuperPortal) {
            return <SuperAdminLoginScreen onLoginSuccess={handleLogin} />;
        }
        return <AuthScreen onLoginSuccess={handleLogin} />;
    }

    // --- SIDEBAR COMPONENT (shared between super admin and regular) ---
    const renderSidebar = (isSuperAdmin = false) => (
        <View style={[
            styles.sidebar,
            isMobile && styles.sidebarMobile
        ]}>
            {/* Close button on mobile */}
            {isMobile && (
                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSidebarOpen(false)}
                >
                    <Ionicons name="close" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
            )}

            <View style={styles.branding}>
                {isSuperAdmin ? (
                    <>
                        <Text style={styles.logo}>⚡ Pappi<Text style={{ color: colors.primary }}>GOD</Text></Text>
                        <Text style={styles.welcomeText}>Super Admin Access</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.logo}>Pappi<Text style={{ color: colors.primary }}>Negocio</Text></Text>
                        <Text style={styles.welcomeText}>Hola, {user.name}</Text>
                    </>
                )}
            </View>

            {isSuperAdmin ? (
                <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                    <Text style={[styles.menuText, styles.menuTextActive]}>Aprobaciones</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.navMenu}>
                    <TouchableOpacity
                        style={[styles.menuItem, currentScreen === 'dashboard' && styles.menuItemActive]}
                        onPress={() => navigateTo('dashboard')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="stats-chart" size={20} color={currentScreen === 'dashboard' ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.menuText, currentScreen === 'dashboard' && styles.menuTextActive]}>Dashboard</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, currentScreen === 'orders' && styles.menuItemActive]}
                        onPress={() => navigateTo('orders')}
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
                        onPress={() => navigateTo('menu')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="fast-food" size={20} color={currentScreen === 'menu' ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.menuText, currentScreen === 'menu' && styles.menuTextActive]}>Menú</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, currentScreen === 'config' && styles.menuItemActive]}
                        onPress={() => navigateTo('config')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="settings" size={20} color={currentScreen === 'config' ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.menuText, currentScreen === 'config' && styles.menuTextActive]}>Ajustes</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                <Text style={{ color: colors.danger, fontWeight: 'bold', marginLeft: 10 }}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
    );

    // --- MOBILE TOP BAR ---
    const renderMobileTopBar = () => (
        <View style={styles.mobileTopBar}>
            <TouchableOpacity
                style={styles.hamburgerBtn}
                onPress={() => setSidebarOpen(true)}
            >
                <Ionicons name="menu" size={26} color="white" />
            </TouchableOpacity>
            <Text style={styles.mobileTitle}>
                Pappi<Text style={{ color: colors.primary }}>Negocio</Text>
            </Text>
            <View style={{ width: 40 }} />
        </View>
    );

    // 4. SUPER ADMIN INTERFACE
    if (user.role === 'superadmin') {
        return (
            <View style={[styles.container, !isMobile && { flexDirection: 'row' }]}>
                {/* Mobile top bar */}
                {isMobile && renderMobileTopBar()}

                {/* Sidebar: always visible on desktop, overlay on mobile */}
                {isMobile ? (
                    sidebarOpen && (
                        <>
                            <TouchableOpacity
                                style={styles.overlay}
                                activeOpacity={1}
                                onPress={() => setSidebarOpen(false)}
                            />
                            {renderSidebar(true)}
                        </>
                    )
                ) : (
                    renderSidebar(true)
                )}

                <View style={styles.content}>
                    <SuperAdminScreen onExit={() => { }} />
                </View>
                <StatusBar style="auto" />
            </View>
        );
    }

    // 5. STANDARD RESTAURANT OWNER INTERFACE
    return (
        <View style={[styles.container, !isMobile && { flexDirection: 'row' }]}>
            {/* Mobile top bar */}
            {isMobile && renderMobileTopBar()}

            {/* Sidebar: always visible on desktop, overlay on mobile */}
            {isMobile ? (
                sidebarOpen && (
                    <>
                        <TouchableOpacity
                            style={styles.overlay}
                            activeOpacity={1}
                            onPress={() => setSidebarOpen(false)}
                        />
                        {renderSidebar(false)}
                    </>
                )
            ) : (
                renderSidebar(false)
            )}

            <View style={styles.content}>
                {!restaurant ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                        <Ionicons name="restaurant-outline" size={80} color={colors.textMuted} />
                        <Text style={{ color: colors.textSecondary, fontSize: 20, marginTop: 20, textAlign: 'center' }}>
                            Cargando tu restaurante...
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 10, textAlign: 'center' }}>
                            Si no aparece, es posible que tu cuenta aún no tenga un restaurante vinculado.
                        </Text>
                        <TouchableOpacity
                            style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
                            onPress={() => loadRestaurant(user.id)}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {currentScreen === 'dashboard' && <DashboardScreen user={user} restaurant={restaurant} />}
                        {currentScreen === 'menu' && <MenuScreen user={user} restaurant={restaurant} />}
                        {currentScreen === 'orders' && <OrdersScreen user={user} restaurant={restaurant} socket={socket} onOrdersUpdate={(count) => { }} />}
                        {currentScreen === 'config' && <ConfigScreen user={user} restaurant={restaurant} onRestaurantUpdate={setRestaurant} />}
                    </>
                )}
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
        flexDirection: 'column', // Always column, sidebar handled dynamically
        backgroundColor: '#121212',
        ...Platform.select({
            web: { minHeight: '100vh' }
        })
    },
    // --- MOBILE TOP BAR ---
    mobileTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'web' ? 12 : 50, // Safe area
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        zIndex: 10,
    },
    hamburgerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mobileTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    // --- OVERLAY ---
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 99,
    },
    // --- SIDEBAR ---
    sidebar: {
        width: 260,
        backgroundColor: '#000000',
        padding: 25,
        borderRightWidth: 1,
        borderRightColor: '#222',
        ...Platform.select({
            web: { minHeight: '100vh' }
        })
    },
    sidebarMobile: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 280,
        zIndex: 100,
        paddingTop: 20,
        ...Platform.select({
            web: { minHeight: '100vh', boxShadow: '4px 0 20px rgba(0,0,0,0.5)' }
        })
    },
    closeBtn: {
        alignSelf: 'flex-end',
        padding: 8,
        marginBottom: 10,
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
        backgroundColor: colors.bgDark,
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
