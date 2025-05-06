import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Text} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/provider/AuthProvider';
import { supabase } from '@/config/initSupabase';
import { FileObject } from '@supabase/storage-js';
import { router } from 'expo-router';


type Visit = {
  id: number;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  created_at: string;
  picture_taken_at: string;
  user_id: string;
  status: string;
  address: string;
};

const list = () => {
  
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load user images
    fetchVisits();
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
    fetchVisits();
  };

  return (
    <View style={styles.container}>
      <ScrollView>
      {visits.map((visit: Visit) => (
          <TouchableOpacity
            key={visit.id}
            onPress={() =>
              router.push({
                pathname: '/clerk/ImagePreview',
                params: { ...visit, photoUri: encodeURIComponent(visit.image_url) },
              })
            }
          >
            {visit.image_url ? <Image style={{ width: 80, height: 80 }} source={{ uri: visit.image_url }} /> : <View style={{ width: 80, height: 80, backgroundColor: '#1A1A1A' }} />}
            <Text style={{ flex: 1, color: '#fff' }}>{visit.description}</Text>
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

export default list;