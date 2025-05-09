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

//
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
//

import * as React from "react";
import {
  StatusBar,
  Text,
  View,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  COMPONENTS,
} from "@/src/constants/theme";
const { width, height } = Dimensions.get("window");
import { getMovies, Movie } from "@/assets/getmovies";
import Genres from "@/components/Genres";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";

// Updated constants using theme spacing
const ITEM_SIZE = width * 0.8;
const EMPTY_ITEM_SIZE = (width - ITEM_SIZE) / 2;
const BACKDROP_HEIGHT = height * 0.6;
const CARD_HEIGHT = 500;

const Loading = () => (
  <View style={styles.loadingContainer}>
    <Text style={TYPOGRAPHY.heading2}>Loading movies...</Text>
  </View>
);

interface BackdropProps {
  movies: Movie[];
  scrollX: Animated.Value;
}

const Backdrop: React.FC<BackdropProps> = ({ movies, scrollX }) => {
  return (
    <View style={{ height: BACKDROP_HEIGHT, width, position: "absolute" }}>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.key + "-backdrop"}
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
                position: "absolute",
                width: translateX,
                height,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: item.backdrop }}
                style={{
                  width,
                  height: BACKDROP_HEIGHT,
                  position: "absolute",
                }}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0)"]}
                style={{
                  height: BACKDROP_HEIGHT,
                  width,
                  position: "absolute",
                }}
              />
            </Animated.View>
          );
        }}
      />
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.3)", COLORS.backgroundLight]}
        style={{
          height: BACKDROP_HEIGHT,
          width,
          position: "absolute",
          bottom: 0,
        }}
      />
    </View>
  );
};

export default function MovieCarousel() {
  const insets = useSafeAreaInsets();
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const scrollX = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initialize = async () => {
      if (Platform.OS !== "web") {
        const { syncVisitsIfOnline } = await import("@/services/syncVisits");
        const { initDb } = await import("@/storage/offlineQueue");
        initDb();
        await syncVisitsIfOnline();
      }
    };
    initialize();
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      const moviesData = await getMovies();
      setMovies([
        { key: "empty-left" } as Movie,
        ...moviesData,
        { key: "empty-right" } as Movie,
      ]);
    };
    fetchData();
  }, []);

  if (movies.length === 0) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Backdrop movies={movies} scrollX={scrollX} />
        <StatusBar hidden />

        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          data={movies}
          keyExtractor={(item) => item.key}
          horizontal
          bounces={false}
          decelerationRate={Platform.OS === "ios" ? 0.9 : 0.95}
          renderToHardwareTextureAndroid
          contentContainerStyle={{
            alignItems: "center",
            paddingBottom: insets.bottom + SPACING.xlarge, // Safe area for tab bar
          }}
          snapToInterval={ITEM_SIZE}
          snapToAlignment="start"
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
              outputRange: [40, 0, 40],
              extrapolate: "clamp",
            });

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.9, 1.1, 0.9],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.7, 1, 0.7],
              extrapolate: "clamp",
            });

            return (
              <View style={{ width: ITEM_SIZE }}>
                <TouchableOpacity
                  onPress={() => {
                    if (item.navigateTo) {
                      router.push(item.navigateTo as never);
                    }
                  }}
                  activeOpacity={0.9}
                >
                  <Animated.View
                    style={[
                      COMPONENTS.card,
                      {
                        height: CARD_HEIGHT,
                        marginHorizontal: SPACING.small,
                        padding: SPACING.large,
                        alignItems: "center",
                        transform: [{ translateY }, { scale }],
                        opacity,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: item.poster }}
                      style={styles.posterImage}
                    />
                    <View style={styles.textContainer}>
                      <Text style={TYPOGRAPHY.heading2} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Genres genres={item.genres} />
                      <Text style={TYPOGRAPHY.body} numberOfLines={3}>
                        {item.description}
                      </Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
  },
  posterImage: {
    width: "100%",
    height: CARD_HEIGHT * 0.6,
    resizeMode: "cover",
    borderRadius: 12,
    marginBottom: SPACING.medium,
  },
  textContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: SPACING.small,
  },
});
