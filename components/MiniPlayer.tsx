// components/MiniPlayer.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayback } from '../context/PlaybackContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function MiniPlayer() {
  const { track, isPlaying, togglePlayback } = usePlayback();
  const router = useRouter();

  if (!track) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={() => router.push('/player')}>
      <Image source={track.thumbnail} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.artist}>{track.artist}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayback}>
          <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={30} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="cast" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#7C3AED',
    zIndex: 1000,
  },
  thumbnail: { 
    width: 40, 
    height: 40, 
    borderRadius: 5, 
    marginRight: 10 
  },
  info: { 
    flex: 1,
    marginRight: 10,
  },
  title: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#FFF',
    marginBottom: 2,
  },
  artist: { 
    fontSize: 12, 
    color: '#DDD' 
  },
  controls: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 15,
  },
});

// // app/components/MiniPlayer.tsx
// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { usePlayback } from '../context/PlaybackContext';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Slider } from '@rneui/themed';

// const MiniPlayer: React.FC = () => {
//   const { track, isPlaying, togglePlayback, position, duration } = usePlayback();
//   const router = useRouter();

//   if (!track) return null;

//   const positionInSeconds = Math.floor(position / 1000);
//   const durationInSeconds = Math.floor(duration / 1000);

//   const handleSliderChange = (value: number) => {
//     // Note: We won't update position here to keep MiniPlayer lightweight
//     // Seeking is handled in the full player.tsx
//   };

//   const formatTime = (time: number) => {
//     const minutes = Math.floor(time / 60);
//     const seconds = time % 60;
//     return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
//   };

//   return (
//     <TouchableOpacity
//       style={styles.container}
//       onPress={() => router.push('/player')}
//       activeOpacity={0.8}
//     >
//       <View style={styles.content}>
//         <View style={styles.info}>
//           <Text style={styles.title} numberOfLines={1}>
//             {track.title}
//           </Text>
//           <Text style={styles.artist} numberOfLines={1}>
//             {track.artist}
//           </Text>
//         </View>
//         <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
//           <Icon
//             name={isPlaying ? 'pause' : 'play-arrow'}
//             size={24}
//             color="#FFF"
//           />
//         </TouchableOpacity>
//       </View>
//       <Slider
//         style={styles.slider}
//         minimumValue={0}
//         maximumValue={durationInSeconds || 1}
//         value={positionInSeconds}
//         onValueChange={handleSliderChange}
//         minimumTrackTintColor="#7C3AED"
//         maximumTrackTintColor="#555"
//         thumbTintColor="#7C3AED"
//         disabled // Disable seeking in mini-player for simplicity
//       />
//       <View style={styles.timeContainer}>
//         <Text style={styles.timeText}>{formatTime(positionInSeconds)}</Text>
//         <Text style={styles.timeText}>{formatTime(durationInSeconds)}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#2A2A2A',
//     borderTopWidth: 1,
//     borderTopColor: '#7C3AED',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 5,
//   },
//   content: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   info: {
//     flex: 1,
//     marginRight: 10,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FFF',
//   },
//   artist: {
//     fontSize: 12,
//     color: '#BBB',
//   },
//   playButton: {
//     padding: 8,
//     backgroundColor: '#7C3AED',
//     borderRadius: 20,
//   },
//   slider: {
//     width: '100%',
//     height: 20,
//     marginVertical: 5,
//   },
//   timeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   timeText: {
//     fontSize: 10,
//     color: '#FFF',
//   },
// });

// export default MiniPlayer;