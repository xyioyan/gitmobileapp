import { Stack } from 'expo-router';
import { useAuth } from '@/provider/AuthProvider';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Simple stack layout within the authenticated area
const StackLayout = () => {
  const { signOut,session } = useAuth();
// console.log('session',session)
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f0f0f',
        },
        headerTintColor: '#fff',
      }}>
      
        <Stack.Screen
        name="OfficerRealtimeTracking"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Officer Dashboard tracking',
          headerShown:false,
        }}></Stack.Screen>
        <Stack.Screen
        name="MapView"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Track Visits',
          headerShown: false,
          headerBackTitle: "Back"

        }}></Stack.Screen>
        <Stack.Screen
        name="OfficerRealtimeTrackingWeb"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Officer Dashboard tracking',
          headerShown:false,
        }}></Stack.Screen>
        
    </Stack>
  );
};

export default StackLayout;