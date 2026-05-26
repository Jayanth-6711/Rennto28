import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import COLORS from '../../theme/colors';
import BASE_URL, { fetchWithAuth } from '../../config/Api';

export default function OwnerPaymentHistoryScreen({ route, navigation }) {
    const { phone } = route.params || {};
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    const fetchPaymentHistory = async () => {
        try {
            setLoading(true);

            let ownerPhone = phone;
            if (!ownerPhone) {
                ownerPhone = await AsyncStorage.getItem('ownerPhone');
            }
            if (!ownerPhone) {
                console.warn('No owner phone found for payment history.');
                setLoading(false);
                return;
            }

            const response = await fetchWithAuth(`${BASE_URL}/api/owner-payments/${encodeURIComponent(ownerPhone)}/`);
            const data = await response.json();

            if (Array.isArray(data)) {
                // Filter out synthetic 'not yet paid' records (txn_ref starts with PEND- without screenshot usually)
                // We want to show all real payment attempts (Success, Paid, Pending Verification, Cash, etc)
                const historyPayments = data.filter(p => {
                    if (p.txn_ref && String(p.txn_ref).startsWith('PEND-') && !p.payment_screenshot) {
                        return false;
                    }
                    return true;
                });

                // Filter payments to double-ensure only the current calendar month is displayed/reported
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth();

                const currentMonthPayments = historyPayments.filter(p => {
                    if (!p.created_at) return false;
                    const pDate = new Date(p.created_at);
                    return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
                });

                setPayments(currentMonthPayments);
            }
        } catch (error) {
            console.error('Fetch payment history error:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async () => {
        if (payments.length === 0) {
            Alert.alert("No Data", "There is no payment history to download for this month.");
            return;
        }

        try {
            // Compile CSV content
            let csvContent = "Tenant Name,Property Name,Amount,Payment Type,Date,Status,Transaction Ref\n";
            payments.forEach(item => {
                const isCash = item.txn_ref && String(item.txn_ref).startsWith('CASH-');
                const paymentType = isCash ? 'Cash' : 'UPI';
                const formattedDate = new Date(item.created_at).toLocaleDateString();
                const tenantName = (item.tenant_name || 'Tenant').replace(/"/g, '""').replace(/,/g, ' ');
                const propertyName = (item.property_name || 'N/A').replace(/"/g, '""').replace(/,/g, ' ');
                const statusStr = (item.status || 'Pending').toUpperCase();
                const txnRef = (item.txn_ref || '').replace(/"/g, '""').replace(/,/g, ' ');

                csvContent += `"${tenantName}","${propertyName}",${item.amount},"${paymentType}","${formattedDate}","${statusStr}","${txnRef}"\n`;
            });

            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const currentMonthName = monthNames[new Date().getMonth()];
            const fileName = `Payment_Report_${currentMonthName}_${new Date().getFullYear()}.csv`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, csvContent, {
                encoding: FileSystem.EncodingType.UTF8
            });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: `Download Payment Report for ${currentMonthName}`,
                    UTI: 'public.comma-separated-values-text'
                });
            } else {
                Alert.alert("Sharing Not Available", "Sharing is not available on this device.");
            }
        } catch (error) {
            console.error("Error generating report:", error);
            Alert.alert("Error", "Failed to generate and download payment report.");
        }
    };

    const renderPaymentItem = ({ item }) => {
        const isCash = item.txn_ref && String(item.txn_ref).startsWith('CASH-');
        const paymentType = isCash ? 'Cash Payment' : 'UPI Payment';
        const isSuccess = item.status && (item.status.toLowerCase() === 'success' || item.status.toLowerCase() === 'paid' || item.status.toLowerCase() === 'verified');

        return (
            <View style={styles.paymentCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.tenantName}>{item.tenant_name || 'Tenant'}</Text>
                        <Text style={styles.propertyName}>{item.property_name}</Text>
                    </View>
                    <Text style={styles.amount}>₹{item.amount}</Text>
                </View>

                <View style={styles.paymentInfoRow}>
                    <View style={styles.typeBadge}>
                        <Ionicons name={isCash ? "cash-outline" : "qr-code-outline"} size={14} color="#6366F1" />
                        <Text style={styles.typeText}>{paymentType}</Text>
                    </View>
                    {item.payment_screenshot && (
                        <TouchableOpacity onPress={() => setSelectedImage(item.payment_screenshot)}>
                            <Image source={{ uri: item.payment_screenshot }} style={styles.thumbnail} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.TEXT_LIGHT} />
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isSuccess ? '#DCFCE7' : '#FEF9C3' }]}>
                        <Ionicons name={isSuccess ? "checkmark-circle" : "time"} size={14} color={isSuccess ? COLORS.SUCCESS : '#EAB308'} />
                        <Text style={[styles.statusText, { color: isSuccess ? '#15803D' : '#CA8A04' }]}>{item.status || 'Pending'}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthName = monthNames[new Date().getMonth()];
    const currentYear = new Date().getFullYear();

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment History</Text>
                <TouchableOpacity onPress={downloadReport} style={styles.downloadBtn}>
                    <Ionicons name="download-outline" size={22} color={COLORS.PRIMARY || "#6366F1"} />

                </TouchableOpacity>
            </View>

            {/* Premium information banner showing active calendar month */}
            <View style={styles.monthBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
                <Text style={styles.monthBannerText}>
                    Showing history for {currentMonthName} {currentYear}
                </Text>
            </View>

            <FlatList
                data={payments}
                renderItem={renderPaymentItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No payment history found for this month</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchPaymentHistory}
            />

            <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)} animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close" size={32} color="#FFF" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.TEXT_PRIMARY,
    },
    backBtn: {
        padding: 4,
    },
    downloadBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#F5F3FF', // Very light violet background
    },
    monthBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF', // Light indigo tint
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    monthBannerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#312E81', // Deep indigo text color
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    paymentCard: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tenantName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_PRIMARY,
    },
    propertyName: {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
        marginTop: 2,
    },
    amount: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.SUCCESS,
    },
    paymentInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    typeText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '600',
    },
    thumbnail: {
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: COLORS.TEXT_LIGHT,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.TEXT_LIGHT,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModalBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    fullImage: {
        width: '90%',
        height: '80%',
    },
});


