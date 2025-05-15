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
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      await fetchVisit();
      setLoading(false);
    };
    loadData();
  }, [user]);

  const fetchVisit = async () => {
    if (!assignmentId || !user?.id) return;

    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .eq("assignmentId", assignmentId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching visit:", error);
      return;
    }

    if (data && data.length > 0) {
      setVisit(data[0]);
    }
  };

  // Load assignment data if needed
  useEffect(() => {
    setLoading(true);
    const fetchAssignment = async () => {
      if (assignmentId && user?.id) {
        const { data, error } = await supabase
          .from("assignments")
          .select("*")
          .eq("clerk_id", user.id)
          .eq("id", assignmentId)
          .single();

        if (data) {
          setAssignmentData(data);
        }
      }
      setLoading(false);
    };

    fetchAssignment();
  }, [assignmentId, user?.id]);
  
  const handleStartAssignment =  () => {
   router.push({
           pathname: "/clerk/cdashboard/Camera",
           params: {
             assignmentId: assignmentId,
           },
         });
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
        { paddingBottom: insets.bottom + SPACING.xlarge },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: insets.bottom + SPACING.xlarge,
            paddingTop: insets.bottom + SPACING.xlarge + 10,
          },
        ]}
      >
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
            <View style={styles.detailsContainer}>
              {/* Status Badge */}
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
                    {String(visit.status).toUpperCase()}
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
              {/* Description */}
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

              {/* Location */}
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
                        Latitude: {visit.latitude}
                      </Text>
                    </View>
                    <View style={styles.coordinateRow}>
                      <Ionicons
                        name="compass"
                        size={16}
                        color={COLORS.gray500}
                      />
                      <Text style={[TYPOGRAPHY.body, styles.value]}>
                        Longitude: {visit.longitude}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Date */}
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

              {/* User ID */}
              {visit.user_id && (
                <View style={styles.detailItem}>
                  <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                    User ID
                  </Text>
                  <View style={styles.userRow}>
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={COLORS.gray500}
                    />
                    <Text
                      style={[TYPOGRAPHY.caption, styles.value]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {visit.user_id}
                    </Text>
                  </View>
                </View>
              )}
              {visit.status === "approved" && !visit.completion_image_url && (
                <View style={styles.completionPhotoContainer}>
                  <TouchableOpacity
                    style={styles.completionPhotoButton}
                    onPress={() =>
                      router.push({
                        pathname: "/clerk/visits/UploadCompletionPhoto",
                        params: {
                          visitId: visit.id.toString(),
                          status: visit.status,
                        },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.completionPhotoGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons
                        name="cloud-upload-outline"
                        size={20}
                        color={COLORS.white}
                      />
                      <Text style={styles.completionPhotoButtonText}>
                        Upload Completion Photo
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {/* Completion Photo Section */}
            {visit.completion_image_url && (
              <>
                <Text
                  style={[
                    TYPOGRAPHY.heading3,
                    { marginTop: SPACING.large, marginBottom: SPACING.small },
                  ]}
                >
                  Completion Photo
                </Text>
                <Image
                  source={{
                    uri: visit.completion_image_url,
                  }}
                  style={styles.preview}
                  resizeMode="cover"
                />

                <View style={styles.detailsContainer}>
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
                  {visit.completion_description && (
                    <View style={styles.detailItem}>
                      <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                        Completion Description
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
                          {new Date(visit.completion_taken_at).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
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
          <View style={styles.imagePlaceholder}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray300} />
            <Text style={[TYPOGRAPHY.heading3, { color: COLORS.gray500 }]}>
              {assignmentData?.status === "pending" 
                ? "Start the assignment to begin" 
                : "No visit data available"}
            </Text>
          </View>
        )}
        {/* Assignment Detail Section */}
        {assignmentData && (
          <>
            <Text
              style={[
                TYPOGRAPHY.heading3,
                { marginTop: SPACING.large, marginBottom: SPACING.small },
              ]}
            >
              Assignment Details
            </Text>
            <View style={styles.detailsContainer}>
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
                    Assigned date
                  </Text>
                  <View style={styles.dateRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={COLORS.gray500}
                    />
                    <Text style={[TYPOGRAPHY.body, styles.value]}>
                      {new Date(
                        assignmentData.assigned_date
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
              {assignmentData.completion_date && (
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
                      {new Date(
                        assignmentData.completion_date
                      ).toLocaleDateString()}
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
              {/* Add the Start Assignment button at the top if status is pending */}
              {assignmentData?.status === "pending" && (
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
   // Add these new styles:
  startAssignmentContainer: {
    marginBottom: SPACING.large,
  },
  startAssignmentButton: {
    ...SHADOWS.medium,
    borderRadius: 12,
    overflow: "hidden",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.medium,
  },
  preview: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: SPACING.medium,
    backgroundColor: COLORS.gray100,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    marginBottom: SPACING.medium,
  },
  completionPhotoContainer: {
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
  completionPhotoButton: {
    ...SHADOWS.medium,
    borderRadius: 12,
    overflow: "hidden",
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
  assignmentBadgeText: {
    ...TYPOGRAPHY.heading6,
    color: COLORS.white,
    marginLeft: SPACING.tiny,
  },
  completionPhotoGradient: {
    paddingVertical: SPACING.medium,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.small,
  },
  completionPhotoButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  detailsContainer: {
    ...COMPONENTS.card,
    borderRadius: 12,
    padding: SPACING.medium,
    backgroundColor: COLORS.white,
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
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: SPACING.tiny,
    paddingHorizontal: SPACING.small,
    borderRadius: 20,
    marginBottom: SPACING.medium,
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
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.tiny,
  },
});
