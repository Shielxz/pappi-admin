import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function VerificationScreen({ userId, email, onVerified, onCancel }) {
    const [emailCode, setEmailCode] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!emailCode || !smsCode) return Alert.alert("Error", "Ingrese ambos códigos de verificación");

        setLoading(true);
        try {
            const res = await api.verify(userId, emailCode, smsCode, email);

            // If verification successful, show success and callback
            if (Platform.OS === 'web') {
                // Non-blocking alert on web if possible, or standard alert
                alert("✅ " + res.message);
            } else {
                Alert.alert("Verificación Exitosa", res.message);
            }
            onVerified();
        } catch (e) {
            const msg = e.message || "Error de verificación";
            if (Platform.OS === 'web') alert("❌ " + msg);
            else Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <Text style={styles.appTitle}>Verificación de Cuenta</Text>
                    <Text style={styles.subtitle}>Ingrese los códigos enviados a su correo y teléfono (MOCK: ver consola backend)</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="mail-unread-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Código Email (6 dígitos)"
                        placeholderTextColor={colors.textMuted}
                        value={emailCode}
                        onChangeText={setEmailCode}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Código SMS (6 dígitos)"
                        placeholderTextColor={colors.textMuted}
                        value={smsCode}
                        onChangeText={setSmsCode}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Verificar Cuenta</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={onCancel} style={{ padding: 10, marginTop: 10 }}>
                    <Text style={styles.link}>Cancelar / Regresar</Text>
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
    appTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 10 },
    subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
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
    btn: {
        backgroundColor: colors.secondary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        ...Platform.select({
            web: { boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)' }
        })
    },
    btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    link: { textAlign: 'center', color: colors.accent, fontWeight: '600' }
});
