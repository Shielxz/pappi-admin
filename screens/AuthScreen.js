import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../components/CustomAlert';
import { api } from '../services/api';
import VerificationScreen from './VerificationScreen';
import SuperAdminScreen from './SuperAdminScreen';

export default function AuthScreen({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Verification Logic
    const [verificationMode, setVerificationMode] = useState(false);
    const [pendingUserId, setPendingUserId] = useState(null);

    // Manual Server Config
    const [showServerConfig, setShowServerConfig] = useState(false);
    const [customServerUrl, setCustomServerUrl] = useState('');
    const [showSuperAdmin, setShowSuperAdmin] = useState(false);

    // New Rejection Modal State
    const [showRejectedModal, setShowRejectedModal] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
        if (type === 'success') {
            // If it's the codes alert (long message), give more time
            const duration = message.includes('Email:') ? 6000 : 2000;
            setTimeout(() => setAlertConfig(prev => ({ ...prev, visible: false })), duration);
        }
    };

    const RejectedModal = () => (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Ionicons name="alert-circle" size={60} color={colors.primary} />
                <Text style={styles.modalTitle}>Solicitud Rechazada</Text>
                <Text style={styles.modalText}>
                    Lo sentimos, tu solicitud de afiliación no fue aprobada por nuestros administradores.{'\n\n'}
                    Si crees que esto es un error, por favor contacta a soporte.
                </Text>
                <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => setShowRejectedModal(false)}
                >
                    <Text style={styles.modalBtnText}>Entendido</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleAuth = async () => {
        if (!email || !password) return showAlert("Error", "Ingrese todos los campos", "error");
        if (!isLogin) {
            if (!name || !phone || !confirmPassword) return showAlert("Error", "Ingrese todos los campos", "error");
            if (password !== confirmPassword) return showAlert("Error", "Las contraseñas no coinciden", "error");
        }

        setLoading(true);
        try {
            if (isLogin) {
                const res = await api.login(email, password);
                console.log("🔐 ADMIN LOGIN ATTEMPT:", res);
                if (res.user.role === 'admin' || res.user.role === 'superadmin') {
                    onLoginSuccess(res.user, res.token);
                } else {
                    showAlert("Acceso Denegado", "No tienes permisos de administrador", "error");
                }
            } else {
                const res = await api.registerV2(name, email, password, phone, name); // Assuming 'name' is also restaurantName
                console.log("CODES:", res);

                // USER REQUEST: Show codes in alert since email/sms service isn't active yet
                if (res.emailCode || res.smsCode) {
                    showAlert("Códigos de Prueba", `Email: ${res.emailCode}\nSMS: ${res.smsCode}`, "success");
                }

                setPendingUserId(res.userId);
                // Delay verification mode specific to this flow so they can read the codes?
                // User said: "metelos esos si en un alert comun y corriente"
                // The auto-close is 2s (success type). Maybe too fast for codes?
                // Let's make it a distinct alert or rely on the user to remember.
                // Better: Pass codes to VerificationScreen as initial values? No, that defeats the purpose.
                // Just delay transition slightly longer.
                setTimeout(() => setVerificationMode(true), 4000); // 4s to read codes
            }
        } catch (e) {
            const errorData = e.data || {};
            const errorCode = e.code || errorData.code;

            // Only log as error if it's an unexpected crash. Business logic rejections are just info.
            if (errorCode === 'REJECTED' || errorCode === 'NOT_VERIFIED' || errorCode === 'PENDING_APPROVAL') {
                console.log(`ℹ️ Auth Info: ${e.message} (Code: ${errorCode})`);
            } else {
                console.error(e);
            }

            if (errorCode === 'NOT_VERIFIED' && (e.userId || errorData.userId)) {
                showAlert("Cuenta no verificada", "Redirigiendo a verificación...", "info");
                setPendingUserId(e.userId || errorData.userId);
                setTimeout(() => setVerificationMode(true), 1500);
            } else if (errorCode === 'PENDING_APPROVAL') {
                showAlert("Pendiente", "Cuenta en revisión por el administrador.", "info");
            } else if (errorCode === 'REJECTED') {
                setShowRejectedModal(true);
            } else {
                showAlert("Error", e.message || "Ocurrió un error inesperado", "error");
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
                email={email} // Passing email here
                onVerified={() => {
                    setVerificationMode(false);
                    showAlert("Verificado", "Esperando aprobación.", "success");
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
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
            {showRejectedModal && <RejectedModal />}
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

                {!isLogin && (
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar Contraseña"
                            placeholderTextColor={colors.textMuted}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            onKeyPress={(e) => {
                                if (e.nativeEvent.key === 'Enter') {
                                    handleAuth();
                                }
                            }}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
                    <Text style={styles.btnText}>{isLogin ? "Iniciar Sesión" : "Crear Cuenta PENDIENTE"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ padding: 10 }}>
                    <Text style={styles.link}>
                        {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entrar"}
                    </Text>
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
    link: { marginTop: 10, textAlign: 'center', color: colors.accent, fontWeight: '600' },

    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)', // Darker overlay focus
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    modalContent: {
        width: '85%',
        maxWidth: 350,
        backgroundColor: '#252525', // Slightly lighter for contrast
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary, // Orange glow
        ...Platform.select({
            web: { boxShadow: '0 0 20px rgba(255, 69, 0, 0.3)' }, // Glow effect
            default: { elevation: 10 }
        })
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white', // White title pops more vs red
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center'
    },
    modalText: {
        color: '#dddddd',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 25
    },
    modalBtn: {
        backgroundColor: colors.primary, // Action color
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        ...Platform.select({
            web: { cursor: 'pointer' }
        })
    },
    modalBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});
