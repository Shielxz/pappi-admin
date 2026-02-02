import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const MAX_SIZE_MB = 2;
const MAX_DIMENSION = 1200;

export default function ImageUploader({
    label = "Imagen",
    imagePreview = null,
    onImageSelect,
    onRemoveImage,
    aspectRatio = 1, // 1 = square, 16/9 = wide
    helperText = null
}) {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    const aspectHeight = aspectRatio === 1 ? 200 : 120;

    return (
        <View style={styles.container}>
            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Info Badge */}
            <View style={styles.infoBadge}>
                <Ionicons name="information-circle-outline" size={14} color="#888" />
                <Text style={styles.infoText}>
                    Máximo {MAX_SIZE_MB}MB • {MAX_DIMENSION}x{MAX_DIMENSION}px
                </Text>
            </View>

            {/* Upload Area */}
            {imagePreview ? (
                <View style={styles.previewContainer}>
                    <Image
                        source={{ uri: imagePreview }}
                        style={[styles.preview, { height: aspectHeight }]}
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={onRemoveImage}
                    >
                        <Ionicons name="close-circle" size={28} color="#ff4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={handleClick}
                    >
                        <Ionicons name="camera" size={16} color="#fff" />
                        <Text style={styles.changeBtnText}>Cambiar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.dropzone} onPress={handleClick}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.dropzoneTitle}>Arrastra una imagen o haz clic</Text>
                    <Text style={styles.dropzoneSubtitle}>PNG, JPG, WebP hasta {MAX_SIZE_MB}MB</Text>
                </TouchableOpacity>
            )}

            {/* Hidden file input */}
            {Platform.OS === 'web' && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            )}

            {/* Helper text */}
            {helperText && (
                <Text style={styles.helperText}>{helperText}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
        alignSelf: 'flex-start'
    },
    infoText: {
        fontSize: 12,
        color: '#888'
    },
    dropzone: {
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...Platform.select({
            web: {
                ':hover': {
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(255, 140, 0, 0.05)'
                }
            }
        })
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    dropzoneTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4
    },
    dropzoneSubtitle: {
        fontSize: 13,
        color: '#666'
    },
    previewContainer: {
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a'
    },
    preview: {
        width: '100%',
        borderRadius: 16
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 14,
        padding: 2
    },
    changeBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20
    },
    changeBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500'
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic'
    }
});
