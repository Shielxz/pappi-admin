import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import VerificationScreen from './VerificationScreen';
import SuperAdminScreen from './SuperAdminScreen';

export default function AuthScreen({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Verification Logic
    const [verificationMode, setVerificationMode] = useState(false);
    const [pendingUserId, setPendingUserId] = useState(null);

    // Manual Server Config
    const [showServerConfig, setShowServerConfig] = useState(false);
    const [customServerUrl, setCustomServerUrl] = useState('');
    const [showSuperAdmin, setShowSuperAdmin] = useState(false);

    const showAlert = (title, msg) => {
        if (Platform.OS === 'web') alert(`${title}: ${msg}`);
        else Alert.alert(title, msg);
    };

    const handleAuth = async () => {
        if (!email || !password) return showAlert("Error", "Todos los campos son obligatorios");
        if (!isLogin && (!name || !phone)) return showAlert("Error", "Nombre y Teléfono son requeridos");

        setLoading(true);
        try {
            if (isLogin) {
                const res = await api.login(email, password);
                onLoginSuccess(res.user, res.token);
            } else {
                // Register V2
                const res = await api.registerV2(name, email, password, phone, name);
                showAlert("Registro Exitoso", "Revise la consola del servidor para ver los códigos de verificación (MOCK).");
                setPendingUserId(res.userId);
                setVerificationMode(true);
            }
        } catch (e) {
            console.error(e);

            // Handle Backend Error Codes if attached to error object
            // Configured api.js to attach 'data' to error
            const errorData = e.data || {};

            if (errorData.code === 'NOT_VERIFIED' && errorData.userId) {
                showAlert("Cuenta no verificada", "Redirigiendo a verificación...");
                setPendingUserId(errorData.userId);
                setVerificationMode(true);
            } else if (errorData.code === 'PENDING_APPROVAL') {
                showAlert("Pendiente de Aprobación", "Su cuenta ya fue verificada y está siendo revisada por un administrador.");
            } else {
                showAlert("Error", e.message || "Ocurrió un error inesperado");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && !verificationMode) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (verificationMode) {
        return (
            <VerificationScreen
                userId={pendingUserId}
                onVerified={() => {
                    setVerificationMode(false);
                    showAlert("Verificado", "Ahora debe esperar la aprobación del administrador para ingresar.");
                    setIsLogin(true);
                }}
                onCancel={() => setVerificationMode(false)}
            />
        );
    }

    if (showSuperAdmin) {
        return <SuperAdminScreen onExit={() => setShowSuperAdmin(false)} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <Text style={styles.appTitle}>⚡ Pappi<Text style={{ color: colors.primary }}>Admin</Text></Text>
                </View>
                <Text style={styles.title}>{isLogin ? "Bienvenido de nuevo" : "Registrar Negocio"}</Text>

                {!isLogin && (
                    <>
                        <View style={styles.inputContainer}>
                            <Ionicons name="business-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del Restaurante"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Teléfono"
                                placeholderTextColor={colors.textMuted}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </>
                )}

                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Correo Electrónico"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        onKeyPress={(e) => {
                            if (e.nativeEvent.key === 'Enter') {
                                handleAuth();
                            }
                        }}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
                    <Text style={styles.btnText}>{isLogin ? "Iniciar Sesión" : "Crear Cuenta PENDIENTE"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ padding: 10 }}>
                    <Text style={styles.link}>
                        {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entrar"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ marginTop: 25, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15, alignItems: 'center' }}
                    onPress={() => {
                        if (Platform.OS === 'web') {
                            setShowServerConfig(!showServerConfig);
                        } else {
                            Alert.alert("Info", "Esta opción es solo para Web por ahora");
                        }
                    }}
                >
                    <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
                        <Ionicons name="server-outline" size={14} color={colors.textMuted} /> Configurar Servidor
                    </Text>
                </TouchableOpacity>

                {showServerConfig && (
                    <View style={{ marginTop: 15, width: '100%' }}>
                        <Text style={{ color: '#888', marginBottom: 5, fontSize: 12 }}>URL del Backend (API):</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#111', borderWidth: 1, borderColor: '#444', borderRadius: 8, paddingHorizontal: 10 }]}
                            placeholder="https://...pinggy.link"
                            placeholderTextColor="#555"
                            value={customServerUrl}
                            onChangeText={setCustomServerUrl}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={{ backgroundColor: '#333', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' }}
                            onPress={() => {
                                if (customServerUrl) {
                                    localStorage.setItem('server_url', customServerUrl);
                                    window.location.reload();
                                }
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Guardar y Recargar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ padding: 10, alignItems: 'center' }}
                            onPress={() => {
                                localStorage.removeItem('server_url');
                                window.location.reload();
                            }}
                        >
                            <Text style={{ color: colors.error, fontSize: 12 }}>Resetear a Default</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={{ marginTop: 20 }}
                    onPress={() => setShowSuperAdmin(true)}
                >
                    <Text style={{ color: '#444', fontSize: 10 }}>Acceso Super Admin (Test)</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    card: {
        width: '90%',
        maxWidth: 400,
        padding: 40,
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: { boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' },
            default: { elevation: 5 }
        })
    },
    logoContainer: { alignItems: 'center', marginBottom: 30 },
    appTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', letterSpacing: -1 },
    title: { fontSize: 18, color: colors.textSecondary, marginBottom: 30, textAlign: 'center' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 15,
        paddingHorizontal: 15
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: 'white',
        ...Platform.select({
            web: { outlineStyle: 'none' }
        })
    },
    eyeIcon: { padding: 5 },
    btn: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        ...Platform.select({
            web: { boxShadow: '0 4px 15px rgba(255, 69, 0, 0.4)' }
        })
    },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    link: { marginTop: 10, textAlign: 'center', color: colors.accent, fontWeight: '600' }
});
