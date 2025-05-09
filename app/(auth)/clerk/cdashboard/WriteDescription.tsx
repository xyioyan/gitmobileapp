import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
  Modal,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function WriteDescription() {
  // ... [Keep all your existing state and logic] ...
  const {
    photoUri,
    description,
    userId,
    latitude,
    longitude,
    timestamp,
    address,
    status,
  } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");

  const imageUri =
    typeof photoUri === "string" ? decodeURIComponent(photoUri) : "";
  const [newDescription, setNewDescription] = useState(description as string);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [imageExists, setImageExists] = useState(false);

  useEffect(() => {
    const checkFileExistence = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
          setImageExists(true);
        }
      } catch (err) {
        console.error("Error checking file existence:", err);
      }
    };

    if (imageUri) checkFileExistence();
  }, [imageUri]);

  const handleSave = async () => {
    Alert.alert("Saving visit ....");
    if (!imageUri || !userId || !timestamp || !latitude || !longitude) {
      Alert.alert("Missing data", "Cannot save without required fields.");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        const { saveVisitLocally } = await import("@/storage/offlineQueue");
        saveVisitLocally({
          photoUri: imageUri,
          description: newDescription,
          latitude: parseFloat(latitude as string),
          longitude: parseFloat(longitude as string),
          userId: userId as string,
          timestamp: timestamp as string,
          address: (address as string) ?? "Unknown",
        });
        router.replace("/clerk/CDashBoard" as never);
      }
    } catch (err) {
      Alert.alert("❌ Error", "Failed to save visit locally.");
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.select({
          ios: insets.top + 20,
          android: 20
        })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Inspection Report</Text>
            <Text style={styles.headerSubtitle}>Complete your field notes</Text>
          </View>

          {/* Image Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Field Photo</Text>
            {imageExists ? (
              <TouchableOpacity 
                onPress={() => setFullScreenVisible(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                <View style={styles.imageBadge}>
                  <Ionicons name="expand" size={18} color="white" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noImage}>
                <Ionicons name="camera-outline" size={32} color="#94a3b8" />
                <Text style={styles.noImageText}>No photo captured</Text>
              </View>
            )}
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color="#64748b" />
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{address || "Not specified"}</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Latitude</Text>
                <Text style={styles.gridValue}>{latitude}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Longitude</Text>
                <Text style={styles.gridValue}>{longitude}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Timestamp</Text>
                <Text style={styles.gridValue}>{timestamp}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Status</Text>
                <Text style={[
                  styles.gridValue,
                  status === "Completed" ? styles.statusSuccess : styles.statusPending
                ]}>
                  {status}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Inspection Notes</Text>
            <TextInput
              style={styles.textInput}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Enter detailed observations..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4f46e5', '#7c3aed']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.saveButtonText}>Submit Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={fullScreenVisible}
        transparent={false}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setFullScreenVisible(false)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullscreenImage}
            contentFit="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ===== Base Styles =====
  safeArea: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },

  // ===== Header =====
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },

  // ===== Cards =====
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },

  // ===== Image Styles =====
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 8,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 20,
  },
  noImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  noImageText: {
    marginTop: 8,
    color: '#94a3b8',
  },

  // ===== Detail Styles =====
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1e293b',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  statusSuccess: {
    color: '#10b981',
  },
  statusPending: {
    color: '#f59e0b',
  },

  // ===== Input =====
  textInput: {
    minHeight: 120,
    fontSize: 15,
    lineHeight: 22,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
  },

  // ===== Button =====
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  gradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // ===== Modal =====
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: width,
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 10,
  },
});