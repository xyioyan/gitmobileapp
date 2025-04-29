import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function WriteDescription() {
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

  const imageUri = typeof photoUri === 'string' ? decodeURIComponent(decodeURIComponent(photoUri)) : '';


  useEffect(() => {
    const checkFileExistence = async (uri: string) => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          console.error('❌ File does not exist at:', uri);
        } else {
          console.log('✅ File exists at:', uri);
        }
      } catch (err) {
        console.error('Error checking file existence:', err);
      }
    };

    if (imageUri) {
      checkFileExistence(imageUri);
    }
  }, [imageUri]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{description}</Text>

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.preview}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.value}>No photo available</Text>
      )}

      <Text style={styles.label}>Latitude:</Text>
      <Text style={styles.value}>{latitude}</Text>

      <Text style={styles.label}>Longitude:</Text>
      <Text style={styles.value}>{longitude}</Text>

      <Text style={styles.label}>Timestamp:</Text>
      <Text style={styles.value}>{timestamp}</Text>

      <Text style={styles.label}>Address:</Text>
      <Text style={styles.value}>{address}</Text>

      <Text style={styles.label}>User ID:</Text>
      <Text style={styles.value}>{userId}</Text>

      <Text style={styles.label}>Status:</Text>
      <Text style={styles.value}>{status}</Text>
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
    marginVertical: 15,
    borderRadius: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 5,
  },
});
