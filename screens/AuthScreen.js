import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function AuthScreen({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for register
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) return Alert.alert("Error", "Campos vacíos");
        if (!isLogin && !name) return Alert.alert("Error", "Nombre requerido");

        setLoading(true);
        try {
            if (isLogin) {
                const res = await api.login(email, password);
                Alert.alert("Bienvenido", `Hola ${res.user.name}`);
                onLoginSuccess(res.user, res.token);
            } else {
                await api.register(name, email, password, 'admin');
                Alert.alert("Éxito", "Cuenta creada. Ahora inicia sesión.");
                setIsLogin(true);
            }
        } catch (e) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>{isLogin ? "👨‍🍳 Iniciar Sesión" : "📝 Registrar Negocio"}</Text>

                {!isLogin && (
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre del Restaurante"
                        value={name}
                        onChangeText={setName}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Correo Electrónico"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{isLogin ? "Entrar" : "Registrarse"}</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                    <Text style={styles.link}>
                        {isLogin ? "¿Nuevo aquí? Crea una cuenta" : "¿Ya tienes cuenta? Inicia sesión"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    card: { width: 350, padding: 20, backgroundColor: 'white', borderRadius: 10, shadowOpacity: 0.1, shadowRadius: 10 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#FF4500' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5, fontSize: 16 },
    btn: { backgroundColor: '#FF4500', padding: 12, borderRadius: 5, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    link: { marginTop: 15, textAlign: 'center', color: '#007AFF' }
});
