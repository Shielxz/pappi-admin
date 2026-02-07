import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import ImageUploader from '../components/ImageUploader';


import { API_URL as ACTUAL_API_URL, SERVER_URL as BASE_URL, DEFAULT_HEADERS } from '../services/config';

const API_URL = ACTUAL_API_URL + '/menu';

export default function ConfigScreen({ user, restaurant, onRestaurantUpdate }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (restaurant) {
            setName(restaurant.name || '');
            setDescription(restaurant.description || '');
            setCategory(restaurant.category || '');
            setLat(restaurant.lat ? restaurant.lat.toString() : '');
            setLng(restaurant.lng ? restaurant.lng.toString() : '');
            if (restaurant.image_url) {
                // Check if it's a full Cloudinary URL or legacy local path
                const imageUrl = restaurant.image_url.startsWith('http')
                    ? restaurant.image_url
                    : `${BASE_URL}${restaurant.image_url}`;
                setImagePreview(imageUrl);
            }
        }
    }, [restaurant]);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLat(position.coords.latitude.toString());
                    setLng(position.coords.longitude.toString());
                    alert("📍 Ubicación obtenida correctamente");
                },
                (error) => {
                    alert("Error al obtener GPS: " + error.message);
                }
            );
        } else {
            alert("Tu navegador no soporta geolocalización");
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const saveSettings = async () => {
        if (!name) {
            alert('El nombre del restaurante es requerido');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('lat', lat);
            formData.append('lng', lng);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const res = await fetch(`${API_URL}/restaurants/${restaurant.id}`, {
                method: 'PUT',
                headers: DEFAULT_HEADERS,
                body: formData
            });

            if (res.ok) {
                alert('Configuración guardada exitosamente');
                const updatedRestaurant = await res.json();
                onRestaurantUpdate(updatedRestaurant);
            } else {
                const errData = await res.json();
                console.error("❌ Error Server Details:", errData);
                alert('Error al guardar: ' + (errData.error || res.status));
            }
        } catch (e) {
            console.error("❌ Error:", e);
            alert('Error: ' + e.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Configuración del Restaurante</Text>

            <View style={styles.topLayout}>
                <View style={styles.logoSection}>
                    <ImageUploader
                        label="Logo"
                        imagePreview={imagePreview}
                        onImageSelect={(file) => {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                        }}
                        onRemoveImage={() => { setImageFile(null); setImagePreview(null); }}
                        aspectRatio={1}
                        helperText=""
                        compact={true}
                    />
                </View>

                <View style={[styles.section, styles.infoColumn]}>
                    <Text style={styles.label}>Nombre:</Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                        placeholder="Mi Restaurante"
                    />

                    <Text style={[styles.label, { marginTop: 12 }]}>Categoría:</Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor="#666"
                        value={category}
                        onChangeText={setCategory}
                        placeholder="Ej: Comida Mexicana"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Descripción:</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholderTextColor="#666"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe tu restaurante..."
                    multiline
                    numberOfLines={2}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>📍 Ubicación del Negocio (GPS):</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholderTextColor="#666"
                        value={lat}
                        onChangeText={setLat}
                        placeholder="Latitud"
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholderTextColor="#666"
                        value={lng}
                        onChangeText={setLng}
                        placeholder="Longitud"
                        keyboardType="numeric"
                    />
                </View>
                <TouchableOpacity onPress={getCurrentLocation} style={styles.gpsBtn}>
                    <Text style={styles.gpsBtnText}>📡 Usar mi ubicación actual</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
                <Ionicons name="save-outline" size={24} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.saveBtnText}>Guardar Cambios</Text>
            </TouchableOpacity>


            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>ℹ️ Información</Text>
                <Text style={styles.infoText}>• El logo aparecerá en la app del cliente</Text>
                <Text style={styles.infoText}>• La descripción se mostrará en el perfil del restaurante</Text>
                <Text style={styles.infoText}>• La categoría ayuda a clasificar tu negocio</Text>
            </View>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 40, maxWidth: 1000, alignSelf: 'center', width: '100%' },
    header: { fontSize: 36, fontWeight: '800', marginBottom: 30, color: colors.textPrimary, letterSpacing: -0.5 },
    rowContainer: {
        flexDirection: 'row',
        width: '100%'
    },
    topLayout: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
        height: 200 // Fixed height for alignment
    },
    logoSection: {
        width: 200, // Fixed width for logo column
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        justifyContent: 'center',
        alignItems: 'center'
    },
    infoColumn: {
        flex: 1,
        marginBottom: 0, // Reset margin since it's in a row
        justifyContent: 'center',
        paddingVertical: 20
    },
    section: {
        backgroundColor: colors.bgCard,
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: { boxShadow: '0 8px 32px rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' },
            default: { elevation: 2 }
        })
    },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        padding: 12,
        borderRadius: 12,
        fontSize: 15,
        backgroundColor: '#151515',
        color: 'white',
        fontWeight: '500'
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    logoPreview: {
        width: 140, // Smaller preview
        height: 140,
        borderRadius: 16,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    saveBtn: {
        backgroundColor: colors.secondary,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        ...Platform.select({
            web: { boxShadow: '0 8px 20px rgba(0, 230, 118, 0.25)', transition: 'all 0.2s' }
        })
    },
    saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
    gpsBtn: { marginTop: 10, padding: 10, backgroundColor: 'rgba(41, 121, 255, 0.2)', borderRadius: 5, alignItems: 'center' },
    gpsBtnText: { color: colors.accent, fontWeight: 'bold', fontSize: 13 },
    infoSection: {
        backgroundColor: 'rgba(41, 121, 255, 0.08)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(41, 121, 255, 0.15)'
    },
    infoTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: colors.accent },
    infoText: { fontSize: 13, color: colors.textSecondary, marginBottom: 4, lineHeight: 18 }
});

