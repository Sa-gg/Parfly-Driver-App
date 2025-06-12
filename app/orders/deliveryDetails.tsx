
import { getCachedDeliveries } from '@/utils/deliveriesCache';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';


interface Delivery {
  delivery_id: number;
  sender_id: number;
  receiver_id: number | null;
  driver_id: number | null;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  created_at: string;
  payer: string;
  add_info: string;
  pickup_lat: string;
  pickup_long: string;
  dropoff_lat: string;
  dropoff_long: string;
  parcel_amount: number;
  accepted_at: string | null;
  received_at: string | null;
  sender_name: string;
  receiver_name: string;
  driver_name: string | null;
  vehicle: string | null;
  vehicle_plate: string | null;
  delivery_fee: string;
  commission_amount: string;
  driver_earnings: string;
  commission_deducted: boolean;
  additional_compensation: string;
  tip: string;
  receiver_contact: string;
  duration_minutes: string;
  distance_km: string;
  pickup_city: string;
  dropoff_city: string;
  distanceKm: number;
}

interface DeliveriesCache {
  nearest: Delivery[];
  suburbs: Delivery[];
  intercity: Delivery[];
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function DeliveryDetailsPage() {
  const router = useRouter();
  const { delivery_id } = useLocalSearchParams();
  const idNum = delivery_id ? Number(delivery_id) : null;

  const cached = getCachedDeliveries() as DeliveriesCache | null;

  if (
    !cached ||
    typeof cached !== 'object' ||
    !Array.isArray(cached.intercity) ||
    !Array.isArray(cached.nearest) ||
    !Array.isArray(cached.suburbs)
  ) {
    return (
      <View style={styles.center}>
        <Text>Cached deliveries data is invalid or not loaded yet.</Text>
      </View>
    );
  }

  const allDeliveries = [...cached.intercity, ...cached.nearest, ...cached.suburbs];
  const delivery = allDeliveries.find((d) => d.delivery_id === idNum);

  if (!delivery) {
    return (
      <View style={styles.center}>
        <Text>Delivery not found.</Text>
      </View>
    );
  }

  // Parse coordinates as floats for MapView
  const pickupCoords = {
    latitude: parseFloat(delivery.pickup_lat),
    longitude: parseFloat(delivery.pickup_long),
  };
  const dropoffCoords = {
    latitude: parseFloat(delivery.dropoff_lat),
    longitude: parseFloat(delivery.dropoff_long),
  };

  // Collapsible state
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed(!collapsed);


  const handleRequestPress = async () => {
    setIsRequesting(true); // start loading
    try {
      const token = await SecureStore.getItemAsync('driverToken');
      const driverDataRaw = await SecureStore.getItemAsync('driverData');

      if (!token || !driverDataRaw) {
        alert('Driver not authenticated.');
        return;
      }

      const driverData = JSON.parse(driverDataRaw);
      const driver_id = driverData.driver_id;

      const response = await axios.patch(`${API_URL}/api/client/deliveries/${delivery.delivery_id}`, {
        driver_id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      });

      if (response.status >= 200 && response.status < 300) {
        alert('Delivery accepted successfully!');
        console.log('delivery requested succesfful, redirecting to current delivery screen');
        router.push({
          pathname: '/current',
          params: {
            delivery_id: delivery.delivery_id.toString(),
          },
        });
        console.log(response.data);
      } else {
        alert(response.data?.error || 'Failed to accept delivery.');
      }
    } catch (error: any) {
      if (error.response) {
        const backendError = error.response.data?.error || error.response.data?.message;

        if (backendError === "You have already accepted this delivery.") {
          alert("You already requested this delivery.");
          router.replace('/current');
        } else if (backendError === "Delivery already accepted by another driver.") {
          alert("Sorry, this delivery has already been taken by another driver.");
          router.replace('/orders');
        } else if (backendError === "Delivery already accepted by another driver.") {
          alert("You already have an active delivery.");
          router.replace('/current');
        } else {
          alert(backendError || 'Failed to accept delivery.');
          router.replace('/orders');
        }

      } else if (error.request) {
        alert('No response from server. Please try again later.');
      } else {
        alert('An unexpected error occurred.');
      }
      router.replace('/orders');
    } finally {
      setIsRequesting(false); // stop loading
    }
  };

  const [isRequesting, setIsRequesting] = useState(false);




  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
      >
        <Marker coordinate={pickupCoords} title="Pickup" pinColor="#FF6600" />
        <Marker coordinate={dropoffCoords} title="Dropoff" pinColor="#3399FF" />
      </MapView>

      {/* Collapsible Bottom Panel */}
      <Animated.View
        style={[
          styles.bottomSheet,
          collapsed ? styles.bottomSheetCollapsed : styles.bottomSheetExpanded,
        ]}
      >
        <TouchableOpacity
          style={styles.collapseHeader}
          onPress={toggleCollapsed}
          activeOpacity={0.7}
        >
          <View style={styles.collapseIndicator} />
          <Text style={styles.bottomSheetTitle}>Parfly Delivery Details</Text>
          {/* <MaterialIcons
            name={collapsed ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={28}
            color="#555"
            style={{ marginLeft: 'auto' }}
          /> */}
        </TouchableOpacity>

        {!collapsed && (
          <ScrollView
            style={styles.detailsContent}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Delivery Fee</Text>
            <Text style={styles.fee}>₱{delivery.delivery_fee}</Text>

            <View style={styles.row}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#FF6600" />
              <Text style={styles.addressLabel}>Pickup Address:</Text>
              <Text style={styles.addressValue} numberOfLines={2}>
                {delivery.pickup_address}
              </Text>
            </View>

            <View style={styles.row}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#3399FF" />
              <Text style={styles.addressLabel}>Dropoff Address:</Text>
              <Text style={styles.addressValue} numberOfLines={2}>
                {delivery.dropoff_address}
              </Text>
            </View>

            <View style={styles.row}>
              <MaterialIcons name="location-on" size={20} color="#333" />
              <Text style={styles.addressLabel}>
                Distance ({delivery.distanceKm?.toFixed(2)} km):
              </Text>
              <Text style={styles.addressValue}>{delivery.distance_km} km</Text>
            </View>

            <View style={styles.iconRow}>
              {(Number(delivery.additional_compensation) > 0 ||
                Number(delivery.tip) > 0) && (
                  <>
                    {Number(delivery.additional_compensation) > 0 && (
                      <View style={styles.iconWithText}>
                        <MaterialIcons name="attach-money" size={24} color="#4CAF50" />
                        <Text style={styles.iconText}>₱{delivery.additional_compensation}</Text>
                      </View>
                    )}
                    {Number(delivery.tip) > 0 && (
                      <View style={styles.iconWithText}>
                        <FontAwesome5
                          name="hand-holding-usd"
                          size={24}
                          color="#FFC107"
                        />
                        <Text style={styles.iconText}>₱{delivery.tip}</Text>
                      </View>
                    )}
                  </>
                )}
            </View>

            <View style={{ marginVertical: 10 }}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <Text style={styles.additionalInfo}>{delivery.add_info || 'N/A'}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.requestButton,
                isRequesting && styles.requestButtonDisabled
              ]}
              activeOpacity={0.7}
              onPress={handleRequestPress}
              disabled={isRequesting}
            >
              <Text style={styles.requestButtonText}>
                {isRequesting ? 'Requesting...' : 'Request'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 12,
    paddingHorizontal: 20,
    paddingTop: 10,

    // paddingBottom removed from here to avoid duplicate
    zIndex: 10,
  },
  bottomSheetCollapsed: {
    height: 120,
    overflow: 'hidden',
  },
  bottomSheetExpanded: {
    maxHeight: SCREEN_HEIGHT * 0.6, // limit max height
    paddingBottom: 20, // padding for bottom content
  },
  collapseHeader: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  collapseIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    marginRight: 12,

  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6600',
  },
  detailsContent: {
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  fee: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF6600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressLabel: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#444',
    width: 120,
  },
  addressValue: {
    flex: 1,
    color: '#222',
    flexShrink: 1, // prevent overflow
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 10,
    flexWrap: 'wrap', // in case icons overflow horizontally
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  iconText: {
    marginLeft: 6,
    fontWeight: '700',
    color: '#333',
    fontSize: 16,
  },
  additionalInfo: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  requestButton: {
    marginTop: 12,
    backgroundColor: '#FF6600',
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  requestButtonDisabled: {
    backgroundColor: '#b34700',
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

});
