import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { fetchWithAuth } from '../../config/Api';

export default function OwnerTenantsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const phone = await AsyncStorage.getItem('ownerPhone');
      if (!phone) return;

      // Fetch from all possible tenant types
      const [hostelRes, aptRes, commRes] = await Promise.all([
        fetchWithAuth(`${BASE_URL}/api/getbeds/${encodeURIComponent(phone)}/`),
        fetchWithAuth(`${BASE_URL}/api/getapartmentbeds/${encodeURIComponent(phone)}/`),
        fetchWithAuth(`${BASE_URL}/api/getcommercialbeds/${encodeURIComponent(phone)}/`)
      ]);

      const [hostelData, aptData, commData] = await Promise.all([
        hostelRes.json(),
        aptRes.json(),
        commRes.json()
      ]);

      let allTenants = [];
      if (hostelData.data) allTenants = [...allTenants, ...hostelData.data.map(t => ({ ...t, type: 'Hostel' }))];
      if (aptData.data) allTenants = [...allTenants, ...aptData.data.map(t => ({ ...t, type: 'Apartment' }))];
      if (commData.data) allTenants = [...allTenants, ...commData.data.map(t => ({ ...t, type: 'Commercial' }))];

      setTenants(allTenants);
    } catch (error) {
      console.log('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTenant = ({ item }) => (
    <View style={styles.tenantCard}>
      <View style={styles.tenantIcon}>
        <Text style={styles.tenantInitial}>{item.name ? item.name.charAt(0) : 'T'}</Text>
      </View>
      <View style={styles.tenantInfo}>
        <Text style={styles.tenantName}>{item.name}</Text>
        <Text style={styles.tenantDetail}>{item.type} • Room {item.roomno || item.flatno || item.sectionNo}</Text>
      </View>
      <TouchableOpacity
        style={styles.callButton}
        onPress={() => {
          const phone = item.phone || item.mobile || item.contact;
          if (phone) {
            Linking.openURL(`tel:${phone}`);
          } else {
            alert('Phone number not available');
          }
        }}
      >
        <Ionicons name="call" size={20} color="#7A3FC4" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Tenants</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A3FC4" />
        </View>
      ) : (
        <FlatList
          data={tenants}
          renderItem={renderTenant}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No tenants found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  listContent: {
    padding: 16,
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tenantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tenantInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7A3FC4',
  },
  tenantInfo: {
    flex: 1,
    marginRight: 25, // Prevent overlap with call button
    justifyContent: 'center',
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4, // Add spacing between name and detail
    lineHeight: 22,
  },
  tenantDetail: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  callButton: {
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
});


