import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Modal,
  Pressable,
  ScrollView,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";

// Types
type AssignmentStatus = "pending" | "approval_pending" | "in_progress" | "completed";

export type Assignment = {
  id: string;
  task: string;
  address: string;
  assigned_date: string;
  completion_date: string | null;
  status: AssignmentStatus;
};

type StatusConfig = {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

// Utility Functions
const getStatusConfig = (status: AssignmentStatus): StatusConfig => {
  const configs: Record<AssignmentStatus, StatusConfig> = {
    pending: {
      color: COLORS.warning,
      icon: "time-outline",
      label: "Pending",
    },
    approval_pending: {
      color: COLORS.warning,
      icon: "time-outline",
      label: "Approval Pending",
    },
    in_progress: {
      color: COLORS.info,
      icon: "construct-outline",
      label: "In Progress",
    },
    completed: {
      color: COLORS.success,
      icon: "checkmark-done-outline",
      label: "Completed",
    },
  };

  return configs[status];
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "MMM d, yyyy");
};

// Components
const AssignmentStatusBadge = ({ status }: { status: AssignmentStatus }) => {
  const { color, icon, label } = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: color }]}>
      <Ionicons
        name={icon}
        size={ICON.small}
        color={COLORS.white}
        style={styles.statusIcon}
      />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
};

const AssignmentDetailRow = ({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={ICON.small} color={COLORS.gray500} />
    <Text style={[TYPOGRAPHY.body, styles.detailText]}>{text}</Text>
  </View>
);

const CompletedAssignmentRow = ({
  completionDate,
}: {
  completionDate: string | null;
}) => (
  <View style={styles.completedRow}>
    <Ionicons name="checkmark-done" size={ICON.medium} color={COLORS.success} />
    <Text style={[TYPOGRAPHY.body, styles.completedText]}>
      Completed on {formatDate(completionDate)}
    </Text>
  </View>
);

const AssignmentCard = ({
  item,
  onPress,
  isUpdating,
}: {
  item: Assignment;
  onPress: () => void;
  isUpdating: boolean;
}) => {
  return (
    <View style={[COMPONENTS.card]}>
      <View
        style={[
          styles.cardHeader,
          {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        ]}
      >
        <Text
          style={[TYPOGRAPHY.heading3, { flex: 1 }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.task}
        </Text>
        <AssignmentStatusBadge status={item.status} />
      </View>

      <AssignmentDetailRow icon="location-outline" text={item.address} />
      <AssignmentDetailRow
        icon="calendar-outline"
        text={`Assigned: ${formatDate(item.assigned_date)}`}
      />

      {item.status === "pending" ||
      item.status === "approval_pending" ||
      item.status === "in_progress" ? (
        <TouchableOpacity
          style={[
            COMPONENTS.buttonPrimary,
            (item.status === "in_progress" ||
              item.status === "approval_pending") && {
              backgroundColor:
                item.status === "approval_pending"
                  ? COLORS.warning
                  : COLORS.success,
            },
          ]}
          onPress={onPress}
        >
          {isUpdating ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={TYPOGRAPHY.buttonText}>
              {item.status === "pending"
                ? "Start Assignment"
                : item.status === "approval_pending"
                ? "Awaiting Approval"
                : "View Status"}
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <CompletedAssignmentRow completionDate={item.completion_date} />
      )}
    </View>
  );
};
const FilterModal = ({
  visible,
  onClose,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  applyFilters,
  resetFilters,
}: {
  visible: boolean;
  onClose: () => void;
  statusFilter: AssignmentStatus | null;
  setStatusFilter: (status: AssignmentStatus | null) => void;
  dateFilter: Date | null;
  setDateFilter: (date: Date | null) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={TYPOGRAPHY.heading2}>Filter Assignments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={ICON.medium}
                color={COLORS.gray500}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={TYPOGRAPHY.heading6}>Status</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusScrollContainer}
            >
              {(
                [
                  "pending",
                  "approval_pending",
                  "in_progress",
                  "completed",
                ] as AssignmentStatus[]
              ).map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.statusFilterButton,
                    statusFilter === status && styles.statusFilterButtonActive,
                  ]}
                  onPress={() =>
                    setStatusFilter(statusFilter === status ? null : status)
                  }
                >
                  <AssignmentStatusBadge status={status} />
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Rest of the modal content remains the same */}
          <View style={styles.filterSection}>
            <Text style={TYPOGRAPHY.heading6}>Assigned Date</Text>
            <TouchableOpacity
              style={COMPONENTS.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[
                  TYPOGRAPHY.body,
                  { color: dateFilter ? COLORS.gray900 : COLORS.gray500 },
                ]}
              >
                {dateFilter
                  ? format(dateFilter, "MMM d, yyyy")
                  : "Select a date"}
              </Text>
            </TouchableOpacity>
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
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[COMPONENTS.buttonSecondary, styles.filterButton]}
              onPress={resetFilters}
            >
              <Text style={TYPOGRAPHY.buttonPrimary}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[COMPONENTS.buttonPrimary, styles.filterButton]}
              onPress={applyFilters}
            >
              <Text style={TYPOGRAPHY.buttonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const EmptyState = () => (
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
);

// Main Screen Component
export default function ClerkAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | null>(
    null
  );
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  const fetchAssignments = useCallback(async () => {
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
      const visitStatusMap: Record<string, AssignmentStatus> = {};
      visitData?.forEach((visit) => {
        if (!visit.assignmentId) return;
        if (visit.status === "completed") {
          visitStatusMap[visit.assignmentId] = "completed";
        } else if (visit.status === "pending") {
          visitStatusMap[visit.assignmentId] = "approval_pending";
        } else if (
          visitStatusMap[visit.assignmentId] !== "completed" &&
          visit.status === "approved"
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
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    let filtered = [...assignments];

    if (statusFilter) {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter((a) => {
        const assignedDate = new Date(a.assigned_date);
        return (
          assignedDate.getDate() === dateFilter.getDate() &&
          assignedDate.getMonth() === dateFilter.getMonth() &&
          assignedDate.getFullYear() === dateFilter.getFullYear()
        );
      });
    }

    return filtered;
  }, [assignments, statusFilter, dateFilter]);

  const applyFilters = () => {
    setShowFilters(false);
  };

  const resetFilters = () => {
    setStatusFilter(null);
    setDateFilter(null);
    setShowFilters(false);
  };

  const handleAssignmentPress = (item: Assignment) => {
    router.push({
      pathname: "/clerk/list/VisitAssignment",
      params: {
        id: item.id,
        task: item.task,
        address: item.address,
        assigned_date: item.assigned_date,
      },
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingBottom:
            insets.top + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButtonIcon}
        >
          <Ionicons name="filter" size={ICON.medium} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AssignmentCard
              item={item}
              onPress={() => handleAssignmentPress(item)}
              isUpdating={updatingId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchAssignments}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<EmptyState />}
        />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
      />
    </SafeAreaView>
  );
}

// Styles (same as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  filterButtonIcon: {},
  filterButtons: {
    flexDirection: "row",
    gap: SPACING.medium,
    marginTop: SPACING.medium,
  },
  filterButton: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.medium,
  },
  filterSection: {
    marginBottom: SPACING.large,
  },
  statusFilterContainer: {
    flexDirection: "row",
    gap: SPACING.small,
    marginTop: SPACING.small,
  },
  statusFilterButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  statusScrollContainer: {
    paddingVertical: SPACING.small,
  },
  statusFilterButton: {
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.small, // Add margin between buttons
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
    gap: SPACING.medium,
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
    alignItems: "flex-start",
    marginBottom: SPACING.small,
    gap: SPACING.small,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  statusIcon: {
    marginRight: SPACING.tiny,
  },
  statusText: {
    ...TYPOGRAPHY.heading6,
    color: COLORS.white,
    textTransform: "capitalize",
    includeFontPadding: false,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.small,
    gap: SPACING.small,
  },
  detailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700,
    flexShrink: 1,
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
    fontWeight: "500",
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
    lineHeight: TYPOGRAPHY.heading3.lineHeight,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: SPACING.small,
    paddingHorizontal: SPACING.large,
  },
});
