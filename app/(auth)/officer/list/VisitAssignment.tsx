import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  COMPONENTS,
  SHADOWS,
  BORDER_RADIUS,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/config/initSupabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/provider/AuthProvider";
import Toast from "react-native-toast-message";

export type Assignment = {
  id: string;
  task: string;
  address: string;
  assigned_date: string;
  completion_date: string | null;
  status: string;
};

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
  assignmentId: string | null;
};

export default function VisitDetails() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [assignmentData, setAssignmentData] = useState<Assignment | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);

  const assignmentId = params.id as string;
  const imageUri = visit?.image_url || "";
  const formattedDate = visit?.picture_taken_at
    ? new Date(visit.picture_taken_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Invalid date";

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchVisit(), fetchAssignment()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, assignmentId]);

  const fetchVisit = async () => {
    if (!assignmentId || !user?.id) return;

    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .eq("assignmentId", assignmentId)
      // .eq("user_id", visit.user_id)
      // .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching visit:", error);
      return;
    }
    console.log(data);
    setVisit(data?.[0] || null); // Take first item if exists, otherwise null
  };

  const fetchAssignment = async () => {
    if (!assignmentId || !user?.id) return;

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (error) {
      console.error("Error fetching assignment:", error);
      return;
    }

    setAssignmentData(data);
  };

  const handleStartAssignment = () => {
    router.push({
      pathname: "/clerk/cdashboard/Camera",
      params: { assignmentId },
    });
  };

  const handleApproveVisit = async () => {
    if (!visit) return;

    try {
      const { error } = await supabase
        .from("visits")
        .update({ status: "approved" })
        .eq("id", visit.id);
      console.log("while upload : ", error);

      if (error) {
        console.error("Approval failed:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to approve the visit.",
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Visit approved successfully.",
      });

      router.back(); // or refresh logic here
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingBottom: insets.bottom + SPACING.medium,
          paddingTop: insets.top + SPACING.tiny + SPACING.large,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + SPACING.large },
        ]}
      >
        {/* Assignment Status Section */}
        {visit?.status === "pending" && !visit && (
          <View style={styles.startAssignmentContainer}>
            <TouchableOpacity
              style={styles.startAssignmentButton}
              onPress={handleStartAssignment}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.startAssignmentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name="play-circle-outline"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.startAssignmentButtonText}>
                  Start Assignment
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Visit Image Section */}
        {visit ? (
          <>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.preview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={COLORS.gray300}
                />
                <Text style={[TYPOGRAPHY.heading3, { color: COLORS.gray500 }]}>
                  No image available
                </Text>
              </View>
            )}

            {/* Visit Details Section */}
            <View style={styles.detailsContainer}>
              <View style={styles.badgeContainer}>
                {visit.status && (
                  <View
                    style={[
                      styles.statusBadge,
                      visit.status === "completed"
                        ? styles.completedBadge
                        : visit.status === "approved"
                        ? styles.approvedBadge
                        : styles.pendingBadge,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {visit.status.toUpperCase()}
                    </Text>
                  </View>
                )}
                {assignmentId && (
                  <View style={styles.assignmentBadge}>
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color={COLORS.white}
                    />
                    <Text style={styles.assignmentBadgeText}>Assignment</Text>
                  </View>
                )}
              </View>

              {visit.description && (
                <View style={styles.detailItem}>
                  <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                    Description
                  </Text>
                  <Text style={[TYPOGRAPHY.body, styles.value]}>
                    {visit.description}
                  </Text>
                </View>
              )}

              <View style={styles.detailItem}>
                <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                  Location
                </Text>
                {visit.address ? (
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={[TYPOGRAPHY.body, styles.value]}>
                      {visit.address}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.coordinatesContainer}>
                    <View style={styles.coordinateRow}>
                      <Ionicons
                        name="locate"
                        size={16}
                        color={COLORS.gray500}
                      />
                      <Text style={[TYPOGRAPHY.body, styles.value]}>
                        Latitude: {visit.latitude.toFixed(6)}
                      </Text>
                    </View>
                    <View style={styles.coordinateRow}>
                      <Ionicons
                        name="compass"
                        size={16}
                        color={COLORS.gray500}
                      />
                      <Text style={[TYPOGRAPHY.body, styles.value]}>
                        Longitude: {visit.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.detailItem}>
                <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                  Date Recorded
                </Text>
                <View style={styles.dateRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={COLORS.gray500}
                  />
                  <Text style={[TYPOGRAPHY.body, styles.value]}>
                    {formattedDate}
                  </Text>
                </View>
              </View>

              {/* Approve Button for Pending Visits */}
              {visit.status === "pending" && !visit.completion_image_url && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleApproveVisit}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.actionButtonText}>Approve Visit</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Completion Section */}
            {visit.completion_image_url && (
              <>
                <Text style={styles.sectionTitle}>Completion Details</Text>
                <Image
                  source={{ uri: visit.completion_image_url }}
                  style={styles.preview}
                  resizeMode="cover"
                />
                <View style={styles.detailsContainer}>
                  {visit.completion_description && (
                    <View style={styles.detailItem}>
                      <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                        Completion Notes
                      </Text>
                      <Text style={[TYPOGRAPHY.body, styles.value]}>
                        {visit.completion_description}
                      </Text>
                    </View>
                  )}
                  {visit.completion_taken_at && (
                    <View style={styles.detailItem}>
                      <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                        Completion Time
                      </Text>
                      <View style={styles.dateRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={COLORS.gray500}
                        />
                        <Text style={[TYPOGRAPHY.body, styles.value]}>
                          {new Date(visit.completion_taken_at).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}
                  {visit.completion_address && (
                    <View style={styles.detailItem}>
                      <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                        Completion Location
                      </Text>
                      <View style={styles.locationRow}>
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color={COLORS.primary}
                        />
                        <Text style={[TYPOGRAPHY.body, styles.value]}>
                          {visit.completion_address}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={COLORS.gray300}
            />
            <Text style={[TYPOGRAPHY.heading3, styles.emptyStateText]}>
              {assignmentData?.status === "pending"
                ? "Start the assignment to begin"
                : "No visit data available"}
            </Text>
          </View>
        )}

        {/* Assignment Details Section */}
        {assignmentData && (
          <>
            <Text style={styles.sectionTitle}>Assignment Details</Text>
            <View style={styles.detailsContainer}>
              {assignmentData.task && (
                <View style={styles.detailItem}>
                  <Text style={[TYPOGRAPHY.heading4, styles.label]}>Task</Text>
                  <Text style={[TYPOGRAPHY.body, styles.value]}>
                    {assignmentData.task}
                  </Text>
                </View>
              )}
              {assignmentData.assigned_date && (
                <View style={styles.detailItem}>
                  <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                    Assigned Date
                  </Text>
                  <View style={styles.dateRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={COLORS.gray500}
                    />
                    <Text style={[TYPOGRAPHY.body, styles.value]}>
                      {new Date(assignmentData.assigned_date).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
              {assignmentData.completion_date && (
                <View style={styles.detailItem}>
                  <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                    Completion Date
                  </Text>
                  <View style={styles.dateRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={COLORS.gray500}
                    />
                    <Text style={[TYPOGRAPHY.body, styles.value]}>
                      {new Date(
                        assignmentData.completion_date
                      ).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
              {assignmentData.address && (
                <View style={styles.detailItem}>
                  <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                    Location
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={[TYPOGRAPHY.body, styles.value]}>
                      {assignmentData.address}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xlarge,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    margin: SPACING.medium,
  },
  emptyStateText: {
    color: COLORS.gray500,
    marginTop: SPACING.small,
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: 250,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.medium,
    backgroundColor: COLORS.gray100,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.medium,
  },
  detailsContainer: {
    ...COMPONENTS.card,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  badgeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.medium,
  },
  statusBadge: {
    paddingVertical: SPACING.tiny,
    paddingHorizontal: SPACING.small,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "flex-start",
  },
  completedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  approvedBadge: {
    backgroundColor: "rgba(202, 211, 15, 0.1)",
  },
  pendingBadge: {
    backgroundColor: "rgba(245, 109, 11, 0.1)",
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
  },
  assignmentBadge: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    borderRadius: BORDER_RADIUS.full,
  },
  assignmentBadgeText: {
    ...TYPOGRAPHY.heading6,
    color: COLORS.white,
    marginLeft: SPACING.tiny,
  },
  detailItem: {
    marginBottom: SPACING.large,
  },
  label: {
    color: COLORS.gray800,
    marginBottom: SPACING.tiny,
  },
  value: {
    color: COLORS.gray700,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.tiny,
  },
  coordinatesContainer: {
    gap: SPACING.tiny,
  },
  coordinateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.tiny,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.tiny,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    marginVertical: SPACING.small,
  },
  startAssignmentContainer: {
    marginBottom: SPACING.large,
  },
  startAssignmentButton: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: "hidden",
    ...SHADOWS.medium,
  },
  startAssignmentGradient: {
    paddingVertical: SPACING.medium,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.small,
  },
  startAssignmentButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  actionButton: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: "hidden",
    marginTop: SPACING.medium,
    ...SHADOWS.small,
  },
  actionButtonGradient: {
    paddingVertical: SPACING.medium,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.small,
  },
  actionButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});
