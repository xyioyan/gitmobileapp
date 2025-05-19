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
import { FAB } from "react-native-paper";
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
  clerk_name: string;
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
}: {
  item: Assignment;
  onPress: () => void;
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
      <AssignmentDetailRow icon="person-outline" text={`Clerk: ${item.clerk_name}`} />
      <AssignmentDetailRow
        icon="calendar-outline"
        text={`Assigned: ${formatDate(item.assigned_date)}`}
      />

      {item.status === "completed" ? (
        <CompletedAssignmentRow completionDate={item.completion_date} />
      ) : (
        <TouchableOpacity
          style={COMPONENTS.buttonPrimary}
          onPress={onPress}
        >
          <Text style={TYPOGRAPHY.buttonText}>
            {item.status === "approval_pending" ? "Review Approval" : "View Details"}
          </Text>
        </TouchableOpacity>
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
  clerkFilter,
  setClerkFilter,
  clerks,
  applyFilters,
  resetFilters,
}: {
  visible: boolean;
  onClose: () => void;
  statusFilter: AssignmentStatus | null;
  setStatusFilter: (status: AssignmentStatus | null) => void;
  dateFilter: Date | null;
  setDateFilter: (date: Date | null) => void;
  clerkFilter: string;
  setClerkFilter: (name: string) => void;
  clerks: string[];
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
              <Ionicons name="close" size={ICON.medium} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={TYPOGRAPHY.heading6}>Clerk Name</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clerkScrollContainer}
            >
              {clerks.map((clerk) => (
                <Pressable
                  key={clerk}
                  style={[
                    styles.clerkFilterButton,
                    clerkFilter === clerk && styles.clerkFilterButtonActive,
                  ]}
                  onPress={() => setClerkFilter(clerkFilter === clerk ? "" : clerk)}
                >
                  <Text style={TYPOGRAPHY.body}>{clerk}</Text>
                </Pressable>
              ))}
            </ScrollView>
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
                {dateFilter ? format(dateFilter, "MMM d, yyyy") : "Select a date"}
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

const EmptyState = ({ hasAssignments }: { hasAssignments: boolean }) => (
  <View style={styles.emptyState}>
    <Ionicons
      name="document-text-outline"
      size={ICON.xlarge}
      color={COLORS.gray500}
    />
    <Text style={[TYPOGRAPHY.heading3, styles.emptyText]}>
      {hasAssignments ? "No matching assignments" : "No assignments found"}
    </Text>
    <Text style={[TYPOGRAPHY.body, styles.emptySubtext]}>
      {hasAssignments
        ? "Try adjusting your filters"
        : "When assignments are created, they'll appear here"}
    </Text>
  </View>
);

// Main Screen Component
export default function OfficerAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [clerkFilter, setClerkFilter] = useState("");
  const [clerks, setClerks] = useState<string[]>([]);

  const fetchAssignments = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("*, clerk:clerk_id(name)")
        .order("assigned_date", { ascending: false });

      if (assignmentError) {
        throw assignmentError;
      }

      // Format data with clerk names
      const formattedData = assignmentData.map((assignment) => ({
        ...assignment,
        clerk_name: assignment.clerk?.name || "Unknown Clerk",
        status: assignment.status as AssignmentStatus,
      }));

      setAssignments(formattedData);

      // Extract unique clerk names for filter
      const uniqueClerks = Array.from(
        new Set(formattedData.map((a) => a.clerk_name))
      ).sort() as string[];
      setClerks(uniqueClerks);
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

    if (clerkFilter) {
      filtered = filtered.filter((a) =>
        a.clerk_name.toLowerCase().includes(clerkFilter.toLowerCase())
      );
    }

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
  }, [assignments, clerkFilter, statusFilter, dateFilter]);

  const applyFilters = () => {
    setShowFilters(false);
  };

  const resetFilters = () => {
    setStatusFilter(null);
    setDateFilter(null);
    setClerkFilter("");
    setShowFilters(false);
  };

  const handleAssignmentPress = (item: Assignment) => {
    router.push({
      pathname: "/officer/list/VisitAssignment",
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
          paddingBottom: insets.bottom + SPACING.xlarge + SPACING.large + SPACING.large,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={TYPOGRAPHY.heading1}>Assignments Overview</Text>
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
          ListEmptyComponent={<EmptyState hasAssignments={assignments.length > 0} />}
        />
      )}

      <FAB
        style={[styles.fab, { bottom: insets.bottom + SPACING.medium + SPACING.large + SPACING.large + SPACING.large}]}
        icon="plus"
        color={COLORS.white}
        onPress={() => router.push("/officer/list/WriteAssignment")}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        clerkFilter={clerkFilter}
        setClerkFilter={setClerkFilter}
        clerks={clerks}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  filterButtonIcon: {
    padding: SPACING.small,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
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
  statusScrollContainer: {
    paddingVertical: SPACING.small,
  },
  clerkScrollContainer: {
    paddingVertical: SPACING.small,
  },
  statusFilterButton: {
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.small,
  },
  clerkFilterButton: {
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.small,
  },
  statusFilterButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  clerkFilterButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  filterButtons: {
    flexDirection: "row",
    gap: SPACING.medium,
    marginTop: SPACING.medium,
  },
  filterButton: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    right: SPACING.large,
    ...SHADOWS.medium,
  },
});