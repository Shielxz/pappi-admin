import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';

const API_URL = 'http://192.168.1.92:3000/api/menu';

export default function ConfigScreen({ user, restaurant, onRestaurantUpdate }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (restaurant) {
            setName(restaurant.name || '');
            setDescription(restaurant.description || '');
            setCategory(restaurant.category || '');
            if (restaurant.image_url) {
                setImagePreview(`http://192.168.1.92:3000${restaurant.image_url}`);
            }
        }
    }, [restaurant]);

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

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const res = await fetch(`${API_URL}/restaurants/${restaurant.id}`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                alert('Configuración guardada exitosamente');
                const updatedRestaurant = await res.json();
                onRestaurantUpdate(updatedRestaurant);
            } else {
                alert('Error al guardar la configuración');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Configuración del Restaurante</Text>

            <View style={styles.section}>
                <Text style={styles.label}>Logo del Restaurante:</Text>
                {imagePreview && (
                    <Image source={{ uri: imagePreview }} style={styles.logoPreview} />
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ marginBottom: 20, marginTop: 10 }}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Nombre del Restaurante:</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Mi Restaurante"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Descripción:</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe tu restaurante..."
                    multiline
                    numberOfLines={4}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Categoría:</Text>
                <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Ej: Comida Mexicana, Fast Food, etc."
                />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
                <Text style={styles.saveBtnText}>💾 Guardar Cambios</Text>
            </TouchableOpacity>

            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>ℹ️ Información</Text>
                <Text style={styles.infoText}>• El logo aparecerá en la app del cliente</Text>
                <Text style={styles.infoText}>• La descripción se mostrará en el perfil del restaurante</Text>
                <Text style={styles.infoText}>• La categoría ayuda a clasificar tu negocio</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    section: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#f9f9f9'
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    logoPreview: {
        width: 200,
        height: 150,
        borderRadius: 10,
        marginBottom: 10,
        resizeMode: 'cover'
    },
    saveBtn: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20
    },
    saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    infoSection: {
        backgroundColor: '#E3F2FD',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30
    },
    infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#1976D2' },
    infoText: { fontSize: 14, color: '#555', marginBottom: 5 }
});
