import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Image, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';


import { API_URL as ACTUAL_API_URL, SERVER_URL as BASE_URL, DEFAULT_HEADERS } from '../services/config';

const API_URL = ACTUAL_API_URL + '/menu';

export default function MenuScreen({ user, restaurant }) {

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [products, setProducts] = useState([]);

    // Category form
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryImageFile, setCategoryImageFile] = useState(null);

    // Product form
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [productImageFile, setProductImageFile] = useState(null);

    useEffect(() => {
        if (restaurant) {
            loadCategories(restaurant.id);
        }
    }, [restaurant]);


    const loadCategories = async (restaurantId) => {
        try {
            const res = await fetch(`${API_URL}/categories/${restaurantId}`, {
                headers: DEFAULT_HEADERS
            });
            const data = await res.json();
            setCategories(data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadProductsByCategory = async (categoryId) => {
        try {
            const res = await fetch(`${API_URL}/products/category/${categoryId}`, {
                headers: DEFAULT_HEADERS
            });
            const data = await res.json();
            setProducts(data);
        } catch (e) {
            console.error(e);
        }
    };

    const createRestaurant = async () => {
        const restaurantName = prompt("Nombre del Restaurante:");
        if (!restaurantName) return;
        try {
            const res = await fetch(`${API_URL}/restaurants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...DEFAULT_HEADERS
                },
                body: JSON.stringify({
                    owner_id: user.id,
                    name: restaurantName,
                    category: 'Variado'
                })
            });
            Alert.alert("Éxito", "Restaurante creado");
            // Note: In a real app we'd reload the restaurant data in the parent App component
        } catch (e) {
            Alert.alert("Error", e.message);
        }
    };

    const saveCategory = async () => {
        if (!categoryName) return Alert.alert("Error", "Nombre de categoría requerido");

        const formData = new FormData();
        formData.append('restaurant_id', restaurant.id);
        formData.append('name', categoryName);

        if (categoryImageFile) {
            formData.append('image', categoryImageFile);
        }

        try {
            const url = editingCategory
                ? `${API_URL}/categories/${editingCategory.id}`
                : `${API_URL}/categories`;
            const method = editingCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: DEFAULT_HEADERS,
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error("❌ Error Server Details:", errData);
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            Alert.alert("Éxito", editingCategory ? "Categoría actualizada" : "Categoría creada");
            resetCategoryForm();
            setShowCategoryModal(false);
            loadCategories(restaurant.id);
        } catch (e) {
            Alert.alert("Error", e.message);
        }
    };

    const deleteCategory = async (id) => {
        Alert.alert("Confirmar", "¿Eliminar esta categoría?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    try {
                        await fetch(`${API_URL}/categories/${id}`, {
                            method: 'DELETE',
                            headers: DEFAULT_HEADERS
                        });
                        loadCategories(restaurant.id);
                        if (selectedCategory?.id === id) {
                            setSelectedCategory(null);
                            setProducts([]);
                        }
                    } catch (e) {
                        Alert.alert("Error", e.message);
                    }
                }
            }
        ]);
    };

    const saveProduct = async () => {
        if (!productName || !productPrice) return Alert.alert("Error", "Nombre y precio requeridos");
        if (!selectedCategory) return Alert.alert("Error", "Selecciona una categoría primero");

        const formData = new FormData();
        formData.append('restaurant_id', restaurant.id);
        formData.append('name', productName);
        formData.append('description', productDesc);
        formData.append('price', productPrice);
        formData.append('category_id', selectedCategory.id);

        if (productImageFile) {
            formData.append('image', productImageFile);
        }

        try {
            const url = editingProduct
                ? `${API_URL}/products/${editingProduct.id}`
                : `${API_URL}/products`;
            const method = editingProduct ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: DEFAULT_HEADERS,
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error("❌ Error Server Details:", errData);
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            Alert.alert("Éxito", editingProduct ? "Producto actualizado" : "Producto agregado");
            resetProductForm();
            setShowProductModal(false);
            loadProductsByCategory(selectedCategory.id);
        } catch (e) {
            Alert.alert("Error", e.message);
        }
    };

    const deleteProduct = async (id) => {
        Alert.alert("Confirmar", "¿Eliminar este producto?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    try {
                        await fetch(`${API_URL}/products/${id}`, {
                            method: 'DELETE',
                            headers: DEFAULT_HEADERS
                        });
                        loadProductsByCategory(selectedCategory.id);
                    } catch (e) {
                        Alert.alert("Error", e.message);
                    }
                }
            }
        ]);
    };

    const resetCategoryForm = () => {
        setCategoryName('');
        setCategoryImageFile(null);
        setEditingCategory(null);
    };

    const resetProductForm = () => {
        setProductName('');
        setProductPrice('');
        setProductDesc('');
        setProductImageFile(null);
        setEditingProduct(null);
    };

    const handleCategoryImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setCategoryImageFile(e.target.files[0]);
        }
    };

    const handleProductImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProductImageFile(e.target.files[0]);
        }
    };

    if (!restaurant) {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Crear tu Restaurante</Text>
                <TouchableOpacity style={styles.btn} onPress={createRestaurant}>
                    <Text style={styles.btnText}>+ Crear Restaurante</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (selectedCategory) {
        return (
            <ScrollView style={styles.container}>
                <TouchableOpacity onPress={() => { setSelectedCategory(null); setProducts([]); }} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Volver a Menús</Text>
                </TouchableOpacity>

                <Text style={styles.header}>{selectedCategory.name}</Text>

                <TouchableOpacity style={styles.btn} onPress={() => setShowProductModal(true)}>
                    <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Agregar Producto</Text>
                </TouchableOpacity>


                <View style={styles.productsGrid}>
                    {products.map(product => (
                        <View key={product.id} style={styles.productCard}>
                            {product.image_url ? (
                                <Image
                                    source={{
                                        uri: product.image_url && product.image_url.startsWith('http')
                                            ? product.image_url
                                            : `${BASE_URL}${product.image_url}`
                                    }}
                                    style={styles.productImage}
                                />
                            ) : (
                                <View style={[styles.productImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="restaurant-outline" size={40} color={colors.textMuted} />
                                </View>
                            )}
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productPrice}>${product.price}</Text>
                            {product.description ? <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text> : null}
                            <View style={styles.productActions}>
                                <TouchableOpacity onPress={() => {
                                    setEditingProduct(product);
                                    setProductName(product.name);
                                    setProductPrice(product.price.toString());
                                    setProductDesc(product.description || '');
                                    setShowProductModal(true);
                                }} style={styles.actionBtn}>
                                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteProduct(product.id)} style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>


                {/* PRODUCT MODAL */}
                <Modal visible={showProductModal} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{editingProduct ? 'Editar' : 'Agregar'} Producto</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del Producto"
                                placeholderTextColor={colors.textMuted}
                                value={productName}
                                onChangeText={setProductName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Precio"
                                placeholderTextColor={colors.textMuted}
                                value={productPrice}
                                onChangeText={setProductPrice}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Descripción"
                                placeholderTextColor={colors.textMuted}
                                value={productDesc}
                                onChangeText={setProductDesc}
                            />


                            <Text style={styles.label}>Imagen del Producto:</Text>
                            <input type="file" accept="image/*" onChange={handleProductImageChange} style={{ marginBottom: 15 }} />

                            <TouchableOpacity style={styles.btn} onPress={saveProduct}>
                                <Text style={styles.btnText}>Guardar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.btnCancel} onPress={() => { setShowProductModal(false); resetProductForm(); }}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Mis Menús</Text>

            <TouchableOpacity style={styles.btn} onPress={() => setShowCategoryModal(true)}>
                <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Crear Nuevo Menú</Text>
            </TouchableOpacity>


            <View style={styles.categoriesGrid}>
                {categories.map(category => (
                    <TouchableOpacity
                        key={category.id}
                        style={styles.categoryCard}
                        onPress={() => {
                            setSelectedCategory(category);
                            loadProductsByCategory(category.id);
                        }}
                    >
                        {category.image_path ? (
                            <Image
                                source={{
                                    uri: category.image_path && category.image_path.startsWith('http')
                                        ? category.image_path
                                        : `${BASE_URL}${category.image_path}`
                                }}
                                style={styles.categoryImage}
                            />
                        ) : (
                            <View style={styles.categoryImagePlaceholder}>
                                <Ionicons name="fast-food-outline" size={50} color={colors.textMuted} />
                            </View>
                        )}
                        <Text style={styles.categoryName}>{category.name}</Text>

                        <View style={styles.categoryActions}>
                            <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setCategoryName(category.name);
                                setShowCategoryModal(true);
                            }} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                deleteCategory(category.id);
                            }} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>


            {/* CATEGORY MODAL */}
            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingCategory ? 'Editar' : 'Crear'} Menú</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del Menú (ej: Hamburguesas)"
                            placeholderTextColor={colors.textMuted}
                            value={categoryName}
                            onChangeText={setCategoryName}
                        />


                        <Text style={styles.label}>Imagen del Menú:</Text>
                        <input type="file" accept="image/*" onChange={handleCategoryImageChange} style={{ marginBottom: 15 }} />

                        <TouchableOpacity style={styles.btn} onPress={saveCategory}>
                            <Text style={styles.btnText}>Guardar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnCancel} onPress={() => { setShowCategoryModal(false); resetCategoryForm(); }}>
                            <Text style={styles.btnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 30 },
    header: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, color: colors.textPrimary },
    backBtn: { marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
    backBtnText: { fontSize: 16, color: colors.accent, fontWeight: '600', marginLeft: 5 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.textSecondary },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        padding: 15,
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#222',
        color: 'white'
    },
    btn: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 25
    },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    btnCancel: { backgroundColor: '#333', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    btnCancelText: { color: '#ccc', fontSize: 16 },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    categoryCard: {
        width: 200,
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: { boxShadow: '0 4px 20px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' },
            default: { elevation: 3 }
        })
    },
    categoryImage: { width: '100%', height: 120, borderRadius: 12, marginBottom: 12 },
    categoryImagePlaceholder: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center'
    },
    categoryName: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: colors.textPrimary, textAlign: 'center' },
    categoryActions: { flexDirection: 'row', gap: 15 },

    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 10 },
    productCard: {
        width: 220,
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: { boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }
        })
    },
    productImage: { width: '100%', height: 140, borderRadius: 12, marginBottom: 12 },
    productName: { fontSize: 17, fontWeight: 'bold', color: colors.textPrimary },
    productPrice: { fontSize: 18, color: colors.primary, marginTop: 4, fontWeight: 'bold' },
    productDesc: { fontSize: 13, color: colors.textMuted, marginTop: 5, height: 35 },
    productActions: { flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end', gap: 10 },
    actionBtn: { padding: 5 },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(5px)'
    },
    modalContent: {
        width: '90%',
        maxWidth: 500,
        backgroundColor: '#1E1E1E',
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }
        })
    },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: colors.textPrimary }
});

