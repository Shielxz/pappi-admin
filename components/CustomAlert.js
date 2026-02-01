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
 * @param {Function} onClose - Callback when closed
 */
export const CustomAlert = ({ visible, title, message, type = 'info', onClose }) => {
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
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Aceptar</Text>
                    </TouchableOpacity>
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
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center'
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16
    }
});
