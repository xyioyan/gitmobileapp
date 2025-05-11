import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/config/initSupabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/provider/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  COMPONENTS,
  SHADOWS,
} from "@/src/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
// import { ActionSheet } from '@expo/react-native-action-sheet';
import { useActionSheet } from "@expo/react-native-action-sheet";
import { decode } from "base64-arraybuffer"; // Make sure this package is installed
import * as FileSystem from "expo-file-system";

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState("");
  const role = session?.user?.user_metadata?.role;
  const [new_profile_image_url, set_new_profile_image_url] = useState<string>();
  const { showActionSheetWithOptions } = useActionSheet();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    officer: "",
    location: "",
    phone: "",
    profile_image_url: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        fetchProfile(session.user.id);
        const officerId = session.user.user_metadata.officer;
        if (officerId) fetchOfficerName(officerId);
      }
    }, [session])
  );

  // Update the uploadAndSetAvatar function:
  const uploadAndSetAvatar = async (uri: string) => {
    try {
      if (!uri.startsWith("file://")) {
        throw new Error("Invalid image URI");
      }

      const userId = session!.user.id;
      const fileExt = uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${userId}/profile_image/avatar.${fileExt}`;
      const contentType = `image/${fileExt === "png" ? "png" : "jpeg"}`;

      // 1. Read the file
      const fileData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 2. Delete existing image if it exists
      const { error: deleteError } = await supabase.storage
        .from("photos")
        .remove([filePath]);

      if (deleteError && deleteError.message !== "Object not found") {
        console.warn("Error deleting old image:", deleteError.message);
      }

      // 3. Upload new image with unique filename
      const uniqueFileName = `avatar_${Date.now()}.${fileExt}`;
      const uniqueFilePath = `${userId}/profile_image/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(uniqueFilePath, decode(fileData), {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 4. Get public URL without cache
      const { data: publicUrlData } = supabase.storage
        .from("photos")
        .getPublicUrl(uniqueFilePath, {
          download: true, // Bypass CDN cache
        });

      const newAvatarUrl = publicUrlData.publicUrl;

      // 5. Update database record
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_image_url: newAvatarUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      // 6. Force update local state
      setProfile((prev) => ({
        ...prev,
        profile_image_url: `${newAvatarUrl}?updated=${Date.now()}`,
      }));

      return newAvatarUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload Error", "Failed to update profile photo");
      return null;
    }
  };

  // Add these functions
  const handleAvatarPress = () => {
    const options = [
      "Take Photo",
      "Choose from Library",
      "Remove Photo",
      "Cancel",
    ];
    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex: 2,
        title: "Change Profile Photo",
      },
      (selectedIndex) => {
        switch (selectedIndex) {
          case 0:
            takePhoto();
            break;
          case 1:
            pickImage();
            break;
          case 2:
            removePhoto();
            break;
          case cancelButtonIndex:
            // Canceled
            break;
        }
      }
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Camera access is needed to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUri = result.assets[0].uri;
      console.log(newUri);
      setAvatarUrl(newUri);
      uploadAndSetAvatar(newUri);
      // Here you would upload the image to your backend
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Library access is needed to select photos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUri = result.assets[0].uri;
      setAvatarUrl(newUri);
      console.log("new", newUri);
      uploadAndSetAvatar(newUri);

      // Here you would upload the image to your backend
    }
  };

  const removePhoto = () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setAvatarUrl(""); // Set to null instead of invalid string path

            // Optional: delete from Supabase or update DB with null
            const { error: updateError } = await supabase
              .from("users")
              .update({ profile_image_url: null })
              .eq("id", session!.user.id);

            if (updateError) {
              console.log(
                "Failed to remove avatar from DB",
                updateError.message
              );
            }
          },
        },
      ]
    );
  };

  const fetchOfficerName = async (officerId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", officerId)
      .single();

    if (error) {
      console.warn("Error fetching officer name:", error.message);
    } else {
      setOfficerName(data.name);
    }
  };

  const handleEditPress = () => {
    router.push({
      pathname: "/clerk/profile/ProfileEdit",
      params: { officerName },
    });
  };

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      Alert.alert("Error loading profile", error.message);
    } else if (data) {
      setProfile({
        full_name: data.name || "",
        email: data.email || "",
        officer: session?.user.user_metadata.officer || "",
        location: data.location || "",
        phone: data.phone || "",
        profile_image_url: data.profile_image_url || "",
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: profile.profile_image_url
                  ? `${
                      profile.profile_image_url.split("?")[0]
                    }?updated=${Date.now()}`
                  : require("@/assets/images/avatar.jpg"),
              }}
              style={styles.avatar}
              key={profile.profile_image_url} // Force re-render when URL changes
              onError={(e) => {
                console.log("Image load error:", e.nativeEvent.error);
                // Fallback to default avatar
                setProfile((prev) => ({ ...prev, profile_image_url: "" }));
              }}
            />

            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleAvatarPress}
            >
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        {/* Profile Details Card */}
        <View style={[COMPONENTS.card, styles.detailsCard]}>
          {role === "clerk" && (
            <View style={styles.field}>
              <Text style={styles.label}>Officer</Text>
              <Text style={styles.value}>{officerName || "N/A"}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {profile.location || "Not specified"}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{profile.phone || "Not specified"}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEditPress}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
};

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
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    marginTop: SPACING.medium,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.medium,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.large,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: SPACING.medium,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  editAvatarButton: {
    ...SHADOWS.small,
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.small,
  },
  name: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.gray800,
    marginBottom: SPACING.tiny,
  },
  email: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  detailsCard: {
    marginBottom: SPACING.large,
  },
  field: {
    marginBottom: SPACING.medium,
    paddingBottom: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    marginBottom: SPACING.tiny,
  },
  value: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray800,
  },
  button: {
    ...SHADOWS.small,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.medium,
    borderRadius: 12,
    marginBottom: SPACING.medium,
  },
  editButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.small,
  },
  editButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: SPACING.small,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.error,
  },
});

export default ProfileScreen;
