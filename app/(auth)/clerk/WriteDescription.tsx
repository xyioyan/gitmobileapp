// app/(auth)/clerk/visitdetail.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function VisitDetailScreen() {
  const {
    photoUri,
    description,
    address,
    timestamp,
    latitude,
    longitude,
  } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri as string }} style={styles.image} />
      <Text style={styles.text}>Description: {description}</Text>
      <Text style={styles.text}>Address: {address}</Text>
      <Text style={styles.text}>Timestamp: {timestamp}</Text>
      <Text style={styles.text}>
        Location: {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  image: { width: "100%", height: 300, marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 10 },
});
