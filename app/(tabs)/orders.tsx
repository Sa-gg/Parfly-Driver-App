import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { setCachedDeliveries } from '../../utils/deliveriesCache';

type Delivery = {
    delivery_id: number;
    status: string;
    pickup_address: string;
    dropoff_address: string;
    distanceKm: number; // from the backend
};

type CategorizedDeliveries = {
    nearest: Delivery[];
    suburbs: Delivery[];
    intercity: Delivery[];
};

export default function OrdersScreen() {
    const [deliveries, setDeliveries] = useState<CategorizedDeliveries>({
        nearest: [],
        suburbs: [],
        intercity: [],
    });

    const [refreshing, setRefreshing] = useState(false);
    const [city, setCity] = useState<string>('Loading...');
    const router = useRouter();

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        setRefreshing(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission denied');
                setCity('Permission denied');

                setRefreshing(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
            const cityName = place?.city || 'Unknown';
            setCity(cityName);

            const res = await axios.get(`${API_URL}/api/driver/deliveries-by-distance`, {
                params: { lat: latitude, lon: longitude },
            });

            // console.log('Fetched deliveries:', res.data);
            

            if (res.data) {
                setDeliveries(res.data);
                setCachedDeliveries(res.data); // Cache deliveries for category screen
            } else {
                console.warn('Unexpected data format from API', res.data);
            }
             setRefreshing(false);
        } catch (error) {
            console.error('Error fetching categorized deliveries:', error);
             fetchDeliveries();
        } finally {

            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDeliveries();
       
    }, []);

    const getCountByType = (type: string) => {
        switch (type) {
            case 'Nearest':
                return deliveries.nearest.length;
            case 'Intercity':
                return deliveries.intercity.length;
            case 'Suburbs':
                return deliveries.suburbs.length;
            case 'All':
                return deliveries.nearest.length + deliveries.intercity.length + deliveries.suburbs.length;
            default:
                return 0;
        }
    };

    const orderCategories = [
        { title: 'Nearest', key: 'Nearest', icon: <Ionicons name="location" size={24} color="#FF6600" /> },
        { title: 'Intercity', key: 'Intercity', icon: <FontAwesome5 name="city" size={24} color="#FF6600" /> },
        { title: 'Suburbs', key: 'Suburbs', icon: <MaterialIcons name="landscape" size={24} color="#FF6600" /> },
        { title: 'All', key: 'All', icon: <FontAwesome5 name="map-marked-alt" size={24} color="#FF6600" /> },
    ];

    const handlePress = (type: string) => {
        router.push({
            pathname: '/orders/[category]',
            params: { category: type.toLowerCase() },
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>📍 Current City: {city}</Text>
            <Text style={styles.subHeader}>Orders</Text>


            <ScrollView
                contentContainerStyle={styles.cardContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6600']} />
                }
            >
                {orderCategories.map(category => (
                    <TouchableOpacity
                        key={category.key}
                        style={styles.card}
                        onPress={() => handlePress(category.key)}
                    >
                        <View style={styles.cardContent}>
                            <View style={styles.leftSection}>
                                {category.icon}
                                <Text style={styles.cardTitle}>{category.title}</Text>
                            </View>
                            <Text style={styles.cardCount}>{getCountByType(category.key)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        backgroundColor: '#f9f9f9',
    },
    header: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    subHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#444',
    },
    cardContainer: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderBottomWidth: 2,
        borderBottomColor: '#CCCCCC',
        // subtle shadow for modern look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // for Android shadow
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
        color: '#333',
    },
    cardCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6600',
    },
});
