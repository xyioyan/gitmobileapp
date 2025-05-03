import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Text} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/provider/AuthProvider';
import { supabase } from '@/config/initSupabase';
import { FileObject } from '@supabase/storage-js';
import { router } from 'expo-router';
import { Timestamp } from 'react-native-reanimated/lib/typescript/commonTypes';


type Visit = {
  id: number;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  created_at: string;
  picture_taken_at: Timestamp;
  user_id: string;
  status: string;
  address: string;
};

const VisitHistory = () => {
  
  const { user,session } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    if (!user) return;
    const loading = async () => {
    // Load user images
   await fetchVisits();
  console.log('Fetching visits...');
  };
    loading();
  }, [user]);

  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('user_id', user!.id);

    if (data) setVisits(data);
    else console.error('Error fetching visits:', error);
  };

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
      .eq('image_url', publicUrl)
      .eq('user_id', user!.id);

    if (error) console.error('Error deleting image:', error);
    else {
      console.log('Image deleted successfully:', data);
      fetchVisits(); // Refresh the list after deletion
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
      {visits.map((visit: Visit) => (
          <TouchableOpacity
            key={visit.id}
            onPress={() =>
              router.push({
                pathname: '/(auth)/clerk/ImagePreview',
                params: { ...visit, photoUri: encodeURIComponent(visit.image_url) },
              })
            }
            style={{padding: 10, marginBottom: 10, backgroundColor: '#fff', borderRadius: 10, flexDirection: 'row', }}
          >
            {visit.image_url ? <Image style={{ width: 80, height: 80, borderRadius: 10}} source={{ uri: visit.image_url }} /> : <View style={{ width: 80, height: 80, backgroundColor: '#1A1A1A' }} />}
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={{ flex: 1, color: '#1a1a1a', flexDirection: 'row' }}>
                <Text style={{ fontWeight: 'bold' }}>Name:</Text>{session?.user.user_metadata.name}
              </Text>
              <Text style={{ flex: 1, color: '#1a1a1a' }}>{visit.description}</Text>
              <Text style={{ flex: 1, color: '#1a1a1a',flexDirection: 'column' }}>
              <Text style={{ flex: 1, color: '#1a1a1a', marginLeft: 10, fontWeight: 'bold'}}>{visit.latitude}  </Text>
              <Text style={{ flex: 1, color: '#1a1a1a',fontWeight: 'bold' }}>{visit.longitude}</Text>
                </Text>
            </View>
            {/* Delete image button */}
          </TouchableOpacity>
        ))}
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#151515',
  },
  fab: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    position: 'absolute',
    bottom: 40,
    right: 30,
    height: 70,
    backgroundColor: '#2b825b',
    borderRadius: 100,
  },
});

export default VisitHistory;