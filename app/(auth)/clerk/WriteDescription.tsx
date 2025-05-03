import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
// import ImageViewing from 'react-native-image-viewing';
// import ImageViewing from 'expo-image-viewing';
import { Image } from 'expo-image';
import { saveVisitLocally } from '@/storage/offlineQueue';

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

  const imageUri = typeof photoUri === 'string' ? decodeURIComponent(photoUri) : '';
  const [newDescription, setNewDescription] = useState(description as string);
  const [visible, setVisible] = useState(false);
  const [imageExists, setImageExists] = useState(false);

  useEffect(() => {
    const checkFileExistence = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
          console.log('✅ File exists at:', imageUri);
          setImageExists(true);
        } else {
          console.error('❌ File does not exist at:', imageUri);
        }
      } catch (err) {
        console.error('Error checking file existence:', err);
      }
    };

    if (imageUri) checkFileExistence();
  }, [imageUri]);
  
  const handleSave = async () => {
    console.log('Saving visit ....');
    Alert.alert('Saving visit ....');
    if (!imageUri || !userId || !timestamp || !latitude || !longitude) {
      Alert.alert('Missing data', 'Cannot save without required fields.');
      return;
    }

    try {
      Alert.alert('Saving visit ....');
      saveVisitLocally({
        photoUri: imageUri,
        description: newDescription,
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        userId: userId as string,
        timestamp: timestamp as string,
        address: (address as string) ?? 'Unknown',
      });
      Alert.alert('✅ Saved', 'Visit saved locally.');
      router.replace('/clerk/CDashBoard' as never);
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('❌ Error', 'Failed to save visit locally.');
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageExists ? (
        <>
          <TouchableOpacity onPress={() => setVisible(true)}>
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              contentFit="cover"
              transition={1000}
              placeholder="Loading..."
            />
          </TouchableOpacity>
          
        </>
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

      <Text style={styles.label}>New Description:</Text>
      <TextInput
        style={styles.input}
        value={newDescription}
        onChangeText={setNewDescription}
        placeholder="Enter new description"
        multiline
      />
      <Button title="💾 Save Visit" onPress={handleSave} />
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
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5, // for Android shadow
    backgroundColor: '#fff',
  }
,  
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
});
