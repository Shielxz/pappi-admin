import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Image } from 'react-native';

const API_URL = 'http://192.168.1.92:3000/api/menu';
const BASE_URL = 'http://192.168.1.92:3000';

export default function MenuScreen({ user }) {
    const [restaurant, setRestaurant] = useState(null);
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
        loadRestaurant();
    }, []);

    const loadRestaurant = async () => {
        try {
            const res = await fetch(`${API_URL}/restaurants`);
            const data = await res.json();
            const myRestaurant = data.find(r => r.owner_id === user.id);
            if (myRestaurant) {
                setRestaurant(myRestaurant);
                loadCategories(myRestaurant.id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadCategories = async (restaurantId) => {
        try {
            const res = await fetch(`${API_URL}/categories/${restaurantId}`);
            const data = await res.json();
            setCategories(data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadProductsByCategory = async (categoryId) => {
        try {
            const res = await fetch(`${API_URL}/products/category/${categoryId}`);
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_id: user.id,
                    name: restaurantName,
                    category: 'Variado'
                })
            });
            Alert.alert("Éxito", "Restaurante creado");
            loadRestaurant();
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

            await fetch(url, {
                method,
                body: formData
            });

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
                        await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
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

            await fetch(url, {
                method,
                body: formData
            });

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
                        await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
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
                    <Text style={styles.btnText}>+ Agregar Producto</Text>
                </TouchableOpacity>

                <View style={styles.productsGrid}>
                    {products.map(product => (
                        <View key={product.id} style={styles.productCard}>
                            {product.image_path && (
                                <Image
                                    source={{ uri: `${BASE_URL}${product.image_path}` }}
                                    style={styles.productImage}
                                />
                            )}
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productPrice}>${product.price}</Text>
                            {product.description ? <Text style={styles.productDesc}>{product.description}</Text> : null}
                            <View style={styles.productActions}>
                                <TouchableOpacity onPress={() => {
                                    setEditingProduct(product);
                                    setProductName(product.name);
                                    setProductPrice(product.price.toString());
                                    setProductDesc(product.description || '');
                                    setShowProductModal(true);
                                }} style={{ marginRight: 10 }}>
                                    <Text style={{ fontSize: 18 }}>✏️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteProduct(product.id)}>
                                    <Text style={{ color: 'red', fontSize: 18 }}>🗑️</Text>
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
                                value={productName}
                                onChangeText={setProductName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Precio"
                                value={productPrice}
                                onChangeText={setProductPrice}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Descripción"
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
                <Text style={styles.btnText}>+ Crear Nuevo Menú</Text>
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
                                source={{ uri: `${BASE_URL}${category.image_path}` }}
                                style={styles.categoryImage}
                            />
                        ) : (
                            <View style={styles.categoryImagePlaceholder}>
                                <Text style={{ fontSize: 40 }}>📋</Text>
                            </View>
                        )}
                        <Text style={styles.categoryName}>{category.name}</Text>

                        <View style={styles.categoryActions}>
                            <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setCategoryName(category.name);
                                setShowCategoryModal(true);
                            }} style={{ marginRight: 10 }}>
                                <Text style={{ fontSize: 18 }}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                deleteCategory(category.id);
                            }}>
                                <Text style={{ color: 'red', fontSize: 18 }}>🗑️</Text>
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
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    backBtn: { marginBottom: 15 },
    backBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#555' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5, fontSize: 16, backgroundColor: 'white' },
    btn: { backgroundColor: '#FF4500', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    btnCancel: { backgroundColor: '#999', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 10 },
    btnCancelText: { color: 'white', fontSize: 16 },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    categoryCard: {
        width: 200,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    categoryImage: { width: 160, height: 120, borderRadius: 8, marginBottom: 10 },
    categoryImagePlaceholder: {
        width: 160,
        height: 120,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    categoryName: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    categoryActions: { flexDirection: 'row', marginTop: 10 },
    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 20 },
    productCard: {
        width: 180,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2
    },
    productImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10 },
    productName: { fontSize: 16, fontWeight: 'bold' },
    productPrice: { fontSize: 18, color: '#FF4500', marginTop: 5 },
    productDesc: { fontSize: 14, color: '#666', marginTop: 5 },
    productActions: { flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '90%',
        maxWidth: 500,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }
});
