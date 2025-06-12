import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CustomModal from '../components/CustomModal'; // Adjust the import path as necessary

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [user, setUser] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('driverData');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            full_name: parsedUser.full_name || parsedUser.email,
            phone: parsedUser.phone,
            email: parsedUser.email,
          });
          setEditedName(parsedUser.full_name || parsedUser.email);
        }
      } catch (error) {
        console.error('Failed to load user data', error);
      } finally {
        setLoading(false);
      }
    };

    loadDriverData();
  }, []);

  const handleLogoutConfirm = async () => {
    // Clear user data and token on logout
    await SecureStore.deleteItemAsync('driverData');
    await SecureStore.deleteItemAsync('driverToken'); // <- This is critical

    // Close modal
    setModalVisible(false);

    // Navigate to login page
    router.replace('/login');
  };



  const handleLogout = () => {
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    const updatedUser = {
      ...user,
      full_name: editedName,
    };
    setUser(updatedUser);
    setIsEditing(false);
    await SecureStore.setItemAsync('driverData', JSON.stringify({ ...updatedUser }));
    // Alert.alert('Success', 'Your name has been updated.');
  };

  const handleCancelEdit = () => {
    setEditedName(user.full_name);
    setIsEditing(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={28} color="#FF6600" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#FF6600" />
        </TouchableOpacity>
      </View>

      {/* Profile Icon */}
      <View style={styles.profileIconBox}>
        <Ionicons name="person-circle-outline" size={100} color="#FF6600" />
        <Text style={styles.profileName}>{user.full_name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.infoBox}>
        {isEditing ? (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
            />
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#FF6600" style={styles.iconLeft} />
              <View>
                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.value}>{user.phone}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#FF6600" style={styles.iconLeft} />
              <View>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>{user.full_name}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#FF6600" style={styles.iconLeft} />
              <View>
                <Text style={styles.label}>Email Address</Text>
                <Text style={styles.value}>{user.email}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      {!isEditing ? (
        <>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Forgot Password</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
      <CustomModal
        visible={modalVisible}
        message="Are you sure you want to logout?"
        onCancel={() => setModalVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileIconBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  infoBox: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconLeft: {
    marginTop: 6,
    marginRight: 12,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    backgroundColor: '#F2F2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    color: '#333',
  },
  input: {
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6600',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  editText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    display: 'none'
  },
  secondaryText: {
    fontSize: 15,
    color: '#333',

  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#ccc',
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FF6600',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
