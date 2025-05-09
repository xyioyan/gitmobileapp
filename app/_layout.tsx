import { AuthProvider, useAuth } from "@/provider/AuthProvider";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";

const IinitialLayout = () => {
  const { session, initialized } = useAuth();
  const segment = useSegments();
  const router = useRouter();
  console.log("session", session);

  useEffect(() => {
    if (!initialized) return;
    const isAuthGroup = segment[0] === "(auth)";
    const role = session?.user?.user_metadata?.role; // ✅ Correct role access
    
    if (session && !isAuthGroup) {
      if (role === "officer") {
        router.replace("/officer/ODashBoard");
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

      <Slot />
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
