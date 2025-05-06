import { View, Text, StyleSheet, TouchableOpacity, ScrollView, GestureResponderEvent, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/provider/AuthProvider';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/config/initSupabase';
import { FileObject } from '@supabase/storage-js';
import ImageItem from '@/components/ImageItem';
import { router } from 'expo-router';
import ClerkTracker from '@/app/(auth)/clerk/ClerkTracker';
// import { initDb } from '@/storage/offlineQueue';
// import ClerkTracker from '@/clerk/ClerkTracker';
// import { syncVisitsIfOnline } from '@/services/syncVisits';

const List = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileObject[]>([]);
  
  useEffect(() => {
    if (!user) return;
    loadImages(); // Load user images
  }, [user]);

 

  const loadImages = async () => {
    const { data } = await supabase.storage.from('photos').list(user!.id);
    if (data) {
      setFiles(data);
    }
  };

  const CameraView = () => {
    router.push('/clerk/Camera' as never);

    // Save image if not cancelled
   
  };
  useEffect(() => {
    const initialize = async () => {
      if (Platform.OS !== 'web') {
      const {syncVisitsIfOnline} = await import('@/services/syncVisits');
      const { initDb } = await import('@/storage/offlineQueue');
      initDb(); // Initialize the database
      await syncVisitsIfOnline(); // Sync visits if online
      await loadImages();   // Then load images
      }
    };
  
    initialize();
  }, []);


  const onRemoveImage = async (item: FileObject, listIndex: number) => {
    supabase.storage.from('photos').remove([`${user!.id}/${item.name}`]);
    const fileName = `${user!.id}/${item.name}`;
    const {
      data: { publicUrl },
    } = supabase.storage.from('photos').getPublicUrl(fileName);
    console.log('public URL: ', publicUrl);
    const { data, error } = await supabase
      .from('visits')
      .delete()
      .eq('user_id', user!.id)
      .eq('image_url', publicUrl);
      console.log('Image deleted:', publicUrl);
      console.log('Visit deleted:', data);
    const newFiles = [...files];
    newFiles.splice(listIndex, 1);
    setFiles(newFiles);
  };

  function VisitHistory() {
    router.push('/clerk/VisitHistory' as never);
   
  }

  return (
    <View style={styles.container}>
      <Text><ClerkTracker /> {/* Include the ClerkTracker component */}</Text>
      
      <ScrollView>
        {files.map((item, index) => (
          <ImageItem key={item.id} item={item} userId={user!.id} onRemoveImage={() => onRemoveImage(item, index)} />
        ))}
      </ScrollView>

      {/* FAB to Take Images */}
    <TouchableOpacity onPress={CameraView} style={[styles.fab,{right: 30}]} >
        <Ionicons name="camera-outline" size={30} color={'#fff'} />
      </TouchableOpacity>
      {/* FAB to Show History */}
      <TouchableOpacity onPress={VisitHistory} style={[styles.fab,{left: 30}]} >
        <Ionicons name="book-outline" size={30} color={'#fff'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={loadImages} style={[styles.fab,{left: 120}]} >
        <Ionicons name="reload-outline" size={30} color={'#fff'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f1f1f1',
  },
  fab: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    position: 'absolute',
    bottom: 40,
    height: 70,
    backgroundColor: '#2b825b',
    borderRadius: 100,
  },
});

export default List;