import { Tabs } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TabBar from "@/components/TabBar";
import { useAuth } from "@/provider/AuthProvider";

export default function OfficerLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="cdashboard" />
<Tabs.Screen name="visits" />
<Tabs.Screen name="list" />
<Tabs.Screen name="profile" />
    </Tabs>
  );
}
