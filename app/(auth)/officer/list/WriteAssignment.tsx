import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/config/initSupabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  COMPONENTS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "@/src/constants/theme";
import { Picker } from "@react-native-picker/picker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Clerk = {
  id: string;
  name: string;
};

type AssignmentForm = {
  task: string;
  address: string;
  assignedDate: Date;
  completionDate: Date | null;
  clerkId: string | null;
};

export default function AssignmentCreatePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [loadingClerks, setLoadingClerks] = useState(true);
  const [form, setForm] = useState<AssignmentForm>({
    task: "",
    address: "",
    assignedDate: new Date(),
    completionDate: null,
    clerkId: null,
  });
  const [loading, setLoading] = useState(false);
  const [showAssignedDatePicker, setShowAssignedDatePicker] = useState(false);
  const [showCompletionDatePicker, setShowCompletionDatePicker] =
    useState(false);

  // Fetch clerks for dropdown
  const fetchClerkList = async () => {
    setLoadingClerks(true);
    try {
      const { data: userResponse, error: userFetchError } =
        await supabase.auth.getUser();
      if (userFetchError || !userResponse?.user)
        throw userFetchError || new Error("No user");

      const { data: officerData, error: officerError } = await supabase
        .from("users")
        .select("clerks")
        .eq("id", userResponse.user.id)
        .single();

      if (officerError || !officerData) throw officerError;

      const clerkIds: string[] = officerData.clerks || [];
      if (clerkIds.length === 0) {
        setClerks([]);
        return;
      }

      const { data: clerkUsers, error: clerkUsersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", clerkIds);

      if (clerkUsersError) throw clerkUsersError;

      setClerks(
        clerkUsers.map((c) => ({ id: c.id, name: c.name || "Unnamed Clerk" }))
      );
    } catch (error) {
      console.error("Error fetching clerks:", error);
      Alert.alert("Error", "Failed to load clerks");
    } finally {
      setLoadingClerks(false);
    }
  };

  useEffect(() => {
    fetchClerkList();
  }, []);

  const handleDateChange = (
    type: "assigned" | "completion",
    selectedDate?: Date
  ) => {
    if (type === "assigned") {
      setShowAssignedDatePicker(false);
      if (selectedDate) setForm({ ...form, assignedDate: selectedDate });
    } else {
      setShowCompletionDatePicker(false);
      if (selectedDate) setForm({ ...form, completionDate: selectedDate });
    }
  };

  const handleSubmit = async () => {
    if (!form.task || !form.clerkId) {
      Alert.alert("Validation Error", "Task and assigned clerk are required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("assignments").insert({
        task: form.task,
        address: form.address,
        assigned_date: form.assignedDate.toISOString(),
        completion_date: form.completionDate?.toISOString() || null,
        clerk_id: form.clerkId,
        status: "pending",
      });

      if (error) throw error;
      Alert.alert("Success", "Assignment created successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create assignment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 20 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Create New Assignment</Text>

          <View style={[COMPONENTS.card, styles.formCard]}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Task Description*</Text>
              <TextInput
                style={styles.textInput}
                value={form.task}
                onChangeText={(text) => setForm({ ...form, task: text })}
                placeholder="e.g., Site Inspection, Delivery Verification"
                placeholderTextColor={COLORS.gray400}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Full address with landmarks"
                value={form.address}
                onChangeText={(text) => setForm({ ...form, address: text })}
                placeholderTextColor={COLORS.gray400}
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Assigned Clerk*</Text>
              {loadingClerks ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : clerks.length === 0 ? (
                <Text style={styles.noClerksText}>No clerks assigned yet</Text>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.clerkId}
                    onValueChange={(itemValue) =>
                      setForm({ ...form, clerkId: itemValue })
                    }
                    dropdownIconColor={COLORS.primary}
                  >
                    <Picker.Item
                      label="Select a clerk"
                      value={null}
                      color={COLORS.gray400}
                    />
                    {clerks.map((clerk) => (
                      <Picker.Item
                        key={clerk.id}
                        label={clerk.name}
                        value={clerk.id}
                        color={COLORS.gray800}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Assigned Date*</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowAssignedDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>
                  {form.assignedDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              {showAssignedDatePicker && (
                <DateTimePicker
                  value={form.assignedDate}
                  mode="date"
                  display="default"
                  onChange={(_, date) => handleDateChange("assigned", date)}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Completion Date (Optional)</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowCompletionDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>
                  {form.completionDate
                    ? form.completionDate.toLocaleDateString()
                    : "Not set"}
                </Text>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              {showCompletionDatePicker && (
                <DateTimePicker
                  value={form.completionDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, date) => handleDateChange("completion", date)}
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color={COLORS.white}
                  />
                  <Text style={styles.saveButtonText}>Create Assignment</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.medium,
  },
  header: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.gray800,
    marginBottom: SPACING.large,
    textAlign: "center",
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    ...SHADOWS.small,
  },
  formCard: {
    marginBottom: SPACING.large,
    padding: SPACING.medium,
  },
  formGroup: {
    marginBottom: SPACING.medium,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray600,
    marginBottom: SPACING.small,
  },
  textInput: {
    ...COMPONENTS.input,
    minHeight: 100,
    backgroundColor: COLORS.white,
    textAlignVertical: "top",
  },
  dateInput: {
    ...COMPONENTS.input,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.medium,
    backgroundColor: COLORS.white,
  },
  dateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray800,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  noClerksText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    padding: SPACING.medium,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  gradient: {
    paddingVertical: SPACING.medium,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.small,
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});
