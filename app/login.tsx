import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginScreen() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        identifier: '',
        password: '',
        general: '',
    });


    const validateForm = () => {
        let valid = true;
        const newErrors = {
            identifier: '',
            password: '',
            general: '',
        };

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const isValidPhone =
            /^(\+63|63|09|9)\d{9}$/.test(identifier);

        if (!isEmail && !isValidPhone) {
            newErrors.identifier = 'Enter a valid email or mobile number (e.g., 09123456789 or +639123456789).';
            valid = false;
        }

        if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const [hasUserData, setHasUserData] = useState(false);

    useEffect(() => {
        async function checkUserData() {
            const userData = await SecureStore.getItemAsync('userData');
            setHasUserData(!!userData);
        }
        checkUserData();
    }, []);

    const handleBackPress = () => {
        if (hasUserData) {
            router.back();  // go back normally
        } else {
            // Option 1: Prevent going back
            router.replace('/login'); // or show a modal to confirm navigation
        }
    };




    const handleLogin = async () => {
        if (!validateForm()) return;
        setLoading(true);
        setErrors({ identifier: '', password: '', general: '' }); // Clear previous errors
        try {
            const response = await axios.post(`${API_URL}/api/login/driver`, {
                identifier,
                password,
            });

            const data = response.data;

            if (data.token && data.user) {
                await SecureStore.setItemAsync('driverToken', data.token);
                await SecureStore.setItemAsync('driverData', JSON.stringify({
                    userId: data.user.user_id,
                    full_name: data.user.full_name,
                    email: data.user.email,
                    phone: data.user.phone,
                    role: data.user.role,
                    created_at: data.user.created_at,
                    driver_id: data.user.driver_id,
                    vehicle_type: data.user.vehicle_type,
                    vehicle_plate: data.user.vehicle_plate,
                    is_available: data.user.is_available,
                }));


                router.replace('/current');
            } else {
                setErrors(prev => ({
                    ...prev,
                    general: 'Login failed. No token or user data received from server.',
                }));
            }
        } catch (error: any) {
            const message =
                error.response?.data?.message || 'Login failed. Please check your credentials';
            setErrors(prev => ({
                ...prev,
                general: message,
            }));
        } finally {
            setLoading(false);
        }
    };




    return (
        <ScrollView contentContainerStyle={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6600" />
                    <Text style={styles.loadingText}>Signing in...</Text>
                </View>
            ) : (
                <>
                    {/* Header with Back Icon and Title */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBackPress}>
                            <Ionicons name="arrow-back" size={28} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Great to have you back</Text>
                    </View>

                    {/* Phone or Email */}
                    <TextInput
                        placeholder="Phone Number or Email"
                        style={styles.input}
                        keyboardType="default"
                        autoCapitalize="none"
                        value={identifier}
                        onChangeText={setIdentifier}
                    />
                    {errors.identifier ? <Text style={styles.errorText}>{errors.identifier}</Text> : null}

                    {/* Password */}
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="Password"
                            style={styles.passwordInput}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showPassword ? 'eye' : 'eye-off'}
                                size={24}
                                color="#B0B0B0"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                    {errors.general ? <Text style={styles.generalErrorText}>{errors.general}</Text> : null}



                    {/* Forgot Password */}
                    <TouchableOpacity>
                        <Text style={[styles.linkText, { marginBottom: 25 }]}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                    >
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>


                    {/* Register Redirect */}
                    <Text style={styles.footerText}>
                        Don’t have an account?{' '}
                        <Text style={styles.linkText} onPress={() => router.push('/register')}>
                            Sign Up
                        </Text>
                    </Text>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'column',
        marginBottom: 25,
        gap: 70,
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    input: {
        borderWidth: 1,
        borderColor: '#B0B0B0',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#B0B0B0',
        borderRadius: 10,
        marginBottom: 15,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: '#FF6600',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        textAlign: 'center',
        color: '#555',
    },
    linkText: {
        color: '#FF6600',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        marginTop: -10,
        fontSize: 13,
    },
    generalErrorText: {
        color: 'red',
        marginTop: -10,
        marginBottom: 10,
        fontSize: 13,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
});
