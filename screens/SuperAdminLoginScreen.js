import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function SuperAdminLoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return alert("Ingrese credenciales");

        setLoading(true);
        try {
            const res = await api.login(email, password);
            if (res.user.role !== 'superadmin') {
                alert("ACCESO DENEGADO: Esta cuenta no es Super Admin");
                setLoading(false);
                return;
            }
            onLoginSuccess(res.user, res.token);
        } catch (e) {
            alert(e.message || "Error de inicio de sesión");
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
                    <Text style={styles.title}>Super Admin Portal</Text>
                    <Text style={styles.subtitle}>Acceso Restringido</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="person-circle-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="ID de Administrador"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoFocus
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Clave de Seguridad"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        onKeyPress={(e) => e.nativeEvent.key === 'Enter' && handleLogin()}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>ENTRAR AL SISTEMA</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => window.location.href = '/'} style={{ marginTop: 20 }}>
                    <Text style={styles.backLink}>← Volver al Login de Restaurantes</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505', // Casi negro absoluto
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 5,
        borderTopColor: colors.primary
    },
    card: {
        width: 400,
        padding: 40,
        backgroundColor: '#111',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }
        })
    },
    header: {
        alignItems: 'center',
        marginBottom: 40
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    subtitle: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
        letterSpacing: 2
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#333',
        width: '100%',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 4,
        marginBottom: 15
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        outlineStyle: 'none'
    },
    btn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 15,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10
    },
    btnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1
    },
    backLink: {
        color: '#444',
        fontSize: 12
    }
});
