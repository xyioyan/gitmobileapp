// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import TabBar from "@/components/TabBar";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/provider/AuthProvider";

export default function Layout() {
  const { signOut } = useAuth();
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="cdashboard"
        options={{
          title: "Home",
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{margin:5}}>
              <Ionicons name="log-out-outline" size={30} color={"#000"} />
            </TouchableOpacity>
          )
         ,headerShown:false
        }}
      />
      <Tabs.Screen name="visits" options={{ title: "Visit History" ,tabBarHideOnKeyboard:true,headerShown:false}} />
      <Tabs.Screen name="list" options={{ title: "List" ,tabBarHideOnKeyboard:true,headerShown:false}} />
      <Tabs.Screen name="profile" options={{ title: "Profile",tabBarHideOnKeyboard:true,headerShown:false }} />

      {/* Hide tab bar for Camera screen */}
    </Tabs>
  );
}
