import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import io from 'socket.io-client';

import { API_URL, SOCKET_URL, DEFAULT_HEADERS } from '../services/config';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';


const ACTUAL_API_URL = `${API_URL}/orders`;
const ACTUAL_SOCKET_URL = SOCKET_URL;

export default function OrdersScreen({ user, restaurant, socket }) {
    const [orders, setOrders] = useState([]);
    console.log(`[OrdersScreen] Renderizando... Restaurante ID: ${restaurant.id}, Socket: ${socket ? 'Conectado' : 'Nulo'}`);

    useEffect(() => {
        console.log(`[OrdersScreen] Montado/Actualizado. Cargando pedidos...`);
        loadOrders();

        // Polling fallback every 15s due to tunnel instability
        const interval = setInterval(loadOrders, 15000);

        if (socket) {
            const handleNewOrder = (orderData) => {
                console.log('Nuevo pedido recibido:', orderData);
                loadOrders();
            };

            const handleDriverAssigned = ({ orderId, driverName }) => {
                console.log('Repartidor asignado:', driverName);
                loadOrders();

            };

            socket.on('new_order', handleNewOrder);
            socket.on('driver_assigned_admin', handleDriverAssigned);
            socket.on('order_picked_up_admin', loadOrders);
            socket.on('order_completed', loadOrders);

            return () => {
                clearInterval(interval);
                socket.off('new_order', handleNewOrder);
                socket.off('driver_assigned_admin', handleDriverAssigned);
                socket.off('order_picked_up_admin', loadOrders);
                socket.off('order_completed', loadOrders);
            };
        }

        return () => clearInterval(interval);
    }, [restaurant.id, socket]);



    const loadOrders = async () => {
        const url = `${ACTUAL_API_URL}/${restaurant.id}`;
        console.log(`📡 [OrdersScreen] Fetching: ${url}`);
        try {
            const res = await fetch(url, { headers: DEFAULT_HEADERS });
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            const data = await res.json();
            console.log(`📦 [OrdersScreen] Recibidos ${data.length} pedidos totales`);

            const activeOrders = data.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
            console.log(`📋 [OrdersScreen] Pedidos activos a mostrar: ${activeOrders.length}`);
            setOrders(activeOrders);
        } catch (e) {
            console.error("❌ [OrdersScreen] Error:", e);
        }
    };


    const confirmOrder = async (orderId) => {
        const time = window.prompt("Tiempo estimado en minutos:", "30");
        if (!time) return;

        try {
            await fetch(`${ACTUAL_API_URL}/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...DEFAULT_HEADERS
                },
                body: JSON.stringify({ status: 'CONFIRMED', estimated_time: parseInt(time) })
            });

            socket.emit('confirm_order', { orderId, estimatedTime: parseInt(time) });
            console.log('Emitido confirm_order para pedido:', orderId);
            loadOrders();
        } catch (e) {
            console.error("Error confirmOrder:", e);
        }
    };

    const markReady = async (orderId) => {
        const confirmed = window.confirm("¿El pedido está listo para recoger?");
        if (!confirmed) return;

        try {
            await fetch(`${ACTUAL_API_URL}/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...DEFAULT_HEADERS
                },
                body: JSON.stringify({ status: 'READY' })
            });

            socket.emit('mark_ready', { orderId });
            console.log('Emitido mark_ready para pedido:', orderId);
            loadOrders();
        } catch (e) {
            console.error("Error markReady:", e);
        }
    };

    const cancelOrder = async (orderId) => {
        const confirmed = window.confirm("¿Seguro que quieres cancelar este pedido? Se eliminará de la vista de todos.");
        if (!confirmed) return;

        try {
            await fetch(`${ACTUAL_API_URL}/cancel/${orderId}`, {
                method: 'POST',
                headers: DEFAULT_HEADERS
            });
            loadOrders();
        } catch (e) {
            console.error("Error cancelOrder:", e);
        }
    };

    const groupedOrders = orders.reduce((acc, order) => {
        if (!acc[order.status]) acc[order.status] = [];
        acc[order.status].push(order);
        return acc;
    }, {});

    const getStatusText = (status) => {
        const map = {
            'PENDING': 'Pendiente',
            'CONFIRMED': 'Confirmado',
            'READY': 'Listo',
            'DRIVER_ASSIGNED': 'Asignado',
            'PICKED_UP': 'En Camino'
        };
        return map[status] || status;
    };


    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
                <Text style={styles.pageTitle}>Gestión de Pedidos</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={loadOrders}>
                    <Ionicons name="refresh" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {Object.keys(groupedOrders).length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No hay pedidos activos</Text>
                </View>
            )}

            {Object.keys(groupedOrders).map(status => (
                <View key={status} style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={{
                            width: 12, height: 12, borderRadius: 6, marginRight: 10,
                            backgroundColor: colors.status[status]?.text || '#888'
                        }} />
                        <Text style={styles.statusHeader}>
                            {getStatusText(status)} <Text style={{ color: colors.textSecondary }}>({groupedOrders[status].length})</Text>
                        </Text>
                    </View>

                    <View style={styles.grid}>
                        {groupedOrders[status].map(order => (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderId}>#{order.id}</Text>
                                        <Text style={styles.orderTimeAgo}>Hace {Math.floor((new Date() - new Date(order.created_at || Date.now())) / 60000)} min</Text>
                                    </View>
                                    <Text style={styles.orderPrice}>${order.total_price}</Text>
                                </View>

                                <View style={styles.orderBody}>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="location-outline" size={16} color={colors.textSecondary} style={{ marginRight: 5 }} />
                                        <Text style={styles.orderAddress} numberOfLines={2}>{order.delivery_address}</Text>
                                    </View>

                                    {/* Order Items */}
                                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#333' }}>
                                        {(() => {
                                            try {
                                                const items = JSON.parse(order.items || '[]');
                                                return items.map((item, idx) => (
                                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <Text style={{ color: '#ddd', fontSize: 13 }}>
                                                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{item.quantity}x </Text>
                                                            {item.name}
                                                        </Text>
                                                    </View>
                                                ));
                                            } catch (e) {
                                                return <Text style={{ color: colors.error, fontSize: 12 }}>Error items</Text>;
                                            }
                                        })()}
                                    </View>

                                    {order.estimated_time && (
                                        <View style={[styles.infoRow, { marginTop: 10 }]}>
                                            <Ionicons name="time-outline" size={16} color={colors.accent} style={{ marginRight: 5 }} />
                                            <Text style={{ color: colors.accent, fontWeight: '600' }}>{order.estimated_time} min</Text>
                                        </View>
                                    )}
                                    {order.driver_name && (
                                        <View style={styles.infoRow}>
                                            <Ionicons name="bicycle-outline" size={16} color={colors.primary} style={{ marginRight: 5 }} />
                                            <Text style={{ color: colors.primary, fontWeight: '600' }}>{order.driver_name}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.orderActions}>
                                    {order.status === 'PENDING' && (
                                        <TouchableOpacity
                                            style={[styles.btn, { backgroundColor: colors.secondary }]}
                                            onPress={() => confirmOrder(order.id)}
                                        >
                                            <Text style={styles.btnText}>Aceptar</Text>
                                        </TouchableOpacity>
                                    )}

                                    {order.status === 'CONFIRMED' && (
                                        <TouchableOpacity
                                            style={[styles.btn, { backgroundColor: colors.accent }]}
                                            onPress={() => markReady(order.id)}
                                        >
                                            <Text style={styles.btnText}>Listo</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.btnOutline]}
                                        onPress={() => cancelOrder(order.id)}
                                    >
                                        <Text style={[styles.btnText, { color: colors.danger }]}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 30 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: colors.textPrimary },
    refreshBtn: {
        padding: 10,
        backgroundColor: colors.bgCard,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: colors.glassBorder
    },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, color: colors.textMuted, marginTop: 20 },
    section: { marginBottom: 40 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    statusHeader: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20
    },
    orderCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 20,
        width: Platform.OS === 'web' ? 300 : '100%',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
        })
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' },
    orderId: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    orderTimeAgo: { fontSize: 12, color: colors.textMuted },
    orderPrice: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    orderBody: { marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    orderAddress: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    orderActions: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    btnOutline: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.danger
    },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});

