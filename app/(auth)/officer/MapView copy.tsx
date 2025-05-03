import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/config/initSupabase';
import { Visit } from '@/storage/offlineQueue';

const Hello = () => {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    const { data, error } = await supabase.from('visits').select('*');
    if (data) {setVisits(data);
    console.log('Fetched visits:', data);}
    else console.error('Error fetching visits:', error);
  };
  return (
    <View>
      <Text>Hello</Text>
    </View>
  )
}

export default Hello