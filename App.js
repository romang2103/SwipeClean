import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, PanResponder, Animated, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

const App = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [swipeInProgress, setSwipeInProgress] = useState(false);
  const [loadedPhotos, setLoadedPhotos] = useState([]);

  useEffect(() => {
    const requestCameraRollPermission = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Camera roll permission denied!');
      }
    };

    requestCameraRollPermission();
  }, []);

  useEffect(() => {
    loadAllPhotos();
  }, []);

  const loadAllPhotos = async () => {
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Camera roll permission denied!');
      return;
    }

    let assets = [];
    let endCursor = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const result = await MediaLibrary.getAssetsAsync({
        album: null,
        mediaType: MediaLibrary.MediaType.photo,
        first: 100,
        after: endCursor,
      });

      assets = [...assets, ...result.assets];
      endCursor = result.endCursor;
      hasNextPage = result.hasNextPage;
    }

    const availablePhotos = assets.filter(
      (photo) => !loadedPhotos.includes(photo.uri)
    );

    if (availablePhotos.length === 0) {
      console.log('All photos have been displayed.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePhotos.length);
    const selectedAsset = availablePhotos[randomIndex];
    setSelectedPhoto(selectedAsset);
    setSwipeInProgress(false);
    setLoadedPhotos([...loadedPhotos, selectedAsset.uri]);
  };

  const handleSwipe = async (direction) => {
    if (swipeInProgress) {
      return;
    }

    if (direction === 'left') {
      console.log('Swiped left');
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('Camera roll permission denied!');
        return;
      }

      if (selectedPhoto) {
        try {
          setSwipeInProgress(true);
          await MediaLibrary.deleteAssetsAsync([selectedPhoto]);
          console.log('Photo deleted');
        } catch (error) {
          console.log('Failed to delete the photo:', error);
        }
      }
    }

    loadAllPhotos();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      const { dx } = gestureState;
      if (dx < -100) {
        handleSwipe('left');
      } else if (dx > 100) {
        handleSwipe('right');
      }
    },
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {selectedPhoto ? (
        <Animated.Image
          source={{ uri: selectedPhoto.uri }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <Text>No photo selected.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
    marginTop: 20,
  },
});

export default App;
