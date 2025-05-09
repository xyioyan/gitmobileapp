import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { supabase } from '@/config/initSupabase';
import { useAuth } from '@/provider/AuthProvider';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS, SHADOWS } from '@/src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen: React.FC = () => {
  const { officerName } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [officer, setOfficer] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?semt=ais_hybrid&w=740');
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const getSession = async () => {
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    };
    getSession();
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else if (data) {
      setFullName(data.name || '');
      setEmail(data.email || '');
      setOfficer(session?.user.user_metadata.officer || '');
      setLocation(data.location || '');
      setPhone(data.phone || '');
    }
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!session) return;
    const userId = session.user.id;

    const { error: authError } = await supabase.auth.updateUser({
      data: { name: fullName },
    });

    if (authError) {
      Alert.alert('Auth Update Error', authError.message);
      return;
    }

    const updates = {
      id: userId,
      location,
      phone,
      updated_at: new Date().toLocaleString(),
    };

    const { error } = await supabase.from('users').update(updates).eq('id', userId);

    if (error) {
      Alert.alert('Update Error', error.message);
    } else {
      Alert.alert('Success', 'Profile updated!');
      router.back();
    }
  };

  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 20 : 0}
      >
        <ScrollView 
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{fullName || 'User'}</Text>
            <Text style={styles.userRole}>{email || 'Email'}</Text>
          </View>

          {/* Profile Form */}
          <View style={[COMPONENTS.card, styles.formCard]}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                value={fullName} 
                onChangeText={setFullName} 
                style={styles.input} 
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.gray400}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.nonEditableInput}>{email}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Officer</Text>
              <Text style={styles.nonEditableInput}>{officerName}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>District</Text>
              <TextInput 
                value={location} 
                onChangeText={setLocation} 
                style={styles.input} 
                placeholder="Enter your district"
                placeholderTextColor={COLORS.gray400}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                value={phone} 
                onChangeText={setPhone} 
                style={styles.input} 
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={updateProfile}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={[styles.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    paddingTop: Platform.OS === 'ios'? 40 : SPACING.xlarge + 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    marginTop: SPACING.medium,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.small,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.small,
    ...SHADOWS.small,
  },
  userName: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.gray800,
    marginBottom: SPACING.tiny,
  },
  userRole: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  formCard: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.primaryDark,
    marginBottom: SPACING.medium,
    paddingBottom: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  inputContainer: {
    marginBottom: SPACING.medium,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray600,
    marginBottom: SPACING.tiny,
  },
  input: {
    ...COMPONENTS.input,
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray300,
  },
  nonEditableInput: {
    ...COMPONENTS.input,
    backgroundColor: COLORS.gray50,
    color: COLORS.gray600,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.medium,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  gradient: {
    paddingVertical: SPACING.medium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.small,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.gray700,
    textAlign: 'center',
    paddingVertical: SPACING.medium,
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});

export default ProfileScreen;


