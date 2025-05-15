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
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/provider/AuthProvider";
import { supabase } from "@/config/initSupabase";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  COMPONENTS,
  BORDER_RADIUS,
  ICON,
} from "@/src/constants/theme";
import { StatusBar } from "expo-status-bar";
import { Assignment } from "../list";

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
  completion_address: string;
  completion_description: string;
  user_id: string;
  status: string;
  address: string;
  name?: string;
  assignmentId: string;
};

const VisitHistory = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredAssignments, setFilteredAssignments] = useState<Visit[]>([]);
  // const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [clerkFilter, setClerkFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      await loadImages();
      setLoading(false);
    };
    loadData();
  }, [user]);

  const loadImages = async () => {
    setLoading(true);
    const { data: userResponse, error: userFetchError } =
      await supabase.auth.getUser();
    if (userFetchError || !userResponse?.user) {
      console.error("Error fetching current user:", userFetchError);
      setLoading(false);
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
      setLoading(false);
      return;
    }

    const clerkIds = userData.clerks;
    if (!clerkIds || clerkIds.length === 0) {
      console.log("No clerks assigned to this officer.");
      setVisits([]);
      setLoading(false);
      return;
    }

    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select("*")
      .in("user_id", clerkIds)
      .order("created_at", { ascending: false });

    if (visitsError) {
      console.error("Error fetching visits:", visitsError);
      setLoading(false);
      return;
    }

    const { data: clerkUsers, error: clerkFetchError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", clerkIds);

    if (clerkFetchError) {
      console.error("Error fetching clerk user info:", clerkFetchError);
      setLoading(false);
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
    setVisits(mergedVisits);
    setLoading(false);
  };
  // Apply filters
  const applyFilters = () => {
    let filtered = [...visits];

    if (clerkFilter) {
      filtered = filtered.filter((v) =>
        (v.name ?? "").toLowerCase().includes(clerkFilter.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter((v) => {
        const assignedDate = new Date(v.picture_taken_at);
        return (
          assignedDate.getDate() === dateFilter.getDate() &&
          assignedDate.getMonth() === dateFilter.getMonth() &&
          assignedDate.getFullYear() === dateFilter.getFullYear()
        );
      });
    }

    setFilteredAssignments(filtered);
    setShowFilters(false);
  };

  const onRemoveImage = async (fileName: string) => {
    const fullPath = `${user!.id}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from("photos")
      .remove([fullPath]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      Alert.alert("Failed", "Could not delete image from storage.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(fullPath);

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
      loadImages();
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { color: COLORS.warning, icon: "time-outline" };
      case "approved":
        return { color: COLORS.info, icon: "checkmark-circle-outline" };
      case "completed":
        return { color: COLORS.success, icon: "checkmark-done-outline" };
      default:
        return { color: COLORS.gray500, icon: "help-outline" };
    }
  };
  const resetFilters = () => {
    setClerkFilter("");
    setStatusFilter(null);
    setDateFilter(null);
    setFilteredAssignments(visits);
    setShowFilters(false);
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
        styles.container,
        {
          paddingBottom:
            insets.bottom + SPACING.xlarge + SPACING.large + SPACING.large,
        },
      ]}
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={TYPOGRAPHY.heading1}>Visit History</Text>
      </View>

      {visits.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={ICON.xlarge}
            color={COLORS.gray500}
          />
          <Text style={[TYPOGRAPHY.heading3, styles.emptyText]}>
            No visits recorded yet
          </Text>
          <Text style={[TYPOGRAPHY.body, styles.emptySubtext]}>
            When your clerks record visits, they'll appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => {
                const imageUrl = item.image_url;
                const parts = imageUrl.split("/");
                const fileName = parts[parts.length - 1];
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
              onPress={() =>
                router.push({
                  pathname: "/officer/visits/PreviewImage",
                  params: {
                    ...item,
                    photoUri: encodeURIComponent(item.image_url),
                  },
                })
              }
              style={[
                COMPONENTS.card,
                styles.visitCard,
                item.assignmentId && styles.assignmentCard,
              ]}
            >
              {item.assignmentId && (
                <View style={styles.assignmentBadge}>
                  <Ionicons
                    name="briefcase-outline"
                    size={14}
                    color={COLORS.white}
                  />
                  <Text style={styles.assignmentBadgeText}>Assignment</Text>
                </View>
              )}
              {item.image_url ? (
                <Image
                  style={styles.visitImage}
                  source={{ uri: item.image_url }}
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
                <View style={styles.cardHeader}>
                  {item.name && (
                    <Text style={TYPOGRAPHY.heading4}>{item.name}</Text>
                  )}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusConfig(item.status).color },
                    ]}
                  >
                    <Ionicons
                      name={getStatusConfig(item.status).icon as any}
                      size={ICON.small}
                      color={COLORS.white}
                      style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>
                      {item.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text
                    style={[TYPOGRAPHY.body, styles.description]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}

                <View style={styles.detailRow}>
                  <Ionicons
                    name="time-outline"
                    size={ICON.small}
                    color={COLORS.gray500}
                  />
                  <Text style={[TYPOGRAPHY.caption, styles.detailText]}>
                    {formatDate(item.picture_taken_at)}
                  </Text>
                </View>

                {item.address ? (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="location-outline"
                      size={ICON.small}
                      color={COLORS.gray500}
                    />
                    <Text style={[TYPOGRAPHY.caption, styles.detailText]}>
                      {item.address}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="map-outline"
                      size={ICON.small}
                      color={COLORS.gray500}
                    />
                    <Text style={[TYPOGRAPHY.caption, styles.detailText]}>
                      {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  assignmentCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  assignmentBadgeText: {
    ...TYPOGRAPHY.heading6,
    color: COLORS.white,
    marginLeft: SPACING.tiny,
  },
  assignmentBadge: {
    position: "absolute",
    top: -8,
    right: SPACING.medium,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  listContent: {
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    gap: SPACING.medium,
  },
  visitCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.medium,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.small,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
  },
  statusIcon: {
    marginRight: SPACING.tiny,
  },
  statusText: {
    ...TYPOGRAPHY.heading6,
    color: COLORS.white,
    textTransform: "capitalize",
  },
  visitImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.gray100,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  visitDetails: {
    flex: 1,
    paddingLeft: SPACING.medium,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.small,
    gap: SPACING.small,
  },
  detailText: {
    color: COLORS.gray700,
  },
  description: {
    color: COLORS.gray800,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xlarge,
  },
  emptyText: {
    color: COLORS.gray700,
    textAlign: "center",
    marginTop: SPACING.medium,
  },
  emptySubtext: {
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: SPACING.small,
    paddingHorizontal: SPACING.large,
  },
});

export default VisitHistory;
// import {
//   View,
//   StyleSheet,
//   Image,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   Platform,
// } from "react-native";
// import React, { useEffect, useState } from "react";
// import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker";
// import { useAuth } from "@/provider/AuthProvider";
// import * as FileSystem from "expo-file-system";
// import { decode } from "base64-arraybuffer";
// import { supabase } from "@/config/initSupabase";
// import ImageItem from "@/components/ImageItem";
// import { router } from "expo-router";
// // import { View,, StyleSheet } from 'react-native';

// interface Visit {
//   id: string;
//   name: string;
//   latitude: number;
//   longitude: number;
//   picture_taken_at: string;
//   image_url: string;
//   user_id: string;
// }

// const ListScreen = () => {
//   const [visitList, setVisitList] = useState<Visit[]>([]);
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!user) return;
//     loadImages();
//   }, [user]);

//   const handleNavigation = () => {
//     if (Platform.OS === "web") {
//       router.push("/officer/visits/maps/OfficerRealtimeTrackingWeb");
//     } else {
//       router.push("/officer/visits/maps/OfficerRealtimeTracking");
//     }
//   };

//   const loadImages = async () => {
//     setLoading(true);
//     const { data: userResponse, error: userFetchError } =
//       await supabase.auth.getUser();
//     if (userFetchError || !userResponse?.user) {
//       console.error("Error fetching current user:", userFetchError);
//       setLoading(false); // <-- add this
//       return;
//     }

//     const officerId = userResponse.user.id;

//     const { data: userData, error: userError } = await supabase
//       .from("users")
//       .select("clerks")
//       .eq("id", officerId)
//       .single();

//     if (userError || !userData) {
//       console.error("Error fetching officer clerks list:", userError);
//       return;
//     }

//     const clerkIds = userData.clerks;
//     if (!clerkIds || clerkIds.length === 0) {
//       console.log("No clerks assigned to this officer.");
//       setVisitList([]);
//       setLoading(false); // <-- add this
//       return;
//     }

//     const { data: visits, error: visitsError } = await supabase
//       .from("visits")
//       .select("*")
//       .in("user_id", clerkIds);

//     if (visitsError) {
//       console.error("Error fetching visits:", visitsError);
//       setLoading(false); // <-- add this
//       return;
//     }

//     const { data: clerkUsers, error: clerkFetchError } = await supabase
//       .from("users")
//       .select("id, name")
//       .in("id", clerkIds);

//     if (clerkFetchError) {
//       console.error("Error fetching clerk user info:", clerkFetchError);
//       setLoading(false); // <-- add this
//       return;
//     }

//     const clerkNameMap = clerkUsers.reduce((acc, clerk) => {
//       acc[clerk.id] = clerk.name;
//       return acc;
//     }, {} as Record<string, string>);

//     const mergedVisits: Visit[] = visits.map((visit: any) => ({
//       ...visit,
//       name: clerkNameMap[visit.user_id] || "Unknown Clerk",
//     }));

//     setVisitList(mergedVisits);
//     setLoading(false);
//   };

//   const onSelectImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//     });

//     if (!result.canceled) {
//       const img = result.assets[0];
//       const base64 = await FileSystem.readAsStringAsync(img.uri, {
//         encoding: "base64",
//       });
//       const filePath = `${user!.id}/${Date.now()}.jpg`;
//       await supabase.storage.from("photos").upload(filePath, decode(base64), {
//         contentType: "image/jpg",
//       });
//       loadImages();
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <ScrollView>
//         {visitList.length > 0 ? (
//           visitList.map((item) => (
//             <View key={item.id} style={styles.card}>
//               <Image source={{ uri: item.image_url }} style={styles.image} />
//               <Text style={styles.name}>👤 {item.name}</Text>
//               <Text style={styles.coords}>
//                 📍 {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
//               </Text>
//               <Text style={styles.timestamp}>
//                 🕒 {new Date(item.picture_taken_at).toLocaleString()}
//               </Text>
//             </View>
//           ))
//         ) : !loading ? (
//           <Text style={styles.emptyMessage}>
//             No clerks assigned to this officer.
//           </Text>
//         ) : null}
//       </ScrollView>

//       {/* FABs */}
//       <TouchableOpacity
//         onPress={onSelectImage}
//         style={[styles.fab, { left: 20 }]}
//       >
//         <Ionicons name="camera-outline" size={30} color={"#fff"} />
//       </TouchableOpacity>
//       <TouchableOpacity
//         onPress={() => router.push("/officer/visits/maps/MapView")}
//         style={[styles.fab, { right: 30 }]}
//       >
//         <Ionicons name="map" size={30} color={"#fff"} />
//       </TouchableOpacity>
//       <TouchableOpacity
//         onPress={handleNavigation}
//         style={[styles.fab, { right: 110 }]}
//       >
//         <Ionicons name="map" size={30} color={"#fff"} />
//       </TouchableOpacity>
//       <TouchableOpacity
//         onPress={loadImages}
//         style={[styles.fab, { right: 190 }]}
//       >
//         <Ionicons name="refresh" size={30} color={"#fff"} />
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "#151515",
//   },
//   fab: {
//     borderWidth: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     width: 70,
//     position: "absolute",
//     bottom: 40,
//     right: 30,
//     height: 70,
//     backgroundColor: "#2b825b",
//     borderRadius: 100,
//   },
//   card: {
//     backgroundColor: "#1f1f1f",
//     padding: 10,
//     borderRadius: 12,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: "#333",
//   },
//   image: {
//     width: "100%",
//     height: 200,
//     borderRadius: 8,
//   },
//   name: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 16,
//     marginTop: 8,
//   },
//   coords: {
//     color: "#ccc",
//     marginTop: 4,
//   },
//   timestamp: {
//     color: "#aaa",
//     marginTop: 4,
//     fontStyle: "italic",
//   },
//   emptyMessage: {
//     color: "#aaa",
//     fontSize: 16,
//     textAlign: "center",
//     marginTop: 40,
//   },
// });

// export default ListScreen;
