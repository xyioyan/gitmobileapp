import { AuthProvider, useAuth } from "@/provider/AuthProvider";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StatusBar } from "react-native";

const IinitialLayout = () => {
  const { session, initialized } = useAuth();
  const segment = useSegments();
  const router = useRouter();
  const testAvatar = require("@/assets/images/avatar.jpg");
  // console.log('image',testAvatar)
  // console.log("session", session);

  useEffect(() => {
    if (!initialized) return;
    const isAuthGroup = segment[0] === "(auth)";
    const role = session?.user?.user_metadata?.role; // ✅ Correct role access
    
    if (session && !isAuthGroup) {
      if (role === "officer") {
        router.replace("/officer/cdashboard" as never);
      } else if (role === "clerk") {
        router.replace("/clerk/cdashboard" as never);
      }
    } else if (!session && isAuthGroup) {
      router.replace("/");
    }
    
    
  }, [session, initialized, segment]);
  if (!initialized) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <>
     <ActionSheetProvider>

      <Slot />
      </ActionSheetProvider>
    </>
  );
};
const RootLayout = () => {
  return (
   
    <AuthProvider>
      <IinitialLayout />
    </AuthProvider>
   
  );
};
export default RootLayout;
