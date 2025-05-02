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
        name="CDashBoard"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Clerk Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={signOut}>
              <Ionicons name="log-out-outline" size={30} color={'#fff'} />
            </TouchableOpacity>
          ),
        }}></Stack.Screen>
        <Stack.Screen
        name="WriteDescription"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Write Description',
        }}></Stack.Screen>
         <Stack.Screen
        name="ImagePreview"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Preview Image',
        }}></Stack.Screen>
        <Stack.Screen
        name="Camera"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Clerk Dashboard',
          headerShown: false,
        }}></Stack.Screen>
        <Stack.Screen
        name="list"
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'History',
          headerShown: false,
        }}></Stack.Screen>
    </Stack>
  );
};

export default StackLayout;