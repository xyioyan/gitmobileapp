import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/provider/AuthProvider";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/config/initSupabase";
import ImageItem from "@/components/ImageItem";
import { router } from "expo-router";
// import { View,, StyleSheet } from 'react-native';

interface Visit {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  picture_taken_at: string;
  image_url: string;
  user_id: string;
}

const ListScreen = () => {
  const [visitList, setVisitList] = useState<Visit[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadImages();
  }, [user]);

  const handleNavigation = () => {
    if (Platform.OS === "web") {
      router.push("/officer/OfficerRealtimeTrackingWeb");
    } else {
      router.push("/officer/OfficerRealtimeTracking");
    }
  };

  const loadImages = async () => {
    setLoading(true);
    const { data: userResponse, error: userFetchError } =
      await supabase.auth.getUser();
    if (userFetchError || !userResponse?.user) {
      console.error("Error fetching current user:", userFetchError);
      setLoading(false); // <-- add this
      return;
    }

    const officerId = userResponse.user.id;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("clerks")
      .eq("id", officerId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching officer clerks list:", userError);
      return;
    }

    const clerkIds = userData.clerks;
    if (!clerkIds || clerkIds.length === 0) {
      console.log("No clerks assigned to this officer.");
      setVisitList([]);
      setLoading(false); // <-- add this
      return;
    }

    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select("*")
      .in("user_id", clerkIds);

    if (visitsError) {
      console.error("Error fetching visits:", visitsError);
      setLoading(false); // <-- add this
      return;
    }

    const { data: clerkUsers, error: clerkFetchError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", clerkIds);

    if (clerkFetchError) {
      console.error("Error fetching clerk user info:", clerkFetchError);
      setLoading(false); // <-- add this
      return;
    }

    const clerkNameMap = clerkUsers.reduce((acc, clerk) => {
      acc[clerk.id] = clerk.name;
      return acc;
    }, {} as Record<string, string>);

    const mergedVisits: Visit[] = visits.map((visit: any) => ({
      ...visit,
      name: clerkNameMap[visit.user_id] || "Unknown Clerk",
    }));

    setVisitList(mergedVisits);
    setLoading(false);
  };

  const onSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const img = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(img.uri, {
        encoding: "base64",
      });
      const filePath = `${user!.id}/${Date.now()}.jpg`;
      await supabase.storage.from("photos").upload(filePath, decode(base64), {
        contentType: "image/jpg",
      });
      loadImages();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {visitList.length > 0 ? (
          visitList.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <Text style={styles.name}>👤 {item.name}</Text>
              <Text style={styles.coords}>
                📍 {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
              </Text>
              <Text style={styles.timestamp}>
                🕒 {new Date(item.picture_taken_at).toLocaleString()}
              </Text>
            </View>
          ))
        ) : !loading ? (
          <Text style={styles.emptyMessage}>
            No clerks assigned to this officer.
          </Text>
        ) : null}
      </ScrollView>

      {/* FABs */}
      <TouchableOpacity
        onPress={onSelectImage}
        style={[styles.fab, { left: 20 }]}
      >
        <Ionicons name="camera-outline" size={30} color={"#fff"} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/officer/MapView")}
        style={[styles.fab, { right: 30 }]}
      >
        <Ionicons name="map" size={30} color={"#fff"} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleNavigation}
        style={[styles.fab, { right: 110 }]}
      >
        <Ionicons name="map" size={30} color={"#fff"} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={loadImages}
        style={[styles.fab, { right: 190 }]}
      >
        <Ionicons name="refresh" size={30} color={"#fff"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#151515",
  },
  fab: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    position: "absolute",
    bottom: 40,
    right: 30,
    height: 70,
    backgroundColor: "#2b825b",
    borderRadius: 100,
  },
  card: {
    backgroundColor: "#1f1f1f",
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  name: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 8,
  },
  coords: {
    color: "#ccc",
    marginTop: 4,
  },
  timestamp: {
    color: "#aaa",
    marginTop: 4,
    fontStyle: "italic",
  },
  emptyMessage: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});

export default ListScreen;
