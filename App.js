import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import AuthScreen from './screens/AuthScreen';

export default function App() {
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);

    const handleLogin = (userData, token) => {
        setUser(userData);
        setAuthToken(token);
    };

    const handleLogout = () => {
        setUser(null);
        setAuthToken(null);
    };

    if (!user) {
        return <AuthScreen onLoginSuccess={handleLogin} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.sidebar}>
                <Text style={styles.logo}>👨‍🍳 Pappi Admin</Text>
                <Text style={{ color: '#aaa', marginBottom: 20 }}>Hola, {user.name}</Text>

                <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>📊 Dashboard</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>🍔 Mi Menú</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>🛵 Pedidos</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>⚙️ Configuración</Text></TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, { marginTop: 'auto', borderBottomWidth: 0 }]} onPress={handleLogout}>
                    <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>🚪 Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.header}>Bienvenido, Restaurante</Text>
                <Text style={styles.subtext}>Selecciona una opción para empezar.</Text>

                <View style={styles.card}>
                    <Text style={{ fontWeight: 'bold' }}>Estado del Sistema:</Text>
                    <Text>✅ Conectado como {user.role}</Text>
                </View>
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
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5
    }
});
