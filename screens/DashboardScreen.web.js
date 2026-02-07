import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Dimensions, TouchableOpacity, useWindowDimensions } from 'react-native';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { colors } from '../theme/colors';
import { API_URL, DEFAULT_HEADERS } from '../services/config';
import { Ionicons } from '@expo/vector-icons';

// Custom Glass Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <View style={[styles.tooltipContainer, { backgroundColor: '#1E1E1E' }]}>
                <Text style={[styles.tooltipLabel, { color: '#ccc' }]}>{label}</Text>
                <Text style={[styles.tooltipValue, { color: '#fff' }]}>
                    ${payload[0].value.toFixed(2)}
                </Text>
            </View>
        );
    }
    return null;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DashboardScreen({ user, restaurant }) {
    const { width: windowWidth } = useWindowDimensions();
    const isMobile = windowWidth < 768;
    const [summary, setSummary] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Filter States
    const [timeRange, setTimeRange] = useState('today'); // 'today' | 'week' | 'month' | 'year' | 'range'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, [restaurant.id, timeRange, customStartDate, customEndDate]);

    const handleRangeChange = (range) => {
        setTimeRange(range);
        if (range !== 'range') {
            setCustomStartDate('');
            setCustomEndDate('');
        }
    };

    const getChartTitle = () => {
        switch (timeRange) {
            case 'today': return 'Tendencia de Ventas (Hoy)';
            case 'week': return 'Tendencia de Ventas (Esta Semana)';
            case 'month': return 'Tendencia de Ventas (Este Mes)';
            case 'year': return 'Tendencia de Ventas (Este Año)';
            case 'range': return `Tendencia de Ventas (${customStartDate} - ${customEndDate})`;
            default: return 'Tendencia de Ventas';
        }
    };

    const fetchDashboardData = async () => {
        try {
            // Determine query params
            let query = `?range=${timeRange}`;
            if (timeRange === 'range' && customStartDate && customEndDate) {
                query += `&start=${customStartDate}&end=${customEndDate}`;
            }

            if (!initialLoadDone) setLoading(true);
            const [summaryRes, salesRes, statusRes] = await Promise.all([
                fetch(`${API_URL}/analytics/summary/${restaurant.id}${query}`, { headers: DEFAULT_HEADERS }),
                fetch(`${API_URL}/analytics/sales-chart/${restaurant.id}${query}`, { headers: DEFAULT_HEADERS }),
                fetch(`${API_URL}/analytics/status-distribution/${restaurant.id}${query}`, { headers: DEFAULT_HEADERS })
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
            if (!initialLoadDone) setInitialLoadDone(true);
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

    // Render Center Label for Donut
    const renderCustomizedLabel = ({ cx, cy }) => {
        return (
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill="white" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {summary?.totalOrders || 0}
            </text>
        );
    };

    return (
        <ScrollView style={[styles.container, isMobile && { padding: 16 }]} showsVerticalScrollIndicator={false}>
            <View style={[styles.headerRow, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                <View>
                    <Text style={[styles.pageTitle, isMobile && { fontSize: 24 }]}>Dashboard General</Text>
                    <Text style={styles.pageSubtitle}>Resumen de actividad en tiempo real</Text>
                </View>

                {/* ADVANCED FILTERS */}
                <View style={[styles.filterContainer, isMobile && { flexWrap: 'wrap' }]}>
                    {['today', 'week', 'month'].map((range) => (
                        <TouchableOpacity
                            key={range}
                            style={[styles.filterBtn, timeRange === range && styles.filterBtnActive]}
                            onPress={() => handleRangeChange(range)}
                        >
                            <Text style={[styles.filterText, timeRange === range && styles.filterTextActive]}>
                                {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {/* Range Picker - Styled for Dark Mode */}
                    {!isMobile && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 10 }}>
                            <Text style={{ color: '#888', marginRight: 8, fontSize: 12, fontWeight: '600' }}>Desde:</Text>
                            <input
                                type="date"
                                value={customStartDate}
                                style={{
                                    background: '#333',
                                    border: '1px solid #444',
                                    color: 'white',
                                    fontSize: 12,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    colorScheme: 'dark'
                                }}
                                onChange={(e) => {
                                    setCustomStartDate(e.target.value);
                                    if (e.target.value) setTimeRange('range');
                                }}
                            />
                            <Text style={{ color: '#888', marginHorizontal: 8, fontSize: 12, fontWeight: '600' }}>Hasta:</Text>
                            <input
                                type="date"
                                value={customEndDate}
                                style={{
                                    background: '#333',
                                    border: '1px solid #444',
                                    color: 'white',
                                    fontSize: 12,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    colorScheme: 'dark'
                                }}
                                onChange={(e) => {
                                    setCustomEndDate(e.target.value);
                                    if (e.target.value) setTimeRange('range');
                                }}
                            />
                        </View>
                    )}
                </View>
            </View>

            {/* DATE RANGE INPUTS - Mobile friendly */}
            {isMobile && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    <View style={{ flex: 1, minWidth: 120 }}>
                        <Text style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Desde:</Text>
                        <input
                            type="date"
                            value={customStartDate}
                            style={{
                                background: '#222',
                                border: '1px solid #333',
                                color: 'white',
                                fontSize: 13,
                                padding: '8px 10px',
                                borderRadius: '8px',
                                outline: 'none',
                                colorScheme: 'dark',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                            onChange={(e) => {
                                setCustomStartDate(e.target.value);
                                if (e.target.value) setTimeRange('range');
                            }}
                        />
                    </View>
                    <View style={{ flex: 1, minWidth: 120 }}>
                        <Text style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Hasta:</Text>
                        <input
                            type="date"
                            value={customEndDate}
                            style={{
                                background: '#222',
                                border: '1px solid #333',
                                color: 'white',
                                fontSize: 13,
                                padding: '8px 10px',
                                borderRadius: '8px',
                                outline: 'none',
                                colorScheme: 'dark',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                            onChange={(e) => {
                                setCustomEndDate(e.target.value);
                                if (e.target.value) setTimeRange('range');
                            }}
                        />
                    </View>
                </View>
            )}

            {/* TOP METRICS ROW */}
            <View style={[styles.statsGrid, isMobile && { gap: 12 }]}>
                <StatCard title="Ventas Totales" value={`$${summary?.totalSales?.toFixed(2) || '0.00'}`} icon="cash-outline" color="#00E676" />
                <StatCard title="Pedidos" value={summary?.totalOrders || 0} icon="receipt-outline" color="#2979FF" />
                <StatCard title="Ticket Promedio" value={`$${summary?.avgTicket?.toFixed(2) || '0.00'}`} icon="analytics-outline" color="#FF4500" />
                <StatCard title="Pendientes" value={summary?.pendingOrders || 0} icon="time-outline" color="#FFC107" />
            </View>

            {/* CHARTS ROW */}
            <View style={[styles.chartsRow, isMobile && { flexDirection: 'column', gap: 16 }]}>
                {/* SALES AREA CHART */}
                <View style={[styles.chartCard, { flex: 2 }, isMobile && { minWidth: 0, padding: 12 }]}>
                    <Text style={styles.chartTitle}>{getChartTitle()}</Text>
                    <View style={{ height: isMobile ? 220 : 350, width: '100%' }}>
                        {Platform.OS === 'web' ? (
                            <div style={{ width: '100%', height: '100%' }}>
                                <ResponsiveContainer width={isMobile ? '100%' : 600} height={isMobile ? 200 : 320}>
                                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} dy={10}
                                            tickFormatter={(str) => {
                                                const date = new Date(str);
                                                return `${date.getDate()}/${date.getMonth() + 1}`;
                                            }}
                                        />
                                        <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                        <Area type="monotone" dataKey="sales" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : null}
                    </View>
                </View>

                {/* STATUS DONUT CHART */}
                <View style={[styles.chartCard, { flex: 1 }, isMobile && { minWidth: 0, padding: 12 }]}>
                    <Text style={styles.chartTitle}>Estado de Pedidos</Text>
                    <View style={{ height: isMobile ? 250 : 350, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        {Platform.OS === 'web' ? (
                            <div style={{ width: '100%', height: '100%' }}>
                                <ResponsiveContainer width={isMobile ? '100%' : 300} height={isMobile ? 230 : 320}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={colors.status[entry.rawStatus]?.text || '#888'} />
                                            ))}
                                            {/* Label logic would go here if Recharts supported component as label easily, 
                                                    but we render text manually centered via absolute position or pure SVG text if needed. 
                                                    Since Recharts makes it hard to mix SVG text inside, we can just overlay standard RN View if we want 
                                                    or use the Label component. */}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333' }} itemStyle={{ color: '#fff' }} />
                                        <Legend verticalAlign="bottom" height={36} />
                                        {/* Center Label for Total */}
                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 24, fontWeight: 'bold', fill: 'white' }}>
                                            {summary?.totalOrders || 0}
                                        </text>
                                        <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 14, fill: '#888' }}>
                                            Total
                                        </text>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : null}
                    </View>
                </View>
            </View>


        </ScrollView >
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

