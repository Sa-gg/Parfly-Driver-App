import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Delivery = {
  delivery_id: number;
  pickup_address: string;
  dropoff_address: string;
  delivery_fee: string;
  distanceKm: number;
  distance_km: string; // delivery distance
  additional_compensation: string;
  tip: string;
};

const DeliveryCard = ({ delivery }: { delivery: Delivery }) => {
  const hasTip = parseFloat(delivery.tip) > 0;
  const hasCompensation = parseFloat(delivery.additional_compensation) > 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Parfly, Delivery</Text>
        <View style={styles.feeRow}>
          {hasTip && (
            <FontAwesome5 name="money-bill-wave" size={18} color="#28A745" style={styles.icon} />
          )}
          {hasCompensation && (
            <MaterialIcons name="attach-money" size={20} color="#FFC107" style={styles.icon} />
          )}
          <Text style={styles.fee}>₱{delivery.delivery_fee}</Text>
        </View>
      </View>


      <View style={styles.addressRow}>
        <Ionicons name="navigate-outline" size={16} color="#FF6600" />
        <Text style={styles.address}>{delivery.pickup_address}</Text>
      </View>
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={16} color="#007AFF" />
        <Text style={styles.address}>{delivery.dropoff_address}</Text>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.meta}>Pickup Distance: {delivery.distanceKm.toFixed(2)} km</Text>
        <Text style={styles.meta}>Delivery Distance: {parseFloat(delivery.distance_km).toFixed(2)} km</Text>
      </View>
    </View>

  );
};

export default DeliveryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 6,
  },
  icon: {
    marginLeft: 6,
    //  marginRight: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  detailsRow: {
    marginTop: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
  },

  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  fee: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6600',
  },

 


  meta: {
    fontSize: 13,
    color: '#666',
  },
});
