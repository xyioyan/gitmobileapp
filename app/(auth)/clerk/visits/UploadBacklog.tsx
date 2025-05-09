import { View, Text, Platform, Alert } from 'react-native';
import React, { useEffect } from 'react';
import { router } from 'expo-router';

const UploadBacklog = () => {
  useEffect(() => {
    const initialize = async () => {
      if (Platform.OS !== 'web') {
        try {
          const { syncVisitsIfOnline } = await import('@/services/syncVisits');
          const { initDb } = await import('@/storage/offlineQueue');

          await initDb(); // Initialize the offline DB
          await syncVisitsIfOnline(); // Sync visits if online
          Alert.alert('Upload completed', 'All visits have been uploaded successfully.'); // Show success message
          router.replace('/clerk/visits' as never); // Navigate to the Map view
        } catch (error) {
          console.error('Error during UploadBacklog initialization:', error);
        }
      }
    };

    initialize();
  }, []);

  return (
    <View>
      <Text>UploadBacklog</Text>
    </View>
  );
};

export default UploadBacklog;
