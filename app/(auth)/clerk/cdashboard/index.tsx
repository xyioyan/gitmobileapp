// import { View, Text, StyleSheet, TouchableOpacity, ScrollView, GestureResponderEvent, Platform } from 'react-native';
// import React, { useEffect, useState } from 'react';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { useAuth } from '@/provider/AuthProvider';
// import * as FileSystem from 'expo-file-system';
// import { decode } from 'base64-arraybuffer';
// import { supabase } from '@/config/initSupabase';
// import { FileObject } from '@supabase/storage-js';
// import ImageItem from '@/components/ImageItem';
// import { router } from 'expo-router';
// import ClerkTracker from '@/app/(auth)/clerk/cdashboard/ClerkTracker';
// // import { initDb } from '@/storage/offlineQueue';
// // import ClerkTracker from '@/clerk/ClerkTracker';
// // import { syncVisitsIfOnline } from '@/services/syncVisits';

// const List = () => {
//   const { user } = useAuth();
//   const [files, setFiles] = useState<FileObject[]>([]);
  
//   useEffect(() => {
//     if (!user) return;
//     loadImages(); // Load user images
//   }, [user]);

 

//   const loadImages = async () => {
//     const { data } = await supabase.storage.from('photos').list(user!.id);
//     if (data) {
//       setFiles(data);
//     }
//   };

//   const CameraView = () => {
//     router.push('/clerk/cdashboard/Camera' as never);

//     // Save image if not cancelled
   
//   };
//   useEffect(() => {
//     const initialize = async () => {
//       if (Platform.OS !== 'web') {
//       const {syncVisitsIfOnline} = await import('@/services/syncVisits');
//       const { initDb } = await import('@/storage/offlineQueue');
//       initDb(); // Initialize the database
//       await syncVisitsIfOnline(); // Sync visits if online
//       await loadImages();   // Then load images
//       }
//     };
  
//     initialize();
//   }, []);


//   const onRemoveImage = async (item: FileObject, listIndex: number) => {
//     supabase.storage.from('photos').remove([`${user!.id}/${item.name}`]);
//     const fileName = `${user!.id}/${item.name}`;
//     const {
//       data: { publicUrl },
//     } = supabase.storage.from('photos').getPublicUrl(fileName);
//     // console.log('public URL: ', publicUrl);
//     const { data, error } = await supabase
//       .from('visits')
//       .delete()
//       .eq('user_id', user!.id)
//       .eq('image_url', publicUrl);
//       // console.log('Image deleted:', publicUrl);
//       // console.log('Visit deleted:', data);
//     const newFiles = [...files];
//     newFiles.splice(listIndex, 1);
//     setFiles(newFiles);
//   };

//   function VisitHistory() {
//     router.push('/clerk/visits/VisitHistory' as never);
   
//   }

//   return (
//     <View style={styles.container}>
//       <Text><ClerkTracker /> {/* Include the ClerkTracker component */}</Text>
      
//       <ScrollView>
//         {files.map((item, index) => (
//           <ImageItem key={item.id} item={item} userId={user!.id} onRemoveImage={() => onRemoveImage(item, index)} />
//         ))}
//       </ScrollView>

//       {/* FAB to Take Images */}
//     <TouchableOpacity onPress={CameraView} style={[styles.fab,{right: 30}]} >
//         <Ionicons name="camera-outline" size={30} color={'#fff'} />
//       </TouchableOpacity>
//       {/* FAB to Show History */}
//       <TouchableOpacity onPress={VisitHistory} style={[styles.fab,{left: 30}]} >
//         <Ionicons name="book-outline" size={30} color={'#fff'} />
//       </TouchableOpacity>
//       <TouchableOpacity onPress={loadImages} style={[styles.fab,{left: 120}]} >
//         <Ionicons name="reload-outline" size={30} color={'#fff'} />
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#f1f1f1',
//   },
//   fab: {
//     borderWidth: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 70,
//     position: 'absolute',
//     bottom: 40,
//     height: 70,
//     backgroundColor: '#2b825b',
//     borderRadius: 100,
//   },
// });

// export default List;

/**
 * Inspiration: https://dribbble.com/shots/8257559-Movie-2-0
 */
import * as React from 'react';
import {
  StatusBar,
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get('window');
import { getMovies, Movie } from '@/assets/getmovies';
import Genres from '@/components/Genres';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';

const SPACING = 10;
const ITEM_SIZE = Platform.OS === 'ios' ? width * 0.72 : width * 0.74;
const EMPTY_ITEM_SIZE = (width - ITEM_SIZE) / 2;
const BACKDROP_HEIGHT = height * 0.65;
const CARD_HEIGHT = 400;

const Loading = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.paragraph}>Loading...</Text>
  </View>
);

interface BackdropProps {
  movies: Movie[];
  scrollX: Animated.Value;
}

const Backdrop: React.FC<BackdropProps> = ({ movies, scrollX }) => {
  return (
    <View style={{ height: BACKDROP_HEIGHT, width, position: 'absolute' }}>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.key + '-backdrop'}
        removeClippedSubviews={false}
        contentContainerStyle={{ width, height: BACKDROP_HEIGHT }}
        renderItem={({ item, index }) => {
          if (!item.backdrop) {
            return null;
          }
          const translateX = scrollX.interpolate({
            inputRange: [(index - 2) * ITEM_SIZE, (index - 1) * ITEM_SIZE],
            outputRange: [0, width],
          });
          return (
            <Animated.View
              removeClippedSubviews={false}
              style={{
                position: 'absolute',
                width: translateX,
                height,
                overflow: 'hidden',
              }}
            >
              <Image
                source={{ uri: item.backdrop }}
                style={{
                  width,
                  height: BACKDROP_HEIGHT,
                  position: 'absolute',
                }}
              />
            </Animated.View>
          );
        }}
      />
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'white']}
        style={{
          height: BACKDROP_HEIGHT,
          width,
          position: 'absolute',
          bottom: 0,
        }}
      />
    </View>
  );
};

export default function App() {
   const insets = useSafeAreaInsets();
  const [movies, setMovies] = React.useState<Movie[]>([]);

  const scrollX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const fetchData = async () => {
      const moviesData = await getMovies();
      setMovies([
        { 
          key: 'empty-left',
          title: '',
          description: '',
          poster: '',
          backdrop: '',
          genres: [],
          navigateTo:''
        } as Movie, 
        ...moviesData, 
        { 
          key: 'empty-right',
          title: '',
          description: '',
          poster: '',
          backdrop: '',
          genres: [],
          navigateTo:''
        } as Movie
      ]);
    };
    fetchData(); // Only fetch once, no need to depend on movies state.
  }, []);

  if (movies.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Backdrop movies={movies} scrollX={scrollX} />
      <StatusBar hidden />

      <View style={{ position: 'absolute', bottom: 100 }}>
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          data={movies}
          keyExtractor={(item) => item.key}
          horizontal
          bounces={false}
          decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
          renderToHardwareTextureAndroid
          contentContainerStyle={{ alignItems: 'center' }}
          snapToInterval={ITEM_SIZE}
          snapToAlignment='start'
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => {
            if (!item.poster) {
              return <View style={{ width: EMPTY_ITEM_SIZE }} />;
            }

            const inputRange = [
              (index - 2) * ITEM_SIZE,
              (index - 1) * ITEM_SIZE,
              index * ITEM_SIZE,
            ];

            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [100, 50, 100],
              extrapolate: 'clamp',
            });

            return (
              <View style={{ width: ITEM_SIZE }}>
                <TouchableOpacity
                onPress={() => {router.push(item.navigateTo as never);
                  console.log('clicked on:', item.navigateTo);
                }}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={{
                      height: CARD_HEIGHT,
                      marginHorizontal: SPACING,
                      padding: SPACING * 2,
                      alignItems: 'center',
                      transform: [{ translateY }],
                      backgroundColor: 'white',
                      borderRadius: 34,
                    }}
                  >
                    <Image
                      source={{ uri: item.poster }}
                      style={styles.posterImage}
                    />
                    <Text style={{ fontSize: 24 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Genres genres={item.genres} />
                    <Text style={{ fontSize: 12 }} numberOfLines={3}>
                      {item.description}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  posterImage: {
    width: '100%',
    height: CARD_HEIGHT * 0.5,
    resizeMode: 'cover',
    borderRadius: 24,
    marginBottom: 10,
  },
});

