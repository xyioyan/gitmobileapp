import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, TYPOGRAPHY, COMPONENTS } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function VisitDetails() {
  const insets = useSafeAreaInsets();
  const {
    photoUri,
    description,
    user_id,
    latitude,
    longitude,
    picture_taken_at,
    address,
    status,
  } = useLocalSearchParams();

  const imageUri =
    typeof photoUri === "string" ? decodeURIComponent(photoUri) : "";
  const formattedDate =
    picture_taken_at && typeof picture_taken_at === "string"
      ? new Date(picture_taken_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Invalid date";

  if (!photoUri) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea,{ paddingBottom: insets.bottom + SPACING.xlarge }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + SPACING.xlarge },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={COLORS.gray300} />
            <Text style={[TYPOGRAPHY.heading3, { color: COLORS.gray500 }]}>
              No image available
            </Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          {/* Status Badge */}
          {status && (
            <View
              style={[
                styles.statusBadge,
                status === "completed"
                  ? styles.completedBadge
                  : styles.pendingBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {String(status).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Description */}
          {description && (
            <View style={styles.detailItem}>
              <Text style={[TYPOGRAPHY.heading4, styles.label]}>
                Description
              </Text>
              <Text style={[TYPOGRAPHY.body, styles.value]}>{description}</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.detailItem}>
            <Text style={[TYPOGRAPHY.heading4, styles.label]}>Location</Text>
            {address ? (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={[TYPOGRAPHY.body, styles.value]}>{address}</Text>
              </View>
            ) : (
              <View style={styles.coordinatesContainer}>
                <View style={styles.coordinateRow}>
                  <Ionicons name="locate" size={16} color={COLORS.gray500} />
                  <Text style={[TYPOGRAPHY.body, styles.value]}>
                    Latitude: {latitude}
                  </Text>
                </View>
                <View style={styles.coordinateRow}>
                  <Ionicons name="compass" size={16} color={COLORS.gray500} />
                  <Text style={[TYPOGRAPHY.body, styles.value]}>
                    Longitude: {longitude}
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
              <Ionicons name="time-outline" size={16} color={COLORS.gray500} />
              <Text style={[TYPOGRAPHY.body, styles.value]}>
                {formattedDate}
              </Text>
            </View>
          </View>

          {/* User ID */}
          {user_id && (
            <View style={styles.detailItem}>
              <Text style={[TYPOGRAPHY.heading4, styles.label]}>User ID</Text>
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
                  {user_id}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  pendingBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
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
