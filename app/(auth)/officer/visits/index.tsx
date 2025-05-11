import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
// import {  } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/provider/AuthProvider";
import { supabase } from "@/config/initSupabase";
// import { FileObject } from "@supabase/storage-js";
import { router } from "expo-router";
// import { Timestamp } from "react-native-reanimated/lib/typescript/commonTypes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  COMPONENTS,
} from "@/src/constants/theme";
import { StatusBar } from "expo-status-bar";

type Visit = {
  id: number;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  created_at: string;
  picture_taken_at: string;
  completion_image_url: string;
  completion_taken_at: string;
  completion_address:string;
  completion_description: string;
  user_id: string;
  status: string;
  address: string;
};

const VisitHistory = () => {
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  // Inside component:
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVisits();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      await fetchVisits();
      setLoading(false);
    };
    loadData();
  }, [user]);

  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) setVisits(data);
    if (error) console.error("Error fetching visits:", error);
  };

 const onRemoveImage = async (fileName: string) => {
  const fullPath = `${user!.id}/${fileName}`;

  // Remove from storage
  const { error: storageError } = await supabase.storage
    .from("photos")
    .remove([fullPath]);

  if (storageError) {
    console.error("Storage deletion error:", storageError);
    Alert.alert("Failed", "Could not delete image from storage.");
    return;
  }

  // Delete visit entry
  const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(fullPath);

  const { error: dbError } = await supabase
    .from("visits")
    .delete()
    .eq("image_url", publicUrl)
    .eq("user_id", user!.id);

  if (dbError) {
    console.error("Visit deletion error:", dbError);
    Alert.alert("Failed", "Could not delete visit from database.");
  } else {
    Alert.alert("Image deleted", "Image successfully deleted.");
    fetchVisits();
  }
};

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { paddingBottom: insets.bottom + SPACING.xlarge + SPACING.large },
      ]}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + SPACING.xlarge },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {visits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={COLORS.gray500} />
            <Text style={[TYPOGRAPHY.heading3, styles.emptyText]}>
              No visits recorded yet
            </Text>
          </View>
        ) : (
          visits.map((visit) => (
            <TouchableOpacity
              onLongPress={() => {
                const imageUrl = visit.image_url;
                const parts = imageUrl.split("/");
                const fileName = parts[parts.length - 1]; // Extracts 'filename.jpg'

                Alert.alert(
                  "Delete Visit",
                  "Are you sure you want to delete this visit?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => onRemoveImage(fileName),
                    },
                  ]
                );
              }}
              key={visit.id}
              onPress={() =>
                router.push({
                  pathname: "/clerk/visits/PreviewImage",
                  params: {
                    ...visit,
                    photoUri: encodeURIComponent(visit.image_url),
                  },
                })
              }
              style={[COMPONENTS.card, styles.visitCard]}
            >
              {visit.image_url ? (
                <Image
                  style={styles.visitImage}
                  source={{ uri: visit.image_url }}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={32}
                    color={COLORS.gray200}
                  />
                </View>
              )}

              <View style={styles.visitDetails}>
                <Text style={TYPOGRAPHY.body} numberOfLines={1}>
                  <Text style={styles.label}>Status: </Text>
                  <Text
                    style={[
                      styles.statusText,
                      visit.status === "approved"
                        ? styles.approved
                        : visit.status === "pending"
                        ? styles.pending
                        : styles.completed,
                    ]}
                  >
                    {visit.status}
                  </Text>
                </Text>

                {visit.description && (
                  <Text
                    style={[TYPOGRAPHY.body, styles.description]}
                    numberOfLines={2}
                  >
                    {visit.description}
                  </Text>
                )}

                <Text style={[TYPOGRAPHY.caption, styles.dateText]}>
                  {formatDate(visit.picture_taken_at)}
                </Text>

                {visit.address ? (
                  <Text
                    style={[TYPOGRAPHY.caption, styles.address]}
                    numberOfLines={1}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={COLORS.gray500}
                    />
                    {visit.address}
                  </Text>
                ) : (
                  <Text style={[TYPOGRAPHY.caption, styles.coordinates]}>
                    {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContainer: {
    padding: SPACING.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xlarge,
  },
  emptyText: {
    marginTop: SPACING.medium,
    color: COLORS.gray500,
    textAlign: "center",
  },
  visitCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.medium,
    padding: SPACING.medium,
  },
  visitImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  visitDetails: {
    flex: 1,
    paddingLeft: SPACING.medium,
  },
  label: {
    fontWeight: "600",
    color: COLORS.gray800,
  },
  statusText: {
    textTransform: "capitalize",
  },
  approved: {
    color: COLORS.approved,
  },
  pending: {
    color: COLORS.warning,
  },
  completed: {
    color: COLORS.success,
  },
  description: {
    marginTop: SPACING.small,
    color: COLORS.gray800,
  },
  dateText: {
    marginTop: SPACING.tiny,
    color: COLORS.gray500,
  },
  address: {
    marginTop: SPACING.small,
    color: COLORS.gray500,
  },
  coordinates: {
    marginTop: SPACING.small,
    color: COLORS.gray500,
    fontFamily: "monospace",
  },
  fab: {
    position: "absolute",
    right: SPACING.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
});

export default VisitHistory;
