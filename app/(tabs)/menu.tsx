import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MenuScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name?: string; email?: string; phone?: string }>({});

  const loadUser = async () => {
    const driverData = await SecureStore.getItemAsync('driverData');
    if (driverData) {
      setUser(JSON.parse(driverData));
    }
  };

  // Load user on focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const displayName = user.full_name?.trim() ? user.full_name : user.email;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>

      {/* Profile Section */}
      <TouchableOpacity style={styles.profileContainer} onPress={() => router.push('/profile')}>
        <View style={styles.profileInfoWrapper}>
          <Ionicons name="person-circle-outline" size={40} color="#FF6600" style={styles.profileIcon} />
          <View>
            <Text style={styles.profileName}>{displayName || 'Guest'}</Text>
            <Text style={styles.profilePhone}>{user.phone || 'No phone number'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#555" />
      </TouchableOpacity>


      {/* Settings & Notification */}
      <View style={styles.menuGroup}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={22} color="#FF6600" style={styles.menuIcon} />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color="#FF6600" style={styles.menuIcon} />
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Other Options */}
      <View style={styles.menuGroup}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="car-outline" size={22} color="#FF6600" style={styles.menuIcon} />
          <Text style={styles.menuText}>Work as a Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="share-social-outline" size={22} color="#FF6600" style={styles.menuIcon} />
          <Text style={styles.menuText}>Share this App</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={22} color="#FF6600" style={styles.menuIcon} />
          <Text style={styles.menuText}>About</Text>
          
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF6600',
    marginBottom: 20,
    display: 'none',
  },
  profileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
  },
  menuGroup: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  profileInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileIcon: {
    marginRight: 10,
  },

});
