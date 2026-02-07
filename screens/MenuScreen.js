import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Image, Platform, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import ImageCropperModal from '../components/ImageCropperModal';
import ImageUploader from '../components/ImageUploader';
import { CustomAlert } from '../components/CustomAlert'; // Import CustomAlert
import { getCardImage, checkImageDimensions, formatFileSize, isImageTooLarge } from '../utils/imageOptimization';


import { API_URL as ACTUAL_API_URL, SERVER_URL as BASE_URL, DEFAULT_HEADERS } from '../services/config';

const API_URL = ACTUAL_API_URL + '/menu';
const MAX_IMAGE_SIZE_KB = 2000; // 2MB before requiring crop
const MAX_IMAGE_DIMENSION = 1200; // 1200px

export default function MenuScreen({ user, restaurant }) {

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [products, setProducts] = useState([]);

    // Category form
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryImageFile, setCategoryImageFile] = useState(null);
    const [categoryImagePreview, setCategoryImagePreview] = useState(null);

    // Product form
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [productImageFile, setProductImageFile] = useState(null);
    const [productImagePreview, setProductImagePreview] = useState(null);

    // Image Cropper
    const [showCropper, setShowCropper] = useState(false);
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperTarget, setCropperTarget] = useState(null); // 'category' or 'product'
    const [cropperImageInfo, setCropperImageInfo] = useState(null); // { width, height, sizeKB }

    // Notifications
    const [notification, setNotification] = useState(null);
    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        showCancel: false,
        onConfirm: null
    });

    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            showCancel: false,
            onConfirm: null
        });
    };

    const showConfirm = (title, message, onConfirm) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type: 'warning',
            showCancel: true,
            onConfirm: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                onConfirm();
            }
        });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

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
            console.log("🍕 Products loaded:", data);
            data.forEach(p => console.log(`  - ${p.name}: image_path = ${p.image_path}`));
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
        showConfirm("Eliminar Categoría", "¿Estás seguro de que deseas eliminar esta categoría? Esto no se puede deshacer.", async () => {
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
                showAlert("Éxito", "Categoría eliminada", "success");
            } catch (e) {
                showAlert("Error", e.message, "error");
            }
        });
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
            showAlert("Error", e.message, "error");
        }
    };

    const deleteProduct = async (id) => {
        showConfirm("Eliminar Producto", "¿Estás seguro de que deseas eliminar este producto?", async () => {
            try {
                await fetch(`${API_URL}/products/${id}`, {
                    method: 'DELETE',
                    headers: DEFAULT_HEADERS
                });
                loadProductsByCategory(selectedCategory.id);
                showAlert("Éxito", "Producto eliminado", "success");
            } catch (e) {
                showAlert("Error", e.message, "error");
            }
        });
    };

    const resetCategoryForm = () => {
        setCategoryName('');
        setCategoryImageFile(null);
        setCategoryImagePreview(null);
        setEditingCategory(null);
    };

    const resetProductForm = () => {
        setProductName('');
        setProductPrice('');
        setProductDesc('');
        setProductImageFile(null);
        setProductImagePreview(null);
        setEditingProduct(null);
    };

    // Smart image handler with validation
    const handleImageSelect = async (file, target) => {
        if (!file) return;

        console.log(`📷 [ImageSelect] Processing image for ${target}...`);
        console.log(`   📁 File: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB`);

        const previewUrl = URL.createObjectURL(file);
        const sizeKB = file.size / 1024;
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

        // Check dimensions
        const { tooLarge, width, height } = await checkImageDimensions(previewUrl, MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION);
        console.log(`   📐 Dimensions: ${width}x${height}px, Too large: ${tooLarge}`);

        // Check file size
        const isFileTooLarge = isImageTooLarge(file, MAX_IMAGE_SIZE_KB);
        console.log(`   📦 Size check: ${sizeKB.toFixed(1)}KB, Too large: ${isFileTooLarge}`);

        if (tooLarge || isFileTooLarge) {
            // Show cropper for large images
            console.log(`   ✂️ Opening cropper for large image...`);
            showNotification(`📐 Imagen grande (${width}x${height}, ${sizeMB}MB). Recórtala para optimizar.`, 'warning');
            setCropperImage(previewUrl);
            setCropperTarget(target);
            setCropperImageInfo({ width, height, sizeKB });
            setShowCropper(true);
        } else {
            // Image is good, use directly
            console.log(`   ✅ Image is good, using directly`);
            showNotification(`✅ Imagen seleccionada (${formatFileSize(file.size)})`, 'success');
            if (target === 'category') {
                setCategoryImageFile(file);
                setCategoryImagePreview(previewUrl);
            } else {
                setProductImageFile(file);
                setProductImagePreview(previewUrl);
            }
        }
    };

    const handleCategoryImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageSelect(e.target.files[0], 'category');
        }
    };

    const handleProductImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageSelect(e.target.files[0], 'product');
        }
    };

    // Handle cropped image
    const handleCropComplete = (croppedFile, croppedPreview) => {
        showNotification(`✅ Imagen recortada (${formatFileSize(croppedFile.size)})`, 'success');

        if (cropperTarget === 'category') {
            setCategoryImageFile(croppedFile);
            setCategoryImagePreview(croppedPreview);
        } else {
            setProductImageFile(croppedFile);
            setProductImagePreview(croppedPreview);
        }

        setShowCropper(false);
        setCropperImage(null);
        setCropperTarget(null);
        setCropperImageInfo(null);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setCropperImage(null);
        setCropperTarget(null);
        setCropperImageInfo(null);
        showNotification('Selección de imagen cancelada', 'info');
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
                            {product.image_path ? (
                                <Image
                                    source={{
                                        uri: product.image_path && product.image_path.startsWith('http')
                                            ? product.image_path
                                            : `${BASE_URL}${product.image_path}`
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


                {/* PRODUCT MODAL - Hide when cropper is open */}
                <Modal visible={showProductModal && !showCropper} animationType="slide" transparent={true}>
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
                                onChangeText={(text) => setProductPrice(text.replace(/[^0-9.]/g, ''))}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Descripción"
                                placeholderTextColor={colors.textMuted}
                                value={productDesc}
                                onChangeText={setProductDesc}
                            />

                            <ImageUploader
                                label="Imagen del Producto"
                                imagePreview={productImagePreview}
                                onImageSelect={(file) => handleImageSelect(file, 'product')}
                                onRemoveImage={() => { setProductImageFile(null); setProductImagePreview(null); }}
                                aspectRatio={1}
                            />

                            <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={saveProduct}>
                                <Text style={styles.btnText}>Guardar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.btnCancel} onPress={() => { setShowProductModal(false); resetProductForm(); }}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* IMAGE CROPPER MODAL - For Products View */}
                <ImageCropperModal
                    visible={showCropper}
                    imageUri={cropperImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={1}
                    title="Recortar Imagen de Producto"
                    imageInfo={cropperImageInfo}
                />

                {/* NOTIFICATION TOAST - For Products View */}
                {notification && (
                    <View style={[
                        styles.notification,
                        notification.type === 'success' && styles.notificationSuccess,
                        notification.type === 'warning' && styles.notificationWarning,
                        notification.type === 'error' && styles.notificationError
                    ]}>
                        <Ionicons
                            name={notification.type === 'success' ? 'checkmark-circle' : notification.type === 'warning' ? 'warning' : 'information-circle'}
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.notificationText}>{notification.message}</Text>
                    </View>
                )}

                {/* CUSTOM ALERT MODAL - For Products View */}
                <CustomAlert
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    showCancel={alertConfig.showCancel}
                    onConfirm={alertConfig.onConfirm}
                    onClose={closeAlert}
                />
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
            <Modal visible={showCategoryModal && !showCropper} animationType="slide" transparent={true}>
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

                        <ImageUploader
                            label="Imagen del Menú"
                            imagePreview={categoryImagePreview}
                            onImageSelect={(file) => handleImageSelect(file, 'category')}
                            onRemoveImage={() => { setCategoryImageFile(null); setCategoryImagePreview(null); }}
                            aspectRatio={16 / 9}
                        />

                        <TouchableOpacity style={styles.btn} onPress={saveCategory}>
                            <Text style={styles.btnText}>Guardar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnCancel} onPress={() => { setShowCategoryModal(false); resetCategoryForm(); }}>
                            <Text style={styles.btnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* IMAGE CROPPER MODAL */}
            <ImageCropperModal
                visible={showCropper}
                imageUri={cropperImage}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
                aspectRatio={cropperTarget === 'product' ? 1 : 16 / 9}
                title={cropperTarget === 'product' ? 'Recortar Imagen de Producto' : 'Recortar Imagen de Menú'}
                imageInfo={cropperImageInfo}
            />

            {/* NOTIFICATION TOAST */}
            {notification && (
                <View style={[
                    styles.notification,
                    notification.type === 'success' && styles.notificationSuccess,
                    notification.type === 'warning' && styles.notificationWarning,
                    notification.type === 'error' && styles.notificationError
                ]}>
                    <Ionicons
                        name={notification.type === 'success' ? 'checkmark-circle' : notification.type === 'warning' ? 'warning' : 'information-circle'}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.notificationText}>{notification.message}</Text>
                </View>
            )}

            {/* CUSTOM ALERT MODAL */}
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
                onClose={closeAlert}
            />
            {/* CUSTOM ALERT MODAL - For Products View */}
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
                onClose={closeAlert}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 30 },
    containerMobile: { padding: 16 },
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
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: colors.textPrimary },

    // Notification Toast
    notification: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        backgroundColor: 'rgba(50, 50, 50, 0.95)',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)'
            }
        })
    },
    notificationSuccess: {
        backgroundColor: 'rgba(0, 200, 83, 0.9)'
    },
    notificationWarning: {
        backgroundColor: 'rgba(255, 152, 0, 0.9)'
    },
    notificationError: {
        backgroundColor: 'rgba(244, 67, 54, 0.9)'
    },
    notificationText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        flex: 1
    },

    // Image Preview
    imagePreview: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        marginBottom: 15,
        backgroundColor: '#333'
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 15
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        padding: 5
    }
});

