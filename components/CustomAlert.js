import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

/**
 * A custom alert component that replaces the ugly browser alert.
 * @param {boolean} visible - Whether the alert is visible
 * @param {string} title - Alert title
 * @param {string} message - Alert body text
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {boolean} showCancel - Whether to show cancel button
 * @param {Function} onConfirm - Callback when confirmed (if showCancel is true)
 * @param {string} cancelText - Text for cancel button
 */
export const CustomAlert = ({ visible, title, message, type = 'info', onClose, showCancel = false, onConfirm, cancelText = 'Cancelar' }) => {
    if (!visible) return null;

    let iconName = 'information-circle';
    let iconColor = colors.primary;

    if (type === 'success') {
        iconName = 'checkmark-circle';
        iconColor = colors.success;
    } else if (type === 'error') {
        iconName = 'alert-circle';
        iconColor = colors.error;
    }

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <View style={styles.header}>
                        <Ionicons name={iconName} size={40} color={iconColor} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.buttonRow}>
                        {showCancel && (
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.button, showCancel && styles.confirmButton]}
                            onPress={showCancel ? onConfirm : onClose}
                        >
                            <Text style={styles.buttonText}>{showCancel ? 'Confirmar' : 'Aceptar'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000, // Ensure it's on top of everything
    },
    alertBox: {
        width: '85%',
        maxWidth: 340,
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Platform.select({
            web: {
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)'
            },
            default: {
                elevation: 10
            }
        })
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center'
    },
    message: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center'
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelButton: {
        backgroundColor: '#333', // Dark gray for cancel
        borderWidth: 1,
        borderColor: '#555'
    },
    confirmButton: {
        backgroundColor: colors.danger, // Red for dangerous actions like delete
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16
    }
});
