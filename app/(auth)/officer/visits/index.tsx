import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Modal,
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
import DateTimePicker from '@react-native-community/datetimepicker';

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

const statusOptions = [
  { label: "All Statuses", value: null },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Completed", value: "completed" },
];

const VisitHistory = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    applyFilters();
  }, [visits, clerkFilter, statusFilter, dateFilter]);

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
        const visitDate = new Date(v.picture_taken_at);
        return (
          visitDate.getDate() === dateFilter.getDate() &&
          visitDate.getMonth() === dateFilter.getMonth() &&
          visitDate.getFullYear() === dateFilter.getFullYear()
        );
      });
    }

    setFilteredVisits(filtered);
  };

  const resetFilters = () => {
    setClerkFilter("");
    setStatusFilter(null);
    setDateFilter(null);
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
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={ICON.medium} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <Text style={TYPOGRAPHY.heading3}>Filter Visits</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={ICON.medium} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Clerk Name</Text>
              <TextInput
                style={COMPONENTS.input}
                placeholder="Search by clerk name"
                value={clerkFilter}
                onChangeText={setClerkFilter}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value || "all"}
                    style={[
                      styles.statusOption,
                      statusFilter === option.value && styles.statusOptionActive,
                    ]}
                    onPress={() => setStatusFilter(option.value)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        statusFilter === option.value &&
                          styles.statusOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date</Text>
              <TouchableOpacity
                style={COMPONENTS.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateInputText}>
                  {dateFilter
                    ? dateFilter.toLocaleDateString()
                    : "Select a date"}
                </Text>
              </TouchableOpacity>
              {dateFilter && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setDateFilter(null)}
                >
                  <Ionicons
                    name="close-circle"
                    size={ICON.small}
                    color={COLORS.gray500}
                  />
                </TouchableOpacity>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dateFilter || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDateFilter(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[COMPONENTS.buttonSecondary, styles.resetButton]}
                onPress={resetFilters}
              >
                <Text style={TYPOGRAPHY.buttonPrimary}>Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={COMPONENTS.buttonPrimary}
                onPress={() => setShowFilters(false)}
              >
                <Text style={TYPOGRAPHY.buttonSecondary}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          data={filteredVisits}
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
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={TYPOGRAPHY.body}>
                Showing {filteredVisits.length} of {visits.length} visits
              </Text>
              {(clerkFilter || statusFilter || dateFilter) && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  filterButton: {
    padding: SPACING.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterPanel: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  filterSection: {
    marginBottom: SPACING.large,
  },
  filterLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.small,
    color: COLORS.gray700,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  statusOption: {
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  statusOptionActive: {
    backgroundColor: COLORS.primary,
  },
  statusOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700,
  },
  statusOptionTextActive: {
    color: COLORS.white,
  },
  dateInputText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700,
  },
  clearDateButton: {
    position: 'absolute',
    right: SPACING.medium,
    top: SPACING.medium + SPACING.small,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.medium,
    marginTop: SPACING.large,
  },
  resetButton: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  clearFiltersText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
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
    top: -10,
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