import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function SuperAdminScreen({ onExit }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const data = await api.getPendingUsers();
            setUsers(data);
        } catch (e) {
            alert("Error fetching users: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await api.approveUser(userId);
            alert("Usuario Aprobado");
            fetchPending();
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    const handleReject = async (userId) => {
        try {
            await api.rejectUser(userId);
            alert("Usuario Rechazado");
            fetchPending();
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userDetail}>{item.restaurant_name}</Text>
                <Text style={styles.userDetail}>{item.email}</Text>
                <Text style={styles.userDetail}>{item.phone}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.role}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleApprove(item.id)}>
                    <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleReject(item.id)}>
                    <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onExit} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Super Admin - Aprobaciones</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No hay usuarios pendientes</Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20
    },
    backBtn: {
        padding: 10,
        marginRight: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white'
    },
    listContent: {
        paddingBottom: 50
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#333'
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4
    },
    userDetail: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 2
    },
    badge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 5
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        textTransform: 'uppercase'
    },
    actions: {
        flexDirection: 'row',
        gap: 10
    },
    btn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btnApprove: {
        backgroundColor: colors.success
    },
    btnReject: {
        backgroundColor: colors.error
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16
    }
});
