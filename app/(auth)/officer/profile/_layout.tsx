import { Stack } from "expo-router";
import { useAuth } from "@/provider/AuthProvider";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "@/src/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const StackLayout = () => {
  const { signOut, session } = useAuth();
  const insets = useSafeAreaInsets();

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
          headerTitle: "Profile",
          headerRight: () => (
            <TouchableOpacity 
              onPress={signOut}
              style={{ marginRight: insets.right > 0 ? insets.right : 16 }}
            >
              <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="ProfileEdit"
        redirect={!session}
        options={{
          headerTitle: "Edit Profile",
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'rgba(15, 15, 15, 0.7)',
          },
        }}
      />

    </Stack>
  );
};

export default StackLayout;