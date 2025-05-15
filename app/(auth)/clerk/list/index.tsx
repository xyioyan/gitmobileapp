import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { supabase } from "@/config/initSupabase";
import {
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  COMPONENTS,
  ICON,
  BORDER_RADIUS,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

export type Assignment = {
  id: string;
  task: string;
  address: string;
  assigned_date: string;
  completion_date: string | null;
  status: string;
};

export default function ClerkAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setRefreshing(true);
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        throw new Error(userError?.message || "Could not fetch user");
      }

      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("*")
        .eq("clerk_id", user.id)
        .order("assigned_date", { ascending: false });

      if (assignmentError) {
        throw assignmentError;
      }

      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select("id, status, assignmentId")
        .eq("user_id", user.id);

      if (visitError) {
        console.error("Error fetching visits:", visitError);
      }

      // Build a map of assignmentId -> visit status
      const visitStatusMap: Record<string, string> = {};
      visitData?.forEach((visit) => {
        if (!visit.assignmentId) return;
        if (visit.status === "completed") {
          visitStatusMap[visit.assignmentId] = "completed";
        } else if (
          visitStatusMap[visit.assignmentId] !== "completed" &&
          (visit.status === "pending" || visit.status === "approved")
        ) {
          visitStatusMap[visit.assignmentId] = "in_progress";
        }
      });

      const updates =
        assignmentData
          ?.filter((assignment) => {
            const relatedStatus = visitStatusMap[assignment.id] ?? "pending";
            return assignment.status !== relatedStatus;
          })
          .map(async (assignment) => {
            const relatedStatus = visitStatusMap[assignment.id] ?? "pending";
            const updateObj: Partial<Assignment> = { status: relatedStatus };

            if (relatedStatus === "completed") {
              updateObj.completion_date = new Date().toISOString();
            }

            return supabase
              .from("assignments")
              .update(updateObj)
              .eq("id", assignment.id);
          }) || [];

      if (updates.length > 0) {
        await Promise.all(updates);
        // Re-fetch updated assignments
        const { data: updatedAssignments } = await supabase
          .from("assignments")
          .select("*")
          .eq("clerk_id", user.id)
          .order("assigned_date", { ascending: false });

        setAssignments(updatedAssignments || []);
      } else {
        setAssignments(assignmentData || []);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);

    try {
      const updateData: Partial<Assignment> = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("assignments")
        .update(updateData)
        .eq("id", id);

      if (error) {
        throw error;
      }
      await fetchAssignments();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { color: COLORS.warning, icon: "time-outline" };
      case "in_progress":
        return { color: COLORS.info, icon: "construct-outline" };
      case "completed":
        return { color: COLORS.success, icon: "checkmark-done-outline" };
      default:
        return { color: COLORS.gray500, icon: "help-outline" };
    }
  };

  const renderItem = ({ item }: { item: Assignment }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={COMPONENTS.card}>
        <View style={styles.cardHeader}>
          <Text style={TYPOGRAPHY.heading3}>{item.task}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={ICON.small}
              color={COLORS.white}
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>
              {item.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name="location-outline"
            size={ICON.small}
            color={COLORS.gray500}
          />
          <Text style={[TYPOGRAPHY.body, styles.detailText]}>
            {item.address}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name="calendar-outline"
            size={ICON.small}
            color={COLORS.gray500}
          />
          <Text style={[TYPOGRAPHY.body, styles.detailText]}>
            Assigned: {new Date(item.assigned_date).toLocaleDateString()}
          </Text>
        </View>

        {item.status === "pending" ? (
          <TouchableOpacity
            style={COMPONENTS.buttonPrimary}
            onPress={() =>
              router.push({
                pathname: "/clerk/list/VisitAssignment",
                params: {
                  id: item.id,
                  task: item.task,
                  address: item.address,
                  assigned_date: item.assigned_date,
                },
              })
            }
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={TYPOGRAPHY.buttonText}>Start Assignment</Text>
            )}
          </TouchableOpacity>
        ) : item.status === "in_progress" ? (
          <TouchableOpacity
            style={[
              COMPONENTS.buttonPrimary,
              { backgroundColor: COLORS.success },
            ]}
            onPress={() =>
              router.push({
                pathname: "/clerk/list/VisitAssignment",
                params: {
                  id: item.id,
                  task: item.task,
                  address: item.address,
                  assigned_date: item.assigned_date,
                },
              })
            }
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={TYPOGRAPHY.buttonText}>View Status</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.completedRow}>
            <Ionicons
              name="checkmark-done"
              size={ICON.medium}
              color={COLORS.success}
            />
            <Text style={[TYPOGRAPHY.body, styles.completedText]}>
              Completed on{" "}
              {item.completion_date
                ? new Date(item.completion_date).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={TYPOGRAPHY.heading1}>My Assignments</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchAssignments}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={ICON.xlarge}
                color={COLORS.gray500}
              />
              <Text style={[TYPOGRAPHY.heading3, styles.emptyText]}>
                No assignments assigned to you yet
              </Text>
              <Text style={[TYPOGRAPHY.body, styles.emptySubtext]}>
                When you receive new assignments, they'll appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
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
  listContent: {
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    gap: SPACING.medium, // Adds consistent spacing between cards
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Changed to flex-start for better alignment
    marginBottom: SPACING.small,
    gap: SPACING.small, // Added gap for better spacing
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    alignSelf: 'flex-start', // Ensures badge doesn't stretch
    marginTop: 2, // Small visual adjustment
  },
  statusIcon: {
    marginRight: SPACING.tiny,
  },
  statusText: {
    ...TYPOGRAPHY.heading6,
    color: COLORS.white,
    textTransform: "capitalize",
    includeFontPadding: false, // Better text alignment
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.small, // Smaller margin for tighter layout
    gap: SPACING.small, // Added gap for better icon-text spacing
  },
  detailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700, // Darker for better readability
    flexShrink: 1, // Allows text to wrap if needed
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.small,
    paddingTop: SPACING.small,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  completedText: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    marginLeft: SPACING.small,
    fontWeight: '500', // Slightly bolder for emphasis
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xlarge,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    marginHorizontal: SPACING.large,
    ...SHADOWS.small,
  },
  emptyText: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.gray700,
    textAlign: "center",
    marginTop: SPACING.medium,
    lineHeight: TYPOGRAPHY.heading3.lineHeight, // Ensures consistent line height
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: SPACING.small,
    paddingHorizontal: SPACING.large,
  },
});