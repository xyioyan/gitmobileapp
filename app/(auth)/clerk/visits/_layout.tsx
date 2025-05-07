import { Stack } from "expo-router";
import { useAuth } from "@/provider/AuthProvider";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import TabBar from "@/components/TabBar";

// Simple stack layout within the authenticated area
const StackLayout = () => {
  const { signOut, session } = useAuth();
  // console.log("session", session);
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0f0f0f",
          },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen // Navigate to visit history
          name="index"
          redirect={!session} // Redirect to login if not authenticated
          options={{
            headerTitle: "History",
            headerShown: false,
          }}
        ></Stack.Screen>
        <Stack.Screen
          name="PreviewImage" // Navigate to image preview
          redirect={!session} // Redirect to login if not authenticated
          options={{
            headerTitle: "Preview Image",
            headerShown: false,
          }}
        ></Stack.Screen>
        
        <Stack.Screen 
          name="UploadBacklog" // Navigate to Un synced Images
          redirect={!session} // Redirect to login if not authenticated
          options={{
            headerTitle: "History",
            headerShown: false,
          }}
        ></Stack.Screen>
      </Stack>
    </>
  );
};

export default StackLayout;
