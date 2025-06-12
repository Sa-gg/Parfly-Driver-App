import DeliveryCard from '@/components/DeliveryCard';
import { getCachedDeliveries } from '@/utils/deliveriesCache';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


type Delivery = {
  delivery_id: number;
  pickup_address: string;
  dropoff_address: string;
  delivery_fee: string;
  distanceKm: number;
  distance_km: string;
  additional_compensation: string;
  tip: string;
};

export default function CategoryOrdersPage() {
  const { category } = useLocalSearchParams();
  const router = useRouter();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedDeliveries();

    if (!cached || Object.keys(cached).length === 0) {
      setDeliveries([]);
      setLoading(false);
      return;
    }

    const categoryKey =
      typeof category === 'string'
        ? category.toLowerCase()
        : Array.isArray(category) && category.length > 0
          ? category[0].toLowerCase()
          : '';

    let categorized: Delivery[] = [];

    if (categoryKey === 'all') {
      categorized = Object.values(cached).flat();
    } else {
      categorized = cached[categoryKey] ?? [];
    }

    if (Array.isArray(categorized)) {
      setDeliveries(categorized);
    } else {
      console.warn('Expected an array for category:', category, 'but got:', categorized);
      setDeliveries([]);
    }

    setLoading(false);
  }, [category]);

  // Navigate to delivery details page, passing delivery data as param (stringified)
  const goToDeliveryDetails = (delivery: Delivery) => {
    router.push({
      pathname: '/orders/deliveryDetails', // change this to your actual details route
      params: {
        delivery_id: delivery.delivery_id.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#FF6600" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {category?.toString().toUpperCase()}
        </Text>

        <View style={{ width: 28 }} />
      </View>

      {/* Body */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.delivery_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => goToDeliveryDetails(item)}
            >
              <DeliveryCard delivery={item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={deliveries.length === 0 ? styles.emptyListContainer : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No {category} deliveries found.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50, // Status bar padding
    paddingBottom: 50, // Bottom padding for safe area
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6600',
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
});
