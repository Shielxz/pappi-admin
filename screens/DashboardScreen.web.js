import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { colors } from '../theme/colors';
import { API_URL, DEFAULT_HEADERS } from '../services/config';
import { Ionicons } from '@expo/vector-icons';

// Custom Glass Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <View style={styles.tooltipContainer}>
                <Text style={styles.tooltipLabel}>{label}</Text>
                <Text style={styles.tooltipValue}>
                    ${payload[0].value.toFixed(2)}
                </Text>
            </View>
        );
    }
    return null;
};


const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DashboardScreen({ user, restaurant }) {
    const [summary, setSummary] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [restaurant.id]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, salesRes, statusRes] = await Promise.all([
                fetch(`${API_URL}/analytics/summary/${restaurant.id}`, { headers: DEFAULT_HEADERS }),
                fetch(`${API_URL}/analytics/sales-chart/${restaurant.id}`, { headers: DEFAULT_HEADERS }),
                fetch(`${API_URL}/analytics/status-distribution/${restaurant.id}`, { headers: DEFAULT_HEADERS })
            ]);

            const summaryJson = await summaryRes.json();
            const salesJson = await salesRes.json();
            const statusJson = await statusRes.json();

            setSummary(summaryJson);
            setSalesData(salesJson);
            setStatusData(statusJson);
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Card Component for Metrics
    const StatCard = ({ title, value, subtext, icon, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statValue}>{value}</Text>
                {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Dashboard General</Text>
            <Text style={styles.pageSubtitle}>Resumen de actividad en tiempo real</Text>

            {/* TOP METRICS ROW */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Ventas Totales"
                    value={`$${summary?.totalSales?.toFixed(2) || '0.00'}`}
                    icon="cash-outline"
                    color="#00E676"
                />
                <StatCard
                    title="Pedidos Totales"
                    value={summary?.totalOrders || 0}
                    icon="receipt-outline"
                    color="#2979FF"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={`$${summary?.avgTicket?.toFixed(2) || '0.00'}`}
                    icon="analytics-outline"
                    color="#FF4500"
                />
                <StatCard
                    title="Pendientes"
                    value={summary?.pendingOrders || 0}
                    icon="time-outline"
                    color="#FFC107"
                />
            </View>

            {/* CHARTS ROW */}
            <View style={styles.chartsRow}>
                {/* SALES AREA CHART */}
                <View style={[styles.chartCard, { flex: 2 }]}>
                    <Text style={styles.chartTitle}>Tendencia de Ventas (30 Días)</Text>
                    <View style={{ height: 300, width: '100%', minHeight: 300 }}>
                        {Platform.OS === 'web' ? (
                            <div style={{ width: '100%', height: 280, overflow: 'hidden' }}>
                                <AreaChart width={600} height={280} data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.5} />
                                            <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                                        </linearGradient>
                                        <filter id="glow" height="130%">
                                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} strokeOpacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke={colors.primary}
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                        filter="url(#glow)"
                                    />
                                </AreaChart>
                            </div>
                        ) : (
                            <Text style={{ color: 'white' }}>Gráfico disponible solo en Web</Text>
                        )}
                    </View>
                </View>

                {/* STATUS PIE CHART */}
                <View style={[styles.chartCard, { flex: 1 }]}>
                    <Text style={styles.chartTitle}>Estado de Pedidos</Text>
                    <View style={{ height: 300, width: '100%', minHeight: 300, justifyContent: 'center', alignItems: 'center' }}>
                        {Platform.OS === 'web' ? (
                            <div style={{ width: 300, height: 280, overflow: 'hidden' }}>
                                <PieChart width={300} height={280}>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={colors.status[entry.rawStatus]?.text || '#888'}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(30,30,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(10px)' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span style={{ color: '#ccc', marginLeft: 5 }}>{value}</span>}
                                    />
                                </PieChart>
                            </div>
                        ) : (
                            <Text style={{ color: 'white' }}>Gráfico disponible solo en Web</Text>
                        )}
                    </View>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 5
    },
    pageSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 30
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: 30
    },
    statCard: {
        flex: 1,
        minWidth: 200,
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        // Glassmorphism logic would go here if using CSS modules, mostly simplified for RN
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }
        })
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    statTitle: {
        color: colors.textSecondary,
        fontSize: 14,
        marginBottom: 4
    },
    statValue: {
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: 'bold'
    },
    chartsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: 50
    },
    chartCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        minWidth: 300,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }
        })
    },
    chartTitle: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20
    },
    tooltipContainer: {
        backgroundColor: 'rgba(30, 30, 30, 0.85)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        // Web shadow
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    },
    tooltipLabel: {
        color: '#ccc',
        fontSize: 12,
        marginBottom: 4
    },
    tooltipValue: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold'
    }
});

