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
  TextInput,
  Modal,
  Pressable,
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

export type Assignment = {
  id: string;
  task: string;
  address: string;
  assigned_date: string;
  completion_date: string | null;
  status: string;
  clerk_name: string;
};

const AssignmentStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
      <Ionicons
        name={statusConfig.icon as any}
        size={ICON.small}
        color={COLORS.white}
        style={styles.statusIcon}
      />
      <Text style={styles.statusText}>{status.replace("_", " ")}</Text>
    </View>
  );
};

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

export default function OfficerAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [clerkFilter, setClerkFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [clerks, setClerks] = useState<string[]>([]);

  const fetchAssignments = async () => {
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
      }));

      setAssignments(formattedData);
      setFilteredAssignments(formattedData);

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
  };

  const applyFilters = () => {
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

    setFilteredAssignments(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setClerkFilter("");
    setStatusFilter(null);
    setDateFilter(null);
    setFilteredAssignments(assignments);
    setShowFilters(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const renderItem = ({ item }: { item: Assignment }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/officer/list/VisitAssignment",
            params: {
              id: item.id,
              task: item.task,
              address: item.address,
              assigned_date: item.assigned_date,
            },
          })
        }
      >
        <View style={COMPONENTS.card}>
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
              name="person-outline"
              size={ICON.small}
              color={COLORS.gray500}
            />
            <Text style={[TYPOGRAPHY.body, styles.detailText]}>
              Clerk: {item.clerk_name}
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

          {item.status === "completed" && (
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
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingBottom:
            insets.bottom + SPACING.xlarge + SPACING.xlarge + SPACING.medium,
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
                No assignments found
              </Text>
              <Text style={[TYPOGRAPHY.body, styles.emptySubtext]}>
                {assignments.length === 0
                  ? "No assignments have been created yet"
                  : "No assignments match your filters"}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        color={COLORS.white}
        onPress={() => router.push("/officer/list/WriteAssignment")}
      />

      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={TYPOGRAPHY.heading2}>Filter Assignments</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons
                  name="close"
                  size={ICON.medium}
                  color={COLORS.gray500}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={TYPOGRAPHY.heading6}>Clerk Name</Text>
              <TextInput
                style={COMPONENTS.input}
                placeholder="Search by clerk name"
                value={clerkFilter}
                onChangeText={setClerkFilter}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={TYPOGRAPHY.heading6}>Status</Text>
              <View style={styles.statusFilterContainer}>
                {["pending", "in_progress", "completed"].map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.statusFilterButton,
                      statusFilter === status &&
                        styles.statusFilterButtonActive,
                    ]}
                    onPress={() =>
                      setStatusFilter(statusFilter === status ? null : status)
                    }
                  >
                    <AssignmentStatusBadge status={status} />
                  </Pressable>
                ))}
              </View>
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
                  {dateFilter
                    ? dateFilter.toLocaleDateString()
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
  assignmentBadge: {
    position: "absolute",
    top: -25,
    right: SPACING.medium,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.small,
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
    bottom:
      SPACING.small +
      SPACING.xlarge +
      SPACING.xlarge +
      SPACING.xlarge +
      SPACING.xlarge,
    ...SHADOWS.medium,
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
  statusFilterContainer: {
    flexDirection: "row",
    gap: SPACING.small,
    marginTop: SPACING.small,
  },
  statusFilterButton: {
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small,
    backgroundColor: COLORS.gray100,
  },
  statusFilterButtonActive: {
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
});
