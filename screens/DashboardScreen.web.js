import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Dimensions, TouchableOpacity } from 'react-native';
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
    const [timeRange, setTimeRange] = useState('today'); // 'today' | 'all'

    useEffect(() => {
        fetchDashboardData();
    }, [restaurant.id, timeRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, salesRes, statusRes] = await Promise.all([
                fetch(`${API_URL}/analytics/summary/${restaurant.id}?range=${timeRange}`, { headers: DEFAULT_HEADERS }),
                fetch(`${API_URL}/analytics/sales-chart/${restaurant.id}?range=${timeRange}`, { headers: DEFAULT_HEADERS }),
                fetch(`${API_URL}/analytics/status-distribution/${restaurant.id}?range=${timeRange}`, { headers: DEFAULT_HEADERS })
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
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <View>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statValue}>{value}</Text>
                {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
            </View>
        </View>
    );

    const CustomLegend = ({ payload }) => {
        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
                {payload.map((entry, index) => (
                    <View key={`legend-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: entry.color, marginRight: 5 }} />
                        <Text style={{ color: '#ccc', fontSize: 12 }}>
                            {entry.value} <Text style={{ fontWeight: 'bold', color: 'white' }}>({entry.payload.value})</Text>
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.pageTitle}>Dashboard General</Text>
                    <Text style={styles.pageSubtitle}>Resumen de actividad en tiempo real</Text>
                </View>

                {/* DATE FILTERS */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterBtn, timeRange === 'today' && styles.filterBtnActive]}
                        onPress={() => setTimeRange('today')}
                    >
                        <Text style={[styles.filterText, timeRange === 'today' && styles.filterTextActive]}>Hoy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, timeRange === 'all' && styles.filterBtnActive]}
                        onPress={() => setTimeRange('all')}
                    >
                        <Text style={[styles.filterText, timeRange === 'all' && styles.filterTextActive]}>Histórico</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* TOP METRICS ROW */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Ventas Totales"
                    value={`$${summary?.totalSales?.toFixed(2) || '0.00'}`}
                    icon="cash-outline"
                    color="#00E676"
                />
                <StatCard
                    title="Pedidos"
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
                    <View style={{ height: 350, width: '100%' }}>
                        {Platform.OS === 'web' ? (
                            salesData && salesData.length > 0 ? (
                                <div style={{ width: '100%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#666"
                                                tick={{ fill: '#888', fontSize: 11 }}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                                tickFormatter={(str) => {
                                                    const date = new Date(str);
                                                    return `${date.getDate()}/${date.getMonth() + 1}`;
                                                }}
                                            />
                                            <YAxis
                                                stroke="#666"
                                                tick={{ fill: '#888', fontSize: 11 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                            <Area
                                                type="monotone"
                                                dataKey="sales"
                                                stroke={colors.primary}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorSales)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <View style={styles.emptyChart}>
                                    <Ionicons name="trending-up-outline" size={48} color="#333" />
                                    <Text style={styles.emptyChartText}>Sin datos para mostrar</Text>
                                </View>
                            )
                        ) : (
                            <Text style={{ color: 'white' }}>Gráfico solo Web</Text>
                        )}
                    </View>
                </View>

                {/* STATUS PIE CHART */}
                <View style={[styles.chartCard, { flex: 1 }]}>
                    <Text style={styles.chartTitle}>{timeRange === 'today' ? 'Estado de Pedidos (Hoy)' : 'Estado Histórico'}</Text>
                    <View style={{ height: 350, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        {Platform.OS === 'web' ? (
                            statusData && statusData.length > 0 ? (
                                <div style={{ width: '100%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={80}
                                                outerRadius={110}
                                                paddingAngle={4}
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
                                                contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: 8 }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => [`${value} pedidos`]}
                                            />
                                            <Legend content={<CustomLegend />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <View style={styles.emptyChart}>
                                    <Ionicons name="pie-chart-outline" size={48} color="#333" />
                                    <Text style={styles.emptyChartText}>Sin pedidos hoy</Text>
                                </View>
                            )
                        ) : (
                            <Text style={{ color: 'white' }}>Gráfico solo Web</Text>
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
        padding: 40, // Increased padding for clearer layout
        maxWidth: 1600,
        alignSelf: 'center',
        width: '100%'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
        flexWrap: 'wrap',
        gap: 20
    },
    pageTitle: {
        fontSize: 36,
        fontWeight: '800', // Bolder title
        color: colors.textPrimary,
        marginBottom: 8,
        letterSpacing: -0.5
    },
    pageSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: colors.bgCard,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.glassBorder
    },
    filterBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    filterBtnActive: {
        backgroundColor: colors.primary, // Highlight active
    },
    filterText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 14
    },
    filterTextActive: {
        color: 'white'
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24, // Consistent spacing
        marginBottom: 40
    },
    statCard: {
        flex: 1,
        minWidth: 240,
        backgroundColor: colors.bgCard,
        borderRadius: 20, // Softer corners
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: {
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', // Deeper shadow
                backdropFilter: 'blur(12px)'
            }
        })
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    statTitle: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    statValue: {
        color: colors.textPrimary,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: -0.5
    },
    chartsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        marginBottom: 50
    },
    chartCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        minWidth: 350,
        ...Platform.select({
            web: {
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(12px)'
            }
        })
    },
    chartTitle: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 24
    },
    tooltipContainer: {
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    tooltipLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4
    },
    tooltipValue: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold'
    },
    emptyChart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
        opacity: 0.5
    },
    emptyChartText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
        fontWeight: '600'
    }
});

