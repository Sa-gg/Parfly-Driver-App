import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import CustomModal from '../components/CustomModal'; // Adjust the import path as needed 

export default function RegisterScreen() {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const router = useRouter();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [fullName, setFullName] = useState('');

    // New fields
    const [vehiclePlate, setVehiclePlate] = useState('');
    const vehicleType = 'motorcycle'; // immutable, fixed value
    const [driverLicenseNumber, setDriverLicenseNumber] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');



    const [errors, setErrors] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        agree: '',
        vehiclePlate: '',
        driverLicenseNumber: '',
    });

    const validateForm = () => {
        let valid = true;
        const newErrors = {
            fullName: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: '',
            agree: '',
            vehiclePlate: '',
            driverLicenseNumber: '',
        };

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required.';
            valid = false;
        }

        // Phone: Starts with 09 (11 digits) or 9 (10 digits)
        if (!/^0?9\d{9}$/.test(phoneNumber)) {
            newErrors.phone = 'Enter a valid phone number (starts with 09 or 9 and has 10–11 digits).';
            valid = false;
        }

        // Email: basic email pattern
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Enter a valid email address.';
            valid = false;
        }

        // Password: min 6 chars
        if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
            valid = false;
        }

        // Confirm password
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
            valid = false;
        }

        // Agree checkbox validation
        if (!agree) {
            newErrors.agree = 'You must agree to the Terms and Conditions.';
            valid = false;
        }

        // Vehicle Plate validation (non-empty)
        if (!vehiclePlate.trim()) {
            newErrors.vehiclePlate = 'Vehicle plate number is required.';
            valid = false;
        }

        // Driver License Number validation (non-empty)
        if (!driverLicenseNumber.trim()) {
            newErrors.driverLicenseNumber = 'Driver license number is required.';
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
            router.replace('/register'); // or show a modal to confirm navigation
        }
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        // Add leading 0 if phone starts with '9'
        let formattedPhone = phoneNumber;
        if (/^9\d{9}$/.test(phoneNumber)) {
            formattedPhone = '0' + phoneNumber;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/register/driver`, {
                full_name: fullName,
                email,
                password,
                phone: formattedPhone,
                vehicle_plate: vehiclePlate,
                vehicle_type: vehicleType,
                driver_license_number: driverLicenseNumber,
            });

            alert('Registered successfully!');
            router.push('/login');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || 'Something went wrong';
                setModalMessage(message + '\nProceed to login?');
                setModalVisible(true);
            } else {
                setModalMessage('An unexpected error occurred');
                setModalVisible(true);
            }
        } finally {
            setLoading(false);
        }
    };



    return (

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            // keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80} // adjust if you have header or not
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

                <ScrollView
                    contentContainerStyle={{ ...styles.container, flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"

                >


                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF6600" />
                            <Text style={styles.loadingText}>Creating your account...</Text>
                        </View>
                    ) : (
                        <>
                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity onPress={handleBackPress}>
                                    <Ionicons name="arrow-back" size={28} />
                                </TouchableOpacity>
                                <Text style={styles.title}>Create a free account</Text>
                            </View>

                            {/* Phone Number with +63 prefix */}
                            <View style={styles.phoneInputContainer}>
                                <Text style={styles.phonePrefix}>+63</Text>
                                <TextInput
                                    placeholder="Phone Number"
                                    style={styles.phoneInput}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                />
                            </View>
                            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

                            {/* Email */}
                            <TextInput
                                placeholder="Email"
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                            {/* Full Name */}
                            <TextInput
                                placeholder="Full Name"
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

                            {/* Driver License Number */}
                            <TextInput
                                placeholder="Driver License Number"
                                style={styles.input}
                                value={driverLicenseNumber}
                                onChangeText={setDriverLicenseNumber}
                                autoCapitalize="characters"
                            />
                            {errors.driverLicenseNumber ? <Text style={styles.errorText}>{errors.driverLicenseNumber}</Text> : null}



                            {/* Vehicle Type (immutable, fixed as motorcycle) */}
                            <View style={[styles.input, styles.disabledInput]}>
                                <Text style={{ fontSize: 16, color: '#555' }}>{vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}</Text>
                            </View>

                            {/* Vehicle Plate */}
                            <TextInput
                                placeholder="Vehicle Plate Number"
                                style={styles.input}
                                value={vehiclePlate}
                                onChangeText={setVehiclePlate}
                                autoCapitalize="characters"
                            />
                            {errors.vehiclePlate ? <Text style={styles.errorText}>{errors.vehiclePlate}</Text> : null}



                            {/* Password */}
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    placeholder="Password (min 6 characters)"
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

                            {/* Confirm Password */}
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    placeholder="Confirm Password"
                                    style={styles.passwordInput}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye' : 'eye-off'}
                                        size={24}
                                        color="#B0B0B0"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

                            {/* Agree to Terms */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setAgree(!agree)}
                            >
                                <Ionicons
                                    name={agree ? 'checkbox' : 'square-outline'}
                                    size={20}
                                    color="#FF6600"
                                />
                                <Text style={styles.checkboxLabel}>I agree to the Terms and Conditions</Text>
                            </TouchableOpacity>
                            {errors.agree ? <Text style={styles.errorText}>{errors.agree}</Text> : null}

                            {/* Register Button */}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleRegister}
                            >
                                <Text style={styles.buttonText}>Sign Up for Free</Text>
                            </TouchableOpacity>

                            {/* Login Redirect */}
                            <Text style={styles.footerText}>
                                Already have an account?{' '}
                                <Text style={styles.linkText} onPress={() => router.push('/login')}>Login</Text>
                            </Text>

                            <CustomModal
                                visible={modalVisible}
                                message={modalMessage}
                                onCancel={() => setModalVisible(false)}
                                onConfirm={() => {
                                    setModalVisible(false);
                                    router.push('/login'); // navigate to login
                                }}
                            />
                        </>
                    )}
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

    );

}
const styles = StyleSheet.create({

    container: {
        paddingTop: 60,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
        justifyContent: 'flex-start', // move fields up
        paddingBottom: 50, // add some padding at the bottom
    },
    header: {
        flexDirection: 'column',
        marginBottom: 25,
        gap: 20,
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
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#B0B0B0',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 15,
    },
    phonePrefix: {
        fontSize: 16,
        color: '#333',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
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
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
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
    }, errorText: {
        color: 'red',
        marginBottom: 10,
        marginTop: -10,
        fontSize: 13,
    }, loadingContainer: {
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
    disabledInput: {
        backgroundColor: '#F0F0F0',
        color: '#A0A0A0',
    },



});
