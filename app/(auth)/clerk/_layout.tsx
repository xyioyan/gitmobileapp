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
        name="CDashBoard" // Navigate to clerk dashboard page
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
        name="WriteDescription" // Navigate to write description page
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Write Description',
        }}></Stack.Screen>
         <Stack.Screen
        name="ImagePreview" // Navigate to image preview
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Preview Image',
        }}></Stack.Screen>
        <Stack.Screen
        name="Camera" // Navigate to camera
        redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'Clerk Dashboard',
          headerShown: false,
        }}></Stack.Screen>
        
        <Stack.Screen // Navigate to visit history
        name="VisitHistory"
        //redirect = {!session} // Redirect to login if not authenticated
        options={{
          headerTitle: 'History',
        }}></Stack.Screen>
    </Stack>
  );
};

export default StackLayout;