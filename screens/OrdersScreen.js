import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import io from 'socket.io-client';

const API_URL = 'http://192.168.1.92:3000/api/orders';
const SOCKET_URL = 'http://192.168.1.92:3000';

export default function OrdersScreen({ user, restaurant }) {
    const [orders, setOrders] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        loadOrders();

        // Connect socket
        const newSocket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
        newSocket.on('connect', () => {
            console.log('Socket conectado');
            newSocket.emit('register_admin', { restaurantId: restaurant.id });
        });

        newSocket.on('new_order', (orderData) => {
            console.log('Nuevo pedido recibido:', orderData);
            alert(`¡Nuevo Pedido! $${orderData.totalPrice}`);
            loadOrders();
        });

        newSocket.on('driver_assigned_admin', ({ orderId, driverName }) => {
            console.log('Repartidor asignado:', driverName);
            alert(`Repartidor Asignado: ${driverName} va a recoger el pedido`);
            loadOrders();
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, [restaurant.id]);

    const loadOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/${restaurant.id}`);
            const data = await res.json();
            setOrders(data.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'));
        } catch (e) {
            console.error(e);
        }
    };

    const confirmOrder = async (orderId) => {
        const time = window.prompt("Tiempo estimado en minutos:", "30");
        if (!time) return;

        try {
            await fetch(`${API_URL}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CONFIRMED', estimated_time: parseInt(time) })
            });

            socket.emit('confirm_order', { orderId, estimatedTime: parseInt(time) });
            console.log('Emitido confirm_order para pedido:', orderId);
            alert(`Pedido confirmado. Tiempo: ${time}min`);
            loadOrders();
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    const markReady = async (orderId) => {
        const confirmed = window.confirm("¿El pedido está listo para recoger?");
        if (!confirmed) return;

        try {
            await fetch(`${API_URL}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'READY' })
            });

            socket.emit('mark_ready', { orderId });
            console.log('Emitido mark_ready para pedido:', orderId);
            alert("Se notificó a repartidores disponibles");
            loadOrders();
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    const groupedOrders = orders.reduce((acc, order) => {
        if (!acc[order.status]) acc[order.status] = [];
        acc[order.status].push(order);
        return acc;
    }, {});

    const getStatusText = (status) => {
        const map = {
            'PENDING': '⏳ Pendiente',
            'CONFIRMED': '✅ Confirmado',
            'READY': '📦 Listo',
            'DRIVER_ASSIGNED': '🛵 Repartidor Asignado',
            'PICKED_UP': '🚚 En Camino'
        };
        return map[status] || status;
    };

    const getStatusColor = (status) => {
        const map = {
            'PENDING': '#FF9800',
            'CONFIRMED': '#4CAF50',
            'READY': '#2196F3',
            'DRIVER_ASSIGNED': '#9C27B0',
            'PICKED_UP': '#FF5722'
        };
        return map[status] || '#999';
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Pedidos Activos</Text>

            {Object.keys(groupedOrders).length === 0 && (
                <Text style={styles.emptyText}>No hay pedidos activos</Text>
            )}

            {Object.keys(groupedOrders).map(status => (
                <View key={status} style={styles.section}>
                    <Text style={[styles.statusHeader, { color: getStatusColor(status) }]}>
                        {getStatusText(status)} ({groupedOrders[status].length})
                    </Text>

                    {groupedOrders[status].map(order => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>Pedido #{order.id}</Text>
                                <Text style={styles.orderPrice}>${order.total_price}</Text>
                            </View>

                            <Text style={styles.orderAddress}>📍 {order.delivery_address}</Text>

                            {order.estimated_time && (
                                <Text style={styles.orderTime}>⏱️ {order.estimated_time} min</Text>
                            )}

                            {order.driver_name && (
                                <Text style={styles.driverInfo}>🛵 {order.driver_name}</Text>
                            )}

                            <View style={styles.orderActions}>
                                {order.status === 'PENDING' && (
                                    <TouchableOpacity
                                        style={[styles.btn, { backgroundColor: '#4CAF50' }]}
                                        onPress={() => confirmOrder(order.id)}
                                    >
                                        <Text style={styles.btnText}>Confirmar</Text>
                                    </TouchableOpacity>
                                )}

                                {order.status === 'CONFIRMED' && (
                                    <TouchableOpacity
                                        style={[styles.btn, { backgroundColor: '#2196F3' }]}
                                        onPress={() => markReady(order.id)}
                                    >
                                        <Text style={styles.btnText}>Marcar Listo</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 50 },
    section: { marginBottom: 25 },
    statusHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    orderCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontSize: 16, fontWeight: 'bold' },
    orderPrice: { fontSize: 18, fontWeight: 'bold', color: '#FF4500' },
    orderAddress: { fontSize: 14, color: '#666', marginBottom: 5 },
    orderTime: { fontSize: 14, color: '#4CAF50', marginBottom: 5 },
    driverInfo: { fontSize: 14, color: '#9C27B0', fontWeight: '600', marginBottom: 10 },
    orderActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    btn: { flex: 1, padding: 10, borderRadius: 5, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});
