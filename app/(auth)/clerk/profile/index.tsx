import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '@/config/initSupabase';
import { Session } from '@supabase/supabase-js';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/provider/AuthProvider';

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  // const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState('');
  const {signOut,session} = useAuth();
  const role = session?.user?.user_metadata?.role;
  const [profile, setProfile] = useState<{
    full_name: string;
    email: string;
    officer: string;
    location: string;
    phone: string;
  }>({
    full_name: '',
    email: '',
    officer: '',
    location: '',
    phone: '',
  });

  const avatarUrl =
    'https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?semt=ais_hybrid&w=740';

    const user = session?.user;
 useFocusEffect(
  useCallback(() => {
    if (user) {
      fetchProfile(user.id);
      const officerId = user.user_metadata.officer;
      if (officerId) fetchOfficerName(officerId);
    }
  }, [user])
);
    
  const officerId = session?.user?.user_metadata.officer;

  const fetchOfficerName = async (officerId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('id', officerId)
      .single();
  
    if (error) {
      console.warn('Error fetching officer name:', error.message);
    } else {
      setOfficerName(data.name);
    }
  };
  const handleEditPress = () => {
    router.push({pathname:'/clerk/profile/ProfileEdit',
      params: { officerName },
    });

  };

  
  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    

    if (error) {
      Alert.alert('Error loading profile', error.message);
    } else if (data) {
      setProfile({
        full_name: data.name || '',
        email: data.email || '',
        officer: session?.user.user_metadata.officer || '',
        location: data.location || '',
        phone: data.phone || '',
      });
    }
    setLoading(false);
  };

 
  

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />

      <Text style={styles.name}>{profile.full_name}</Text>
      <Text style={styles.email}>{profile.email}</Text>

      {role === 'clerk' && (
  <View style={styles.field}>
    <Text style={styles.label}>Officer:</Text>
    <Text style={styles.value}>{officerName || 'N/A'}</Text>
  </View>
)}

      <View style={styles.field}>
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{profile.location}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{profile.phone}</Text>
      </View>

      
      <TouchableOpacity style={[styles.logoutButton,{borderColor: '#e94e4e',borderWidth:1,backgroundColor: '#fff',}]} onPress={handleEditPress}>
        <Text style={[styles.logoutText,{color:'#e94e4e'}]}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 20,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  field: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#000',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#e94e4e',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
