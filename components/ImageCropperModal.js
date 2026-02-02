import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import Cropper from 'react-easy-crop';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

// Helper to create cropped image blob
const createCroppedImage = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
        image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                resolve(blob);
            },
            'image/jpeg',
            0.9 // Quality 90%
        );
    });
};

export default function ImageCropperModal({
    visible,
    imageUri,
    onCropComplete,
    onCancel,
    aspectRatio = 1,
    title = "Recortar Imagen",
    imageInfo = null // { width, height, sizeKB }
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = useCallback((crop) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom) => {
        setZoom(zoom);
    }, []);

    const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;

        setProcessing(true);
        try {
            const croppedBlob = await createCroppedImage(imageUri, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
            onCropComplete(croppedFile, URL.createObjectURL(croppedBlob));
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        onCancel();
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="crop" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>Arrastra y usa el zoom para ajustar</Text>
                    </View>

                    {/* Warning Banner */}
                    <View style={styles.warningBanner}>
                        <Ionicons name="warning" size={20} color="#ff9800" />
                        <View style={styles.warningTextContainer}>
                            <Text style={styles.warningTitle}>
                                La imagen supera el tamaño máximo permitido
                            </Text>
                            <Text style={styles.warningSubtitle}>
                                {imageInfo && `Dimensiones: ${imageInfo.width}x${imageInfo.height}px`}
                                {imageInfo?.sizeKB && ` • Peso: ${(imageInfo.sizeKB / 1024).toFixed(1)}MB`}
                            </Text>
                            <Text style={styles.warningSubtitle}>
                                Máximo permitido: 1200x1200px • 2MB
                            </Text>
                        </View>
                    </View>

                    {/* Cropper Area */}
                    <View style={styles.cropperContainer}>
                        <Cropper
                            image={imageUri}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropAreaComplete}
                            cropShape="rect"
                            showGrid={true}
                            style={{
                                containerStyle: { backgroundColor: '#1a1a1a' },
                                cropAreaStyle: { border: `2px solid ${colors.primary}` }
                            }}
                        />
                    </View>

                    {/* Zoom Slider */}
                    <View style={styles.zoomContainer}>
                        <Ionicons name="remove" size={20} color="#888" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            style={styles.slider}
                        />
                        <Ionicons name="add" size={20} color="#888" />
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmButton, processing && styles.buttonDisabled]}
                            onPress={handleConfirm}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="crop" size={18} color="#fff" />
                                    <Text style={styles.confirmButtonText}>Aplicar Recorte</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 600,
        borderWidth: 1,
        borderColor: colors.glassBorder
    },
    header: {
        marginBottom: 20,
        alignItems: 'center'
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        color: '#888'
    },
    cropperContainer: {
        height: 350,
        width: '100%',
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a'
    },
    zoomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 12
    },
    slider: {
        width: 200,
        height: 6,
        accentColor: colors.primary
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    cancelButtonText: {
        color: '#ccc',
        fontSize: 16,
        fontWeight: '600'
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        backgroundColor: colors.primary
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    buttonDisabled: {
        opacity: 0.6
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.3)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16
    },
    warningTextContainer: {
        flex: 1
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ff9800',
        marginBottom: 4
    },
    warningSubtitle: {
        fontSize: 12,
        color: '#999',
        lineHeight: 18
    }
});
