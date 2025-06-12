import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Linking,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { io, Socket } from 'socket.io-client';

export default function CurrentDeliveryScreen() {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const { delivery_id } = useLocalSearchParams<{ delivery_id: string }>();

    const [driverId, setDriverId] = useState<string | null>(null);
    const [delivery, setDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const [showActions, setShowActions] = useState(false);

    const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [pickupLocation, setPickupLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    const [ETA, setETA] = useState<string>('');

    const [refreshing, setRefreshing] = useState(false);

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (driverId && delivery) {
            const socket = io(API_URL, {
                transports: ['websocket'], // Ensures stable connection in React Native
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('✅ Socket connected:', socket.id);

                // ✅ Only emit if no arrival_time
                if (!delivery.arrival_time) {
                    const etaSeconds = estimateDuration(delivery.distance_km || 3); // Add your logic
                    socket.emit('start_trip', {
                        delivery_id: delivery.delivery_id,
                        etaSeconds,
                    });
                    console.log('🚀 start_trip event emitted!');
                } else {
                    console.log('⏱ Trip already started. arrival_time exists.');
                    const arrivalTimestamp = new Date(delivery.arrival_time).getTime();
                    const now = Date.now();
                    const secondsLeft = Math.max(Math.floor((arrivalTimestamp - now) / 1000), 0);
                    setCountdownSeconds(secondsLeft);
                    totalDuration.current = secondsLeft;
                }
            });


            // Example listener: server emits new ETA
            socket.on('update_eta', (data) => {
                console.log('📡 ETA update received:', data);
            });

            socket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
            });

            socket.on(`delivery_${delivery.delivery_id}`, (data) => {
                if (data.type === 'arrival_timer_started' && data.arrivalTime) {
                    const arrivalTime = new Date(data.arrivalTime).getTime();
                    const now = Date.now();
                    const diffSeconds = Math.max(Math.floor((arrivalTime - now) / 1000), 0);
                    setCountdownSeconds(diffSeconds);
                    console.log('🕒 Countdown started with', diffSeconds, 'seconds left');
                }
            });


            return () => {
                socket.disconnect();
            };
        }
    }, [driverId, delivery]);




    const onRefresh = async () => {
        setRefreshing(true);
        if (driverId) {
            await fetchDelivery(driverId);
        }
        setRefreshing(false);
    };


    const getDriverId = async () => {
        try {
            const driverDataRaw = await SecureStore.getItemAsync('driverData');
            if (!driverDataRaw) {
                alert('Driver not authenticated.');
                return null;
            }
            const driverData = JSON.parse(driverDataRaw);
            return driverData.driver_id;
        } catch (error) {
            console.error('Error retrieving driver ID:', error);
            return null;
        }
    };




    const fetchDelivery = async (driverId: string) => {
        console.log("Fetching delivery for driverId:", driverId);
        try {
            const url = delivery_id
                ? `${API_URL}/api/driver/deliveries/${driverId}?deliveryId=${delivery_id}`
                : `${API_URL}/api/driver/deliveries/${driverId}`;
            console.log("Fetching delivery from URL:", url);
            const res = await axios.get(url);
            console.log("Delivery data received:", res.data);
            setDelivery(res.data[0]);
        } catch (err) {
            // console.error('Error fetching delivery:', err);
            setDelivery(null);
        } finally {
            setLoading(false);
        }
    };



    const estimateDuration = (distanceInKm: number): number => {
        if (distanceInKm <= 7) return (distanceInKm / 30) * 3600; // 30 km/h
        if (distanceInKm <= 15) return (distanceInKm / 35) * 3600; // 35 km/h
        return (distanceInKm / 40) * 3600; // 40 km/h
    };

    const formatSeconds = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };








    // Initial mount: get driver ID only
    useEffect(() => {
        const init = async () => {
            const id = await getDriverId();
            if (id) setDriverId(id); // Triggers the next effect
        };
        init();
    }, []);

    // Once driverId is set, fetch delivery
    useEffect(() => {
        if (driverId) {
            fetchDelivery(driverId);
        }
    }, [driverId]);


    useEffect(() => {
        if (delivery) {
            setPickupLocation({
                latitude: parseFloat(delivery.pickup_lat),
                longitude: parseFloat(delivery.pickup_long),
            });

            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setDriverLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            })();
        }
    }, [delivery]);




    const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
    const animatedWidth = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (countdownSeconds !== null && countdownSeconds > 0) {
            interval = setInterval(() => {
                setCountdownSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [countdownSeconds]);

    const totalDuration = useRef<number>(180); // default 3 mins

    useEffect(() => {
        if (countdownSeconds !== null) {
            const percentage = (countdownSeconds / totalDuration.current) * 100;
            Animated.timing(animatedWidth, {
                toValue: percentage,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    }, [countdownSeconds]);

    useEffect(() => {
        if (delivery) {
            setPickupLocation({
                latitude: parseFloat(delivery.pickup_lat),
                longitude: parseFloat(delivery.pickup_long),
            });

            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                const driverCoords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };

                setDriverLocation(driverCoords);

                // 🚀 Fetch ETA + start countdown
                await fetchETAandStartCountdown(driverCoords.latitude, driverCoords.longitude);
            })();
        }
    }, [delivery]);





    const handleCancelOrder = async () => {
        try {

            setLoadingMessage('Cancelling order...');
            setLoading(true);
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
                status: 'cancelled',
            });

            if (response.status >= 200 && response.status < 300) {
                alert('Delivery cancelled successfully!');
                console.log(response.data);
            } else {
                alert(response.data?.error || 'Failed to accept delivery.');
            }
        } catch (error: any) {
            if (error.response) {
                const backendError = error.response.data?.error || error.response.data?.message;
            } else if (error.request) {
                alert('No response from server. Please try again later.');
            } else {
                alert('An unexpected error occurred.');
            }
            router.replace('/orders');
        } finally {
            setLoading(false);
            setLoadingMessage('');
            setShowActions(false);
            setRefreshing(true);
            await fetchDelivery(driverId!);
            setRefreshing(false);
            router.replace('/orders'); // Redirect to orders after cancellation

        }
    };

    const formattedCountdown = countdownSeconds !== null ? formatSeconds(countdownSeconds) : '...';

    const fetchETAandStartCountdown = async (latitude: number, longitude: number) => {
        if (!delivery) return;

        try {
            const res = await axios.get(`${API_URL}/api/driver/delivery/${delivery.delivery_id}/distance`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                },
            });

            const { distance_km, eta_seconds } = res.data;

            let eta = eta_seconds;
            if (eta < 180) eta = 180; // Minimum of 3 minutes

            totalDuration.current = eta;
            setCountdownSeconds(eta);
            setETA(formatSeconds(eta));

            console.log(`✅ ETA: ${eta} seconds | Distance: ${distance_km} km`);

        } catch (error) {
            console.error('❌ Error fetching ETA and distance:', error);
        }
    };

    const [hasArrived, setHasArrived] = useState(delivery?.is_arrived ?? false);

    useEffect(() => {
        if (delivery?.is_arrived) {
            setHasArrived(true);
        }
    }, [delivery?.is_arrived]);


    const handleArrivedBtn = async (delivery: any) => {
        console.log('Marking delivery as arrived:', delivery.delivery_id);
        try {
            const response = await axios.patch(`${API_URL}/api/client/deliveries/${delivery.delivery_id}`, {
                is_arrived: true,
            });

            if (response.status === 200) {
                Alert.alert('Success', 'Marked as arrived.');
                setHasArrived(true); // ✅ Update local state
            } else {
                Alert.alert('Failed', 'Unexpected server response.');
            }
        } catch (error) {
            console.error('Arrived update failed:', error);
            Alert.alert('Error', 'Could not update arrival status.');
        }
    };

    const handleLetsGoBtn = async (delivery: any) => {
        console.log("Starting delivery (Let's Go):", delivery.delivery_id);
        try {
            const response = await axios.patch(`${API_URL}/api/client/deliveries/${delivery.delivery_id}`, {
                driver_id: driverId,
                status: 'in_transit',
            });

            if (response.status === 200) {
                Alert.alert("Success", "Delivery marked as in transit.");
                setStatus('in_transit');
                // You can optionally update local state here, if needed
            } else {
                Alert.alert("Failed", "Unexpected server response.");
            }
        } catch (error) {
            console.error("Failed to update status to in_transit:", error);
            Alert.alert("Error", "Could not update delivery status.");
        }
    };

    const [status, setStatus] = useState(delivery?.status ?? '');

    useEffect(() => {
        if (delivery?.status) {
            setStatus(delivery.status);
        }
    }, [delivery?.status]);

    const handleCompleteDelivery = async () => {
        try {
            const response = await axios.patch(`${API_URL}/api/client/deliveries/${delivery.delivery_id}`, {
                status: 'completed',
            });

            if (response.status === 200) {
                Alert.alert("Success", "Delivery marked as completed.");
                setStatus('completed');
            } else {
                Alert.alert("Failed", "Unexpected server response.");
            }
        } catch (error) {
            console.error("Failed to mark delivery as completed:", error);
            Alert.alert("Error", "Could not complete delivery.");
        } finally {
            fetchDelivery(driverId!); // Refresh delivery data
            setShowActions(false); // Close action panel
        }
    };












    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>
                    {loadingMessage || 'Loading...'}
                </Text>
            </View>
        );
    }


    if (!delivery) {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Current Delivery</Text>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View style={styles.centerEmpty}>
                        <Text style={{ fontSize: 18, color: '#555', marginBottom: 0 }}>
                            No current delivery.
                        </Text>

                        <TouchableOpacity
                            style={styles.orderButton}
                            onPress={() => router.push("/orders")}
                        >
                            <Text style={styles.orderButtonText}>Get Orders Now</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }














    return (
        <View style={styles.container} >
            <Text style={styles.header}>Current Delivery</Text>

            <ScrollView style={styles.card} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
                <View style={styles.feeRow}>
                    <Text style={styles.feeText}>₱{parseFloat(delivery.delivery_fee).toFixed(2)}</Text>
                    {parseFloat(delivery.tip) > 0 && (
                        <Ionicons name="cash-outline" size={20} color="#4CAF50" style={styles.icon} />
                    )}
                    {parseFloat(delivery.additional_compensation) > 0 && (
                        <MaterialIcons name="emoji-objects" size={20} color="#FFC107" style={styles.icon} />
                    )}
                </View>

                <View style={styles.addressBlock}>
                    <Text style={styles.label}>📍 Pickup:</Text>
                    <TouchableOpacity
                        onPress={() =>
                            Linking.openURL(
                                `https://www.google.com/maps/dir/?api=1&destination=${delivery.pickup_lat},${delivery.pickup_long}`
                            )
                        }
                    >
                        <Text style={[styles.address, styles.clickableAddress]}>
                            {delivery.pickup_address}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.addressBlock}>
                    <Text style={styles.label}>🏁 Drop-off:</Text>
                    <TouchableOpacity
                        onPress={() =>
                            Linking.openURL(
                                `https://www.google.com/maps/dir/?api=1&destination=${delivery.dropoff_lat},${delivery.dropoff_long}`
                            )
                        }
                    >
                        <Text style={[styles.address, styles.clickableAddress]}>
                            {delivery.dropoff_address}
                        </Text>
                    </TouchableOpacity>
                </View>



                <View style={styles.addressBlock}>
                    <Text style={styles.label}>To Address ({delivery.dropoff_city}):</Text>
                    <Text style={styles.subInfo}>Distance: {parseFloat(delivery.distance_km).toFixed(2)} km</Text>
                </View>

                {delivery.receiver_name && (
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Receiver:</Text>
                        <Text style={styles.subInfo}>{delivery.receiver_name}</Text>
                    </View>
                )}

                {delivery.receiver_contact && (
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Contact:</Text>
                        <Text style={styles.subInfo}>{delivery.receiver_contact}</Text>
                    </View>
                )}

                {delivery.add_info && (
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Notes:</Text>
                        <Text style={styles.subInfo}>{delivery.add_info}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.etaAndButtons}>
                
                <View style={styles.etaContainer}>
                    <View style={styles.countdownBox}>
                        <FontAwesome5 name="clock" size={16} color="#555" style={{ marginRight: 6 }} />
                        <Text style={styles.countdownText}>Countdown: {formattedCountdown}</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                        <Animated.View style={[styles.progressBar, {
                            width: animatedWidth.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            })
                        }]} />
                    </View>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.actionsButton}
                        onPress={() => setShowActions(true)}
                    >
                        <Text style={styles.actionsButtonText}>Actions</Text>
                    </TouchableOpacity>

                    {/* Show "Mark as Arrived" button */}
                    {status === 'accepted' && !hasArrived && (
                        <TouchableOpacity style={styles.arrivedButton} onPress={() => handleArrivedBtn(delivery)}>
                            <Text style={styles.arrivedButtonText}>Mark as Arrived</Text>
                        </TouchableOpacity>
                    )}

                    {/* Show "Let's Go" button */}
                    {status === 'accepted' && hasArrived && (
                        <TouchableOpacity style={styles.arrivedButton} onPress={() => handleLetsGoBtn(delivery)}>
                            <Text style={styles.arrivedButtonText}>Let's Go</Text>
                        </TouchableOpacity>
                    )}

                    {/* Show "Complete Delivery" button */}
                    {status === 'in_transit' && (
                        <TouchableOpacity style={styles.arrivedButton} onPress={handleCompleteDelivery}>
                            <Text style={styles.arrivedButtonText}>Complete Delivery</Text>
                        </TouchableOpacity>
                    )}
                </View>


            </View>

            {/* Absolute Action Panel */}
            <Modal
                visible={showActions}
                animationType="slide"
                transparent
                onRequestClose={() => setShowActions(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setShowActions(false)} />
                <View style={styles.absoluteActionPanel}>
                    <TouchableOpacity style={styles.actionItem} onPress={handleCancelOrder}>
                        <Feather name="x-circle" size={18} color="#dc3545" style={styles.actionIcon} />
                        <Text style={styles.actionText}>Cancel Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <Ionicons name="time-outline" size={18} color="#007AFF" style={styles.actionIcon} />
                        <Text style={styles.actionText}>Arrival Time</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <Ionicons name="chatbubbles-outline" size={18} color="#007AFF" style={styles.actionIcon} />
                        <Text style={styles.actionText}>Message the Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => Linking.openURL(`tel:${delivery.sender_phone}`)}
                    >
                        <Ionicons name="call-outline" size={18} color="#007AFF" style={styles.actionIcon} />
                        <Text style={styles.actionText}>Call the Sender</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => Linking.openURL(`tel:${delivery.receiver_contact}`)}
                    >
                        <Ionicons name="call-outline" size={18} color="#007AFF" style={styles.actionIcon} />
                        <Text style={styles.actionText}>Call the Receiver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() =>
                            Linking.openURL(
                                `https://www.google.com/maps/dir/?api=1&destination=${delivery.pickup_lat},${delivery.pickup_long}`
                            )
                        }
                    >
                        <Ionicons name="navigate-outline" size={18} color="#007AFF" style={styles.actionIcon} />
                        <Text style={styles.actionText}>Open Navigation System</Text>
                    </TouchableOpacity>

                </View>
            </Modal>
        </View>
    );
}

// 🔧 Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8FA',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    orderButton: {
        backgroundColor: '#FF6600',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    orderButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 16,
        color: '#333',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        marginBottom: 20,
    },
    feeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    feeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    icon: {
        marginLeft: 10,
    },
    addressBlock: {
        marginBottom: 10,
    },
    label: {
        fontWeight: '600',
        color: '#555',
    },
    address: {
        color: '#333',
        fontSize: 16,
        marginTop: 2,
    },
    subInfo: {
        color: '#555',
        fontSize: 15,
        marginTop: 2,
    },
    infoBlock: {
        marginTop: 10,
    },
    bottom: {
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 10,
        marginBottom: 10,
    },
    countdown: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    actionsButton: {
        flex: 1,
        backgroundColor: '#444',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionsButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    arrivedButton: {
        flex: 1,
        backgroundColor: '#28a745',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    arrivedButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    absoluteActionPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingBottom: 30,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 10,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    actionItem: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',

    },
    actionText: {
        fontSize: 16,
        color: '#333',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        marginRight: 12,
    },
    clickableAddress: {
        color: '#007AFF',
        textDecorationLine: 'underline',
    },
    etaAndButtons: {
        padding: 12,
        borderTopWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
    },
    etaContainer: {
        marginBottom: 12,
    },
    countdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    countdownText: {
        fontSize: 14,
        color: '#333',
    },
    progressBarBackground: {
        width: '100%',
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#4CAF50',
    },
    centerEmpty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40, // Optional, for some spacing on smaller screens
    },

});
