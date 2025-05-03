// VisitDetails.tsx
import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';

export default function VisitDetails() {
  const {
    photoUri,
    description,
    user_id,
    latitude,
    longitude,
    picture_taken_at,
    address,
  } = useLocalSearchParams();

  const imageUri = typeof photoUri === 'string' ? decodeURIComponent(photoUri) : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <Text style={styles.label}>No image available</Text>
      )}

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{description}</Text>

      <Text style={styles.label}>Latitude:</Text>
      <Text style={styles.value}>{latitude}</Text>

      <Text style={styles.label}>Longitude:</Text>
      <Text style={styles.value}>{longitude}</Text>

      <Text style={styles.label}>Timestamp:</Text>
      <Text style={styles.value}>
        {picture_taken_at && typeof picture_taken_at === 'string'
          ? new Date(picture_taken_at).toLocaleString()
          : 'Invalid date'}
      </Text>

      <Text style={styles.label}>Address:</Text>
      <Text style={styles.value}>{address}</Text>

      <Text style={styles.label}>User ID:</Text>
      <Text style={styles.value}>{user_id}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
  },
});
