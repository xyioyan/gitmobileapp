import { Stack } from "expo-router";
import { useAuth } from "@/provider/AuthProvider";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from '@/src/constants/theme';

const StackLayout = () => {
  const { signOut, session } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          ...TYPOGRAPHY.heading3,
          color: COLORS.white,
        },
        headerBackVisible: false, // Updated property
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        redirect={!session}
        options={{
          headerTitle: "Visit History",
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <Stack.Screen
        name="PreviewImage"
        redirect={!session}
        options={{
          headerTitle: "Visit Details",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="maps"
        redirect={!session}
        options={{
          headerTitle: "Pending Uploads",
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ),
        }}
      />
      
    </Stack>
  );
};

export default StackLayout;