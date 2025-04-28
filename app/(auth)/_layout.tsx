import { Stack } from 'expo-router';
import { useAuth } from '@/provider/AuthProvider';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Simple stack layout within the authenticated area
const StackLayout = () => {
  const { signOut,session } = useAuth();
console.log('session',session)
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f0f0f',
        },
        headerTintColor: '#fff',
      }}>
      <Stack.Screen
        name="list"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'My Files',
          headerRight: () => (
            <TouchableOpacity onPress={signOut}>
              <Ionicons name="log-out-outline" size={30} color={'#fff'} />
            </TouchableOpacity>
          ),
        }}></Stack.Screen>
    </Stack>
  );
};

export default StackLayout;