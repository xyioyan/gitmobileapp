import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, Linking, Modal, TextInput, FlatList } from "react-native";
import WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { supabase } from "@/config/initSupabase";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/src/constants/theme";
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from "expo-router";

interface Visit {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  picture_taken_at: string;
  image_url: string;
  user_id: string;
}

interface Clerk {
  id: string;
  name: string;
}

const OfficerLocationTrackingWeb = () => {
  const [clerkLocations, setClerkLocations] = useState<Record<string, Visit>>({});
  const [filteredLocations, setFilteredLocations] = useState<Record<string, Visit>>({});
  const [selectedClerk, setSelectedClerk] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [clerksList, setClerksList] = useState<Clerk[]>([]);
  const [selectedClerks, setSelectedClerks] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchVisitsForOfficer = async () => {
    const { data: userResponse, error: userFetchError } = await supabase.auth.getUser();
  
    if (userFetchError || !userResponse?.user) {
      console.error("Error fetching current user:", userFetchError);
      return;
    }
  
    const officerId = userResponse.user.id;
  
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("clerks")
      .eq("id", officerId)
      .single();
  
    if (userError || !userData) {
      console.error("Error fetching officer clerks list:", userError);
      return;
    }
  
    const clerkIds = userData.clerks;
  
    if (!clerkIds || clerkIds.length === 0) {
      console.log("No clerks assigned to this officer.");
      setClerkLocations({});
      setFilteredLocations({});
      return;
    }
  
    // Fetch clerk names first
    const { data: clerkUsers, error: clerkFetchError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", clerkIds);
  
    if (clerkFetchError) {
      console.error("Error fetching clerk user info:", clerkFetchError);
      return;
    }
  
    setClerksList(clerkUsers);
  
    // Fetch visits with clerk names
    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select("*")
      .in("user_id", clerkIds);
  
    if (visitsError) {
      console.error("Error fetching visits:", visitsError);
      return;
    }
  
    const clerkNameMap = clerkUsers.reduce((acc, clerk) => {
      acc[clerk.id] = clerk.name;
      return acc;
    }, {} as Record<string, string>);
  
    const locations: Record<string, Visit> = {};
    visits.forEach((visit: Visit & { user_id: string }) => {
      locations[visit.id] = {
        ...visit,
        name: clerkNameMap[visit.user_id] || "Unknown Clerk",
      };
    });
  
    setClerkLocations(locations);
    setFilteredLocations(locations);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = {...clerkLocations};
    
    // Filter by selected clerks
    if (selectedClerks.length > 0) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, visit]) => 
          selectedClerks.includes(visit.user_id)
        )
      );
    }
    
    // Filter by date range
    if (startDate) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, visit]) => 
          new Date(visit.picture_taken_at) >= startDate
        )
      );
    }
    
    if (endDate) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, visit]) => 
          new Date(visit.picture_taken_at) <= endDate
        )
      );
    }
    
    setFilteredLocations(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSelectedClerks([]);
    setStartDate(null);
    setEndDate(null);
    setFilteredLocations(clerkLocations);
    setShowFilters(false);
  };

  const toggleClerkSelection = (clerkId: string) => {
    setSelectedClerks(prev => 
      prev.includes(clerkId) 
        ? prev.filter(id => id !== clerkId) 
        : [...prev, clerkId]
    );
  };

  const getUserLocation = async () => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (canAskAgain) {
          Alert.alert(
            "Permission Required",
            "We need your location to center the map on your position.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Try Again", onPress: getUserLocation }
            ]
          );
        } else {
          Alert.alert(
            "Permission Denied",
            "Location permission is permanently denied. Please enable it in settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      return location.coords;
    } catch (err) {
      console.error("Error getting location:", err);
      return null;
    }
  };

  const centerOnUserLocation = async () => {
    const coords = await getUserLocation();
    if (coords) {
      const js = `
        if (map) {
          map.setView([${coords.latitude}, ${coords.longitude}], 15);
          if (userMarker) {
            userMarker.setLatLng([${coords.latitude}, ${coords.longitude}]);
          } else {
            userMarker = L.marker([${coords.latitude}, ${coords.longitude}], {
              icon: L.divIcon({
                html: '<div style="background-color: #4285F4; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).addTo(map)
            .bindPopup("Your Location");
          }
        }
      `;
      webViewRef.current?.injectJavaScript(js);
    }
  };

  const webViewRef = React.useRef<WebView>(null);

  useEffect(() => {
    fetchVisitsForOfficer();
  }, []);

  const generateMapHTML = () => {
    const markers = Object.entries(filteredLocations)
      .map(
        ([clerkId, location]) => `
          L.marker([${location.latitude}, ${location.longitude}], {
            icon: L.divIcon({
              html: '<div style="background-color: #34A853; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px;">${location.name.charAt(0)}</span></div>',
              className: '',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(map)
            .bindPopup(\`
            <div style="width: 200px; text-align: center;">
              <img src="${location.image_url}" alt="Clerk Avatar" style="width: 100%; height: 120px; object-fit: cover; border-radius: 5px; margin-bottom: 8px;" />
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; color: #333;">${location.name}</h3>
                <p style="margin: 4px 0; color: #666; font-size: 12px;">
                  <b>Last update:</b> ${new Date(location.picture_taken_at).toLocaleString()}
                </p>
                <p style="margin: 4px 0; color: #666; font-size: 12px;">
                  <b>Coordinates:</b><br>
                  ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}
                </p>
              </div>
            </div>
            \`);`
      )
      .join("\n");

    const initialLat = filteredLocations[Object.keys(filteredLocations)[0]]?.latitude || 51.505;
    const initialLng = filteredLocations[Object.keys(filteredLocations)[0]]?.longitude || -0.09;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Clerk Location Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .leaflet-popup-content { margin: 8px !important; }
            .leaflet-popup-content-wrapper { border-radius: 8px !important; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
          <script>
            var map = L.map('map').setView([${initialLat}, ${initialLng}], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            var userMarker;
            ${markers}
          </script>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading clerk locations...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onLoadEnd={() => {
          if (userLocation) {
            centerOnUserLocation();
          }
        }}
      />

      {/* Header */}
      <View style={[styles.header]}>
        <Text style={styles.headerTitle}>Visit Locations</Text>
        <Text style={styles.headerSubtitle}>
          {Object.keys(filteredLocations).length} Visits active
        </Text>
      </View>

      {/* Location button */}
      <TouchableOpacity 
        style={[styles.locationButton]} 
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Refresh button */}
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={fetchVisitsForOfficer}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="refresh" size={20} color={COLORS.white} />
        )}
      </TouchableOpacity>
      {/* Home button */}
      <TouchableOpacity 
        style={styles.homeButton} 
        onPress={()=>{router.replace('/officer/visits' )}}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="home" size={20} color={COLORS.white} />
        )}
      </TouchableOpacity>

      {/* Filter button */}
      <TouchableOpacity 
        style={styles.filterButton} 
        onPress={() => setShowFilters(true)}
      >
        <Ionicons name="filter" size={20} color={COLORS.white} />
        {selectedClerks.length > 0 || startDate || endDate ? (
          <View style={styles.filterBadge} />
        ) : null}
      </TouchableOpacity>

      {/* Selected clerk info */}
      {selectedClerk && (
        <View style={styles.clerkInfoCard}>
          <Image 
            source={{ uri: selectedClerk.image_url }} 
            style={styles.clerkImage}
          />
          <View style={styles.clerkDetails}>
            <Text style={styles.clerkName}>{selectedClerk.name}</Text>
            <Text style={styles.clerkLocation}>
              {selectedClerk.latitude.toFixed(5)}, {selectedClerk.longitude.toFixed(5)}
            </Text>
            <Text style={styles.clerkTime}>
              Last updated: {new Date(selectedClerk.picture_taken_at).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedClerk(null)}
          >
            <Ionicons name="close" size={20} color={COLORS.gray500} />
          </TouchableOpacity>
        </View>
      )}

      {/* Filters modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Visits</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Clerks</Text>
              <FlatList
                data={clerksList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.clerkItem,
                      selectedClerks.includes(item.id) && styles.selectedClerkItem
                    ]}
                    onPress={() => toggleClerkSelection(item.id)}
                  >
                    <Text style={styles.clerkItemText}>{item.name}</Text>
                    {selectedClerks.includes(item.id) && (
                      <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateInputText}>
                  {startDate ? startDate.toLocaleDateString() : "Select start date"}
                </Text>
                <Ionicons name="calendar" size={20} color={COLORS.gray500} />
              </TouchableOpacity>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartDatePicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.dateInput, { marginTop: SPACING.small }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateInputText}>
                  {endDate ? endDate.toLocaleDateString() : "Select end date"}
                </Text>
                <Ionicons name="calendar" size={20} color={COLORS.gray500} />
              </TouchableOpacity>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={resetFilters}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={applyFilters}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.white }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.medium,
    color: COLORS.gray700,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: SPACING.medium,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
    ...SHADOWS.small,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.gray900,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray600,
    marginTop: SPACING.tiny,
  },
  locationButton: {
    position: "absolute",
    bottom: SPACING.xlarge + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge,
    right: SPACING.medium + SPACING.large + SPACING.xlarge,
    backgroundColor: COLORS.white,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
    zIndex: 10,
  },
  refreshButton: {
    position: "absolute",
    bottom: SPACING.xlarge + SPACING.large + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge,
    right: SPACING.medium,
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
    zIndex: 10,
  },
    homeButton: {
    position: "absolute",
    bottom: SPACING.xlarge + SPACING.large + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge + SPACING.large,
    right: SPACING.medium ,
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
    zIndex: 10,
  },
  filterButton: {
    position: "absolute",
    bottom: SPACING.xlarge + SPACING.xlarge + SPACING.xlarge + SPACING.xlarge,
    right: SPACING.medium,
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
    zIndex: 10,
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  clerkInfoCard: {
    position: "absolute",
    bottom: SPACING.medium,
    left: SPACING.medium,
    right: SPACING.medium,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.medium,
    zIndex: 10,
  },
  clerkImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.small,
    marginRight: SPACING.medium,
  },
  clerkDetails: {
    flex: 1,
  },
  clerkName: {
    ...TYPOGRAPHY.heading4,
    color: COLORS.gray900,
    marginBottom: SPACING.tiny,
  },
  clerkLocation: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700,
    marginBottom: SPACING.tiny,
  },
  clerkTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
  },
  closeButton: {
    position: "absolute",
    top: SPACING.small,
    right: SPACING.small,
    padding: SPACING.tiny,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    padding: SPACING.medium,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.medium,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.gray900,
  },
  section: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading4,
    color: COLORS.gray800,
    marginBottom: SPACING.small,
  },
  clerkItem: {
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.small,
  },
  selectedClerkItem: {
    backgroundColor: COLORS.primaryLight,
  },
  clerkItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray900,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.medium,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  dateInputText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray800,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.medium,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: SPACING.small,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.small,
  },
  modalButtonText: {
    ...TYPOGRAPHY.body,
  },
});

export default OfficerLocationTrackingWeb;