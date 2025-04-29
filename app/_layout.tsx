import { AuthProvider, useAuth } from "@/provider/AuthProvider";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

const IinitialLayout = () => {
  const { session, initialized } = useAuth();
  const segment = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    const isAuthGroup = segment[0] === "(auth)";
    if (session && !isAuthGroup) {
      if (session.user?.role === "officer") {
        router.replace("/officer/ODashBoard");
      } else if (session.user?.role === "clerk") {
        router.replace("/clerk/CDashBoard");
      }
    } else if (!session && isAuthGroup) {
      router.replace("/");
    }
    
    
  }, [session, initialized, segment,session?.user?.role]);

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
