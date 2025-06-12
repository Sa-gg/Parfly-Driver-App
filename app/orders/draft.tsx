import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TOMTOM_API_KEY = 'ZCWImM26K0V0vE9FKdpmR2wPf0VJL5jH';

export default function OrderDetails() {
    const router = useRouter();
    const { delivery_id: deliveryId } = useLocalSearchParams();
    const mapRef = useRef<MapView>(null);
    const [delivery, setDelivery] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentZoom, setCurrentZoom] = useState(0.003);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    const bottomSheetHeightCollapsed = SCREEN_HEIGHT * 0.15;
    const bottomSheetHeightExpanded = SCREEN_HEIGHT * 0.5;
    const animation = useRef(new Animated.Value(bottomSheetHeightCollapsed)).current;
    const [expanded, setExpanded] = useState(false);

    const fetchRoute = async (deliveryData: any) => {
        try {
            const { pickup_lat, pickup_long, dropoff_lat, dropoff_long } = deliveryData;
            const url = `https://api.tomtom.com/routing/1/calculateRoute/${pickup_lat},${pickup_long}:${dropoff_lat},${dropoff_long}/json?key=${TOMTOM_API_KEY}&instructionsType=text`;
            const res = await axios.get(url);
            const points = res.data.routes[0].legs[0].points;
            const coords = points.map((point: any) => ({
                latitude: point.latitude,
                longitude: point.longitude,
            }));
            setRouteCoords(coords);
        } catch (err) {
            console.error('Error fetching route:', err);
        }
    };

    useEffect(() => {
        const fetchDeliveryDetails = async () => {
            try {
                const userDataString = await SecureStore.getItemAsync('userData');
                if (!userDataString) {
                    setError('User not authenticated.');
                    setLoading(false);
                    return;
                }
                const userData = JSON.parse(userDataString);
                const res = await axios.get(`${API_URL}/api/client/deliveries/${userData.userId}/${deliveryId}`);
                setDelivery(res.data);
                fetchRoute(res.data);
            } catch (err) {
                setError('Failed to load delivery details.');
            } finally {
                setLoading(false);
            }
        };

        const getInitialLocation = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ latitude, longitude });
            console.log('Current location:', { latitude, longitude });
        };

        if (deliveryId) fetchDeliveryDetails();
        getInitialLocation();
    }, [deliveryId]);

    // Focus map on dropoff location once map and delivery data ready
    useEffect(() => {
        const isValidCoordinates =
            delivery &&
            !isNaN(+delivery.dropoff_lat) &&
            !isNaN(+delivery.dropoff_long);

        if (isMapReady && delivery && isValidCoordinates) {
            mapRef.current?.animateToRegion({
                latitude: +delivery.dropoff_lat,
                longitude: +delivery.dropoff_long,
                latitudeDelta: currentZoom,
                longitudeDelta: currentZoom,
            }, 300);
        }
    }, [isMapReady, delivery]);

    const zoomIn = async () => {
        if (isMapReady && mapRef.current) {
            const camera = await mapRef.current.getCamera();
            const newZoom = Math.max(currentZoom / 2, 0.002);
            setCurrentZoom(newZoom);
            mapRef.current.animateToRegion({
                latitude: camera.center.latitude,
                longitude: camera.center.longitude,
                latitudeDelta: newZoom,
                longitudeDelta: newZoom,
            }, 300);
        }
    };

    const zoomOut = async () => {
        if (isMapReady && mapRef.current) {
            const camera = await mapRef.current.getCamera();
            const newZoom = Math.min(currentZoom * 2, 1);
            setCurrentZoom(newZoom);
            mapRef.current.animateToRegion({
                latitude: camera.center.latitude,
                longitude: camera.center.longitude,
                latitudeDelta: newZoom,
                longitudeDelta: newZoom,
            }, 300);
        }
    };

    const goToCurrentLocation = () => {
        if (!isMapReady || !currentLocation || !mapRef.current) return;

        mapRef.current.animateToRegion({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: currentZoom,
            longitudeDelta: currentZoom,
        }, 300);
    };

    const getStatusHeader = () => {
        switch (delivery?.status) {
            case 'cancelled': return 'Your order was canceled';
            case 'pending': return "We're looking for drivers near you";
            case 'accepted': return 'A driver has accepted your order';
            case 'in_transit': return 'Your order is on the way!';
            case 'completed': return 'Your order has been delivered!';
            default: return 'Delivery Status';
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
            onPanResponderMove: (_, gestureState) => {
                let newHeight = (expanded ? bottomSheetHeightExpanded : bottomSheetHeightCollapsed) - gestureState.dy;
                newHeight = Math.min(bottomSheetHeightExpanded, Math.max(bottomSheetHeightCollapsed, newHeight));
                animation.setValue(newHeight);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 50) collapsePanel();
                else if (gestureState.dy < -50) expandPanel();
                else expanded ? expandPanel() : collapsePanel();
            },
        })
    ).current;

    const expandPanel = () => {
        setExpanded(true);
        Animated.timing(animation, { toValue: bottomSheetHeightExpanded, duration: 300, useNativeDriver: false }).start();
    };

    const collapsePanel = () => {
        setExpanded(false);
        Animated.timing(animation, { toValue: bottomSheetHeightCollapsed, duration: 300, useNativeDriver: false }).start();
    };

    if (loading) return <View style={styles.center}><Text>Loading delivery...</Text></View>;
    if (error || !delivery) return <View style={styles.center}><Text style={styles.error}>{error || 'No delivery found.'}</Text></View>;

    const isValidCoordinates =
        !isNaN(+delivery.pickup_lat) &&
        !isNaN(+delivery.pickup_long) &&
        !isNaN(+delivery.dropoff_lat) &&
        !isNaN(+delivery.dropoff_long);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </Pressable>
                <Text style={styles.logo}>PARFLY</Text>
                <View style={{ width: 24 }} />
            </SafeAreaView>

            {isValidCoordinates && (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                        latitude: +delivery.dropoff_lat,
                        longitude: +delivery.dropoff_long,
                        latitudeDelta: currentZoom,
                        longitudeDelta: currentZoom,
                    }}
                    onMapReady={() => setIsMapReady(true)}
                >
                    {/* Pickup Marker */}
                    <Marker coordinate={{ latitude: +delivery.pickup_lat, longitude: +delivery.pickup_long }} title="Pickup">
                        <Icon name="record-circle-outline" size={30} color="#FF6600" />
                    </Marker>

                    {/* Dropoff Marker */}
                    <Marker coordinate={{ latitude: +delivery.dropoff_lat, longitude: +delivery.dropoff_long }} title="Dropoff">
                        <Icon name="map-marker" size={36} color="#FF6600" />
                    </Marker>

                    {/* Current Location Marker */}
                    {currentLocation && (
                        <Marker coordinate={currentLocation} title="Your Location">
                            <Ionicons name="navigate" size={28} color="#FF6600" />
                        </Marker>
                    )}

                    {/* Route Polyline */}
                    {routeCoords.length > 0 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor="#ff6600"
                            strokeWidth={4}
                        />
                    )}
                </MapView>
            )}

            {/* Zoom controls */}
            <View style={styles.zoomControls}>
                <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
                    <Text style={styles.zoomText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={zoomOut} style={styles.zoomButton}>
                    <Text style={styles.zoomText}>-</Text>
                </TouchableOpacity>
            </View>

            {/* Go to current location button */}
            <TouchableOpacity style={styles.locationButton} onPress={goToCurrentLocation}>
                <Ionicons name="locate" size={24} color="white" />
            </TouchableOpacity>

            {/* Bottom Sheet */}
            <Animated.View
                style={[styles.bottomSheet, { height: animation }]}
                {...panResponder.panHandlers}
            >
                <View style={styles.handle} />
                <Text style={styles.statusHeader}>{getStatusHeader()}</Text>
                <View style={styles.details}>
                    <Text style={styles.detailText}>Pickup Address:</Text>
                    <Text style={styles.detailValue}>{delivery.pickup_address}</Text>
                    <Text style={styles.detailText}>Dropoff Address:</Text>
                    <Text style={styles.detailValue}>{delivery.dropoff_address}</Text>
                    <Text style={styles.detailText}>Delivery Fee:</Text>
                    <Text style={styles.detailValue}>₱{parseFloat(delivery.delivery_fee).toFixed(2)}</Text>
                    <Text style={styles.detailText}>Tip:</Text>
                    <Text style={styles.detailValue}>₱{parseFloat(delivery.tip || 0).toFixed(2)}</Text>
                    <Text style={styles.detailText}>Additional Compensation:</Text>
                    <Text style={styles.detailValue}>₱{parseFloat(delivery.additional_compensation || 0).toFixed(2)}</Text>
                    {/* Add other details as needed */}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error: { color: 'red' },
    header: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    logo: { fontSize: 18, fontWeight: 'bold', color: '#FF6600' },
    zoomControls: {
        position: 'absolute',
        top: 110,
        right: 10,
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 5,
        zIndex: 10,
    },
    zoomButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    zoomText: { fontSize: 24, color: '#FF6600', fontWeight: 'bold' },
    locationButton: {
        position: 'absolute',
        top: 180,
        right: 10,
        backgroundColor: '#FF6600',
        padding: 10,
        borderRadius: 24,
        elevation: 5,
        zIndex: 10,
    },
    bottomSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 10,
    },
    statusHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#FF6600',
    },
    details: {
        flex: 1,
    },
    detailText: {
        fontWeight: '600',
        fontSize: 14,
        marginTop: 8,
        color: '#333',
    },
    detailValue: {
        fontSize: 14,
        color: '#666',
    },
});
