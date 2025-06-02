// app/player.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
 View,
 Text,
 StyleSheet,
 TouchableOpacity,
 Alert,
 ScrollView,
 Image,
 ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Slider } from '@rneui/themed';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
 useSharedValue,
 useAnimatedStyle,
 withSpring,
} from 'react-native-reanimated';

// Define interfaces
interface EpisodeHistory {
 episodeName: string;
 host: string;
 auraScore: number;
 moodReaction: string;
 timestamp: string;
}

interface MindmapBranch {
 topic: string;
 subtopics: string[];
}

interface Mindmap {
 main_topic: string;
 branches: MindmapBranch[];
}

interface ApiResponse {
 summary: string;
 mindmap: Mindmap;
 audio_url: string;
}

interface Track {
 title: string;
 artist: string;
 audioUri: string;
 thumbnail: any;
}

interface UserInputs {
 text?: string;
 mood?: string;
 image?: any;
 pdf?: any;
 url?: string;
}

// Simulated API response
const SAMPLE_RESPONSE: ApiResponse = require('./data/sampleResponse.json');

// Google Drive download link
// const GOOGLE_DRIVE_URL = 'https://drive.google.com/uc?export=download&id=1eJKxRqJMmOSr3g90ncKL1Daewfs05MnF';

// Simulated aura and vibe utilities
const getMotivationalQuote = (auraScore: number, host: string): string => {
 if (auraScore <= 20) return `${host} says: "Hey, let's recharge your vibe! 🔋"`;
 if (auraScore <= 50) return `${host} says: "You're starting to glow—keep it up! ✨"`;
 if (auraScore <= 80) return `${host} says: "Today's vibe is brain fuel 💡"`;
 return `${host} says: "You're absolutely slaying it! 🔥"`;
};

const saveEpisodeReaction = async (episode: EpisodeHistory) => {
 try {
 const storedHistory = await AsyncStorage.getItem('VibeCastEpisodeHistory');
 const history: EpisodeHistory[] = storedHistory ? JSON.parse(storedHistory) : [];
 history.push(episode);
 await AsyncStorage.setItem('VibeCastEpisodeHistory', JSON.stringify(history));
 } catch (error) {
 console.error('Error saving episode reaction:', error);
 }
};

// Utility to wrap text within a given width
const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
 const words = text.split(' ');
 const lines: string[] = [];
 let currentLine = '';

 const charWidth = fontSize * 0.6;
 const maxCharsPerLine = Math.floor(maxWidth / charWidth);

 for (const word of words) {
 const testLine = currentLine ? `${currentLine} ${word}` : word;
 if (testLine.length <= maxCharsPerLine) {
 currentLine = testLine;
 } else {
 if (currentLine) {
 lines.push(currentLine);
 }
 currentLine = word;
 }
 }
 if (currentLine) {
 lines.push(currentLine);
 }

 return lines;
};

// Mindmap Component
const MindmapComponent: React.FC<{ mindmap: Mindmap }> = ({ mindmap }) => {
 const svgWidth = 600;
 const mainWidth = 100;
 const mainHeight = 50;
 const branchWidth = 80;
 const branchHeight = 40;
 const subtopicWidth = 60;
 const subtopicHeight = 30;
 const cornerRadius = 8;
 const verticalSpacing = 60;

 const mainX = svgWidth / 2;
 const mainY = 50;

 const branches = mindmap.branches;
 const branchCount = branches.length;
 const branchSpacing = svgWidth / (branchCount + 1);
 const branchY = mainY + 120;

 const maxSubtopics = Math.max(...branches.map(branch => branch.subtopics.length), 1);
 const svgHeight = 500 + (maxSubtopics - 1) * verticalSpacing;

 const scale = useSharedValue(1);
 const savedScale = useSharedValue(1);
 const translateX = useSharedValue(0);
 const translateY = useSharedValue(0);
 const savedTranslateX = useSharedValue(0);
 const savedTranslateY = useSharedValue(0);

 const pinchGesture = Gesture.Pinch()
 .onUpdate((event) => {
 scale.value = savedScale.value * event.scale;
 })
 .onEnd(() => {
 savedScale.value = scale.value;
 if (scale.value < 0.5) {
 scale.value = withSpring(0.5);
 savedScale.value = 0.5;
 }
 if (scale.value > 2) {
 scale.value = withSpring(2);
 savedScale.value = 2;
 }
 });

 const panGesture = Gesture.Pan()
 .onUpdate((event) => {
 translateX.value = savedTranslateX.value + event.translationX;
 translateY.value = savedTranslateY.value + event.translationY;
 })
 .onEnd(() => {
 savedTranslateX.value = translateX.value;
 savedTranslateY.value = translateY.value;
 });

 const gestures = Gesture.Simultaneous(pinchGesture, panGesture);

 const animatedStyle = useAnimatedStyle(() => ({
 transform: [
 { scale: scale.value },
 { translateX: translateX.value },
 { translateY: translateY.value },
 ],
 }));

 return (
 <View style={styles.mindmapClipContainer}>
 <GestureDetector gesture={gestures}>
 <Animated.View style={[styles.mindmapContainerInner, animatedStyle]}>
 <Svg height={svgHeight} width={svgWidth} style={styles.mindmapSvg}>
 <Rect
 x={mainX - mainWidth / 2}
 y={mainY - mainHeight / 2}
 width={mainWidth}
 height={mainHeight}
 rx={cornerRadius}
 ry={cornerRadius}
 fill="#7C3AED"
 opacity={0.9}
 />
 {wrapText(mindmap.main_topic, mainWidth - 10, 14).map((line, index) => (
 <SvgText
 key={index}
 x={mainX}
 y={mainY - (wrapText(mindmap.main_topic, mainWidth - 10, 14).length - 1) * 7 + index * 14}
 fontSize="14"
 fontWeight="bold"
 fill="#FFF"
 textAnchor="middle"
 alignmentBaseline="middle"
 >
 {line}
 </SvgText>
 ))}
 {branches.map((branch, index) => {
 const branchX = (index + 1) * branchSpacing;
 const subtopics = branch.subtopics;
 return (
 <React.Fragment key={index}>
 <Line
 x1={mainX}
 y1={mainY + mainHeight / 2}
 x2={branchX}
 y2={branchY - branchHeight / 2}
 stroke="#7C3AED"
 strokeWidth="2"
 opacity={0.7}
 />
 <Rect
 x={branchX - branchWidth / 2}
 y={branchY - branchHeight / 2}
 width={branchWidth}
 height={branchHeight}
 rx={cornerRadius}
 ry={cornerRadius}
 fill="#4B0082"
 opacity={0.9}
 />
 {wrapText(branch.topic, branchWidth - 10, 12).map((line, subIndex) => (
 <SvgText
 key={subIndex}
 x={branchX}
 y={branchY - (wrapText(branch.topic, branchWidth - 10, 12).length - 1) * 6 + subIndex * 12}
 fontSize="12"
 fontWeight="600"
 fill="#FFF"
 textAnchor="middle"
 alignmentBaseline="middle"
 >
 {line}
 </SvgText>
 ))}
 {subtopics.map((subtopic, subIndex) => {
 const subtopicX = branchX;
 const subtopicY = branchY + 90 + subIndex * verticalSpacing;
 return (
 <React.Fragment key={subIndex}>
 <Line
 x1={branchX}
 y1={branchY + branchHeight / 2}
 x2={subtopicX}
 y2={subtopicY - subtopicHeight / 2}
 stroke="#7C3AED"
 strokeWidth="1"
 opacity={0.5}
 />
 <Rect
 x={subtopicX - subtopicWidth / 2}
 y={subtopicY - subtopicHeight / 2}
 width={subtopicWidth}
 height={subtopicHeight}
 rx={cornerRadius}
 ry={cornerRadius}
 fill="#6A0DAD"
 opacity={0.8}
 />
 {wrapText(subtopic, subtopicWidth - 10, 10).map((line, lineIndex) => (
 <SvgText
 key={lineIndex}
 x={subtopicX}
 y={subtopicY - (wrapText(subtopic, subtopicWidth - 10, 10).length - 1) * 5 + lineIndex * 10}
 fontSize="10"
 fontWeight="400"
 fill="#FFF"
 textAnchor="middle"
 alignmentBaseline="middle"
 >
 {line}
 </SvgText>
 ))}
 </React.Fragment>
 );
 })}
 </React.Fragment>
 );
 })}
 </Svg>
 </Animated.View>
 </GestureDetector>
 </View>
 );
};

// Main Component: Player
export default function Player() {
 const [track, setTrack] = useState<Track | null>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const [auraScore, setAuraScore] = useState(0);
 const [showMoodSelector, setShowMoodSelector] = useState(false);
 const [hasFetchedData, setHasFetchedData] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [isAudioReady, setIsAudioReady] = useState(false);
 const [audioDuration, setAudioDuration] = useState(0);
 const [currentPosition, setCurrentPosition] = useState(0);
 const [isBuffering, setIsBuffering] = useState(false);
 const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
 const router = useRouter();
 const params = useLocalSearchParams<UserInputs>();
 const shareRef = useRef<View>(null);
 const audioRef = useRef<Audio.Sound | null>(null);

 // Initialize track and API response
 useEffect(() => {
 if (hasFetchedData) return;

 const fetchData = async () => {
 try {
 setIsLoading(true);
 setApiResponse(SAMPLE_RESPONSE);
 
 // Set track with the audio URL from the API response
 setTrack({
 title: 'Sample Episode',
 artist: 'VibeCast Host',
 audioUri: SAMPLE_RESPONSE.audio_url,
 thumbnail: require('../assets/avatar-base.png'),
 });
 
 setHasFetchedData(true);
 } catch (error: any) {
 console.error('Error fetching data:', error.message || error);
 Alert.alert('Error', 'Failed to load audio. Please check your connection and try again.');
 } finally {
 setIsLoading(false);
 }
 };
 fetchData();
 }, [hasFetchedData]);

 // Initialize audio
 useEffect(() => {
 if (!track?.audioUri) return;

 const loadAudio = async () => {
 try {
 setIsLoading(true);
 setIsBuffering(true);

 // Configure audio mode
 await Audio.setAudioModeAsync({
 playsInSilentModeIOS: true,
 staysActiveInBackground: true,
 shouldDuckAndroid: true,
 playThroughEarpieceAndroid: false,
 });

 // Create and load the sound
 const { sound } = await Audio.Sound.createAsync(
 { uri: track.audioUri },
 { 
 shouldPlay: false,
 progressUpdateIntervalMillis: 100,
 positionMillis: 0,
 volume: 1.0,
 rate: 1.0,
 shouldCorrectPitch: true,
 },
 onPlaybackStatusUpdate
 );

 audioRef.current = sound;
 const status = await sound.getStatusAsync();

 if (status.isLoaded && status.durationMillis) {
 const duration = Math.floor(status.durationMillis);
 console.log('Audio duration:', duration);
 setAudioDuration(duration);
 setIsAudioReady(true);
 } else {
 throw new Error('Audio loaded but no duration available');
 }
 } catch (error: any) {
 console.error('Error loading audio:', error.message || error);
 Alert.alert('Audio Error', `Failed to load audio: ${error.message || 'Unknown error'}.`);
 } finally {
 setIsLoading(false);
 setIsBuffering(false);
 }
 };
 loadAudio();

 return () => {
 if (audioRef.current) {
 audioRef.current.unloadAsync().catch(error => console.error('Error unloading audio:', error));
 audioRef.current = null;
 }
 };
 }, [track]);

 // Handle playback status updates
 const onPlaybackStatusUpdate = (status: any) => {
 if (status.isLoaded) {
 const newPosition = Math.floor(status.positionMillis);
 setCurrentPosition(newPosition);
 
 if (status.durationMillis) {
 setAudioDuration(Math.floor(status.durationMillis));
 }

 // Handle buffering state
 if (status.isBuffering) {
 setIsBuffering(true);
 } else {
 setIsBuffering(false);
 }

 // Handle playback completion
 if (status.didJustFinish) {
 setCurrentPosition(0);
 setIsPlaying(false);
 setShowMoodSelector(true);
 if (audioRef.current) {
 audioRef.current.setPositionAsync(0);
 }
 }
 }
 };

 // Handle play/pause
 const handlePlayPause = async () => {
 if (!audioRef.current || !isAudioReady) return;
 
 try {
 if (isPlaying) {
 await audioRef.current.pauseAsync();
 setIsPlaying(false);
 } else {
 await audioRef.current.playAsync();
 setIsPlaying(true);
 }
 } catch (error) {
 console.error('Error toggling playback:', error);
 Alert.alert('Error', 'Failed to play/pause audio. Please try again.');
 }
 };

 // Handle seeking
 const handleSliderChange = async (value: number) => {
 if (!audioRef.current || !isAudioReady) return;
 const newPosition = Math.floor(value * 1000);
 try {
 await audioRef.current.setPositionAsync(newPosition);
 setCurrentPosition(newPosition);
 } catch (error) {
 console.error('Error seeking:', error);
 Alert.alert('Error', 'Failed to seek. Please try again.');
 }
 };

 // Handle 10-second skip
 const handleSkip = async (seconds: number) => {
 if (!audioRef.current || !isAudioReady) return;
 try {
 const newPosition = Math.floor(
 Math.max(0, Math.min(currentPosition + seconds * 1000, audioDuration))
 );
 await audioRef.current.setPositionAsync(newPosition);
 setCurrentPosition(newPosition);
 } catch (error) {
 console.error('Error skipping:', error);
 Alert.alert('Error', 'Failed to skip. Please try again.');
 }
 };

 // Fetch aura score on mount
 useEffect(() => {
 const fetchAuraScore = async () => {
 try {
 const auraData = await AsyncStorage.getItem('VibeCastEpisodeHistory');
 if (auraData) {
 const parsedData = JSON.parse(auraData);
 // Ensure auraScore is an integer
 const score = Math.floor(Number(parsedData.auraScore) || 0);
 setAuraScore(score);
 } else {
 setAuraScore(0);
 }
 } catch (error) {
 console.error('Error fetching aura score:', error);
 setAuraScore(0);
 }
 };
 fetchAuraScore();
 }, []);

 const handleShare = async () => {
 try {
 const uri = await captureRef(shareRef, { format: 'png', quality: 1 });
 await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your VibeCast episode!' });
 } catch (error) {
 console.error('Error sharing screenshot:', error);
 Alert.alert('Error', 'Failed to share screenshot. Please try again.');
 }
 };

 const handleMoodReaction = async (reaction: string) => {
 if (!track) return;
 const episode: EpisodeHistory = {
 episodeName: track.title,
 host: track.artist,
 auraScore,
 moodReaction: reaction,
 timestamp: new Date().toISOString(),
 };
 await saveEpisodeReaction(episode);
 setShowMoodSelector(false);
 Alert.alert('Reaction Saved', `You felt ${reaction} after this episode!`);
 };

 if (!track) return null;

 const formatTime = (timeInSeconds: number) => {
 const minutes = Math.floor(timeInSeconds / 60);
 const seconds = Math.floor(timeInSeconds % 60);
 return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
 };

 const hostQuote = getMotivationalQuote(auraScore, track.artist);

 return (
 <View style={styles.container}>
 <SafeAreaView edges={['top']} style={styles.header}>
 <TouchableOpacity
 style={styles.backButton}
 onPress={() => router.back()}
 >
 <Icon name="arrow-back" size={24} color="#FFF" />
 </TouchableOpacity>
 <Text style={styles.headerTitle}>VibeCast</Text>
 </SafeAreaView>

 <View style={styles.avatarSection}>
 <View style={styles.avatarGlow}>
 <Image source={require('../assets/avatar-base.png')} style={styles.avatar} />
 </View>
 <View style={styles.auraScoreCard}>
 <Text style={styles.auraScore}>🌈 Aura: {auraScore}</Text>
 <Text style={styles.auraStatus}>Laser Focused ⚡</Text>
 </View>
 </View>

 <ScrollView style={styles.contentSection}>
 <View style={styles.summaryContent}>
 <Text style={styles.episodeTitle}>{track.title}</Text>
 <Text style={styles.hosts}>Hosted by: {track.artist}</Text>
 </View>

 {apiResponse && (
 <View style={styles.summaryContainer}>
 <Text style={styles.sectionTitle}>Summary</Text>
 <Text style={styles.summaryText}>{apiResponse.summary}</Text>
 </View>
 )}

 {apiResponse && (
 <View style={styles.mindmapContainer}>
 <Text style={styles.sectionTitle}>Mindmap</Text>
 <MindmapComponent mindmap={apiResponse.mindmap} />
 </View>
 )}

 <View style={{ height: 100 }} />
 </ScrollView>

 <View style={styles.playbackControls}>
 {isLoading ? (
 <ActivityIndicator size="small" color="#7C3AED" />
 ) : (
 <>
 <Slider
 style={styles.slider}
 minimumValue={0}
 maximumValue={audioDuration / 1000 || 1}
 value={currentPosition / 1000}
 onValueChange={handleSliderChange}
 minimumTrackTintColor="#7C3AED"
 maximumTrackTintColor="#555"
 thumbTintColor="#7C3AED"
 step={0.1}
 disabled={!isAudioReady || isBuffering}
 />
 <View style={styles.timeContainer}>
 <Text style={styles.timeText}>{formatTime(currentPosition / 1000)}</Text>
 {isBuffering && <ActivityIndicator size="small" color="#7C3AED" style={styles.bufferingIndicator} />}
 <Text style={styles.timeText}>{formatTime(audioDuration / 1000)}</Text>
 </View>
 <View style={styles.controlButtons}>
 <TouchableOpacity 
 onPress={() => handleSkip(-10)}
 disabled={!isAudioReady || isBuffering}
 style={[styles.controlIcon, (!isAudioReady || isBuffering) && styles.controlIconDisabled]}
 >
 <Icon name="replay-10" size={30} color={isAudioReady && !isBuffering ? "#FFF" : "#666"} />
 </TouchableOpacity>
 <TouchableOpacity 
 onPress={handlePlayPause}
 disabled={!isAudioReady || isBuffering}
 style={[styles.controlIcon, (!isAudioReady || isBuffering) && styles.controlIconDisabled]}
 >
 <Icon
 name={isPlaying ? 'pause' : 'play-arrow'}
 size={40}
 color={isAudioReady && !isBuffering ? "#FFF" : "#666"}
 />
 </TouchableOpacity>
 <TouchableOpacity 
 onPress={() => handleSkip(10)}
 disabled={!isAudioReady || isBuffering}
 style={[styles.controlIcon, (!isAudioReady || isBuffering) && styles.controlIconDisabled]}
 >
 <Icon name="forward-10" size={30} color={isAudioReady && !isBuffering ? "#FFF" : "#666"} />
 </TouchableOpacity>
 </View>
 <View style={styles.bottomActions}>
 <TouchableOpacity>
 <Icon name="cast" size={20} color="#FFF" />
 </TouchableOpacity>
 <TouchableOpacity onPress={handleShare}>
 <Icon name="share" size={20} color="#FFF" />
 </TouchableOpacity>
 <TouchableOpacity>
 <Icon name="more-horiz" size={20} color="#FFF" />
 </TouchableOpacity>
 </View>
 </>
 )}
 </View>

 <View style={{ height: 50, backgroundColor: '#1F1F1F' }} />

 {showMoodSelector && (
 <View style={styles.moodSelector}>
 <Text style={styles.moodSelectorTitle}>How did this episode make you feel?</Text>
 <View style={styles.moodOptions}>
 {['😌', '🧠', '💥', '😭', '😴'].map((emoji) => (
 <TouchableOpacity
 key={emoji}
 style={styles.moodOption}
 onPress={() => handleMoodReaction(emoji)}
 >
 <Text style={styles.moodEmoji}>{emoji}</Text>
 </TouchableOpacity>
 ))}
 </View>
 </View>
 )}
 </View>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: '#1F1F1F',
 },
 header: {
 backgroundColor: '#7C3AED',
 alignItems: 'center',
 justifyContent: 'center',
 paddingVertical: 10,
 },
 headerTitle: {
 fontSize: 24,
 fontWeight: 'bold',
 color: '#FFF',
 },
 backButton: {
 position: 'absolute',
 top: 65,
 left: 15,
 zIndex: 1,
 },
 avatarSection: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'center',
 marginTop: 10,
 marginBottom: 10,
 },
 avatarGlow: {
 shadowColor: '#7C3AED',
 shadowOpacity: 0.5,
 shadowRadius: 8,
 elevation: 4,
 marginRight: 10,
 },
 avatar: {
 width: 80,
 height: 80,
 borderRadius: 40,
 borderWidth: 2,
 borderColor: '#7C3AED',
 },
 auraScoreCard: {
 backgroundColor: '#2A2A2A',
 padding: 8,
 borderRadius: 12,
 alignItems: 'center',
 borderWidth: 1,
 borderColor: '#7C3AED',
 },
 auraScore: {
 fontSize: 16,
 fontWeight: 'bold',
 color: '#FFF',
 },
 auraStatus: {
 fontSize: 12,
 color: '#7C3AED',
 marginTop: 4,
 },
 contentSection: {
 flex: 1,
 marginHorizontal: 15,
 marginBottom: 15,
 },
 summaryContent: {
 backgroundColor: '#2A2A2A',
 padding: 15,
 borderRadius: 12,
 borderWidth: 1,
 borderColor: '#7C3AED',
 marginBottom: 15,
 },
 summaryContainer: {
 backgroundColor: '#2A2A2A',
 padding: 15,
 borderRadius: 12,
 borderWidth: 1,
 borderColor: '#7C3AED',
 marginBottom: 15,
 },
 episodeTitle: {
 fontSize: 20,
 fontWeight: 'bold',
 color: '#FFF',
 marginBottom: 5,
 },
 hosts: {
 fontSize: 14,
 color: '#BBB',
 marginBottom: 8,
 },
 sectionTitle: {
 fontSize: 18,
 fontWeight: 'bold',
 color: '#7C3AED',
 marginBottom: 12,
 },
 summaryText: {
 fontSize: 14,
 lineHeight: 20,
 color: '#FFF',
 },
 mindmapContainer: {
 backgroundColor: '#2A2A2A',
 padding: 15,
 borderRadius: 12,
 borderWidth: 1,
 borderColor: '#7C3AED',
 marginBottom: 15,
 alignItems: 'center',
 },
 mindmapClipContainer: {
 width: '100%',
 height: 400,
 overflow: 'hidden',
 },
 mindmapContainerInner: {
 alignItems: 'center',
 },
 mindmapSvg: {
 marginVertical: 10,
 },
 playbackControls: {
 alignItems: 'center',
 marginBottom: 10,
 paddingHorizontal: 15,
 backgroundColor: '#1F1F1F',
 },
 slider: {
 width: '100%',
 height: 30,
 marginBottom: 5,
 },
 timeContainer: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 width: '100%',
 marginBottom: 5,
 },
 timeText: {
 color: '#FFF',
 fontSize: 12,
 },
 controlButtons: {
 flexDirection: 'row',
 justifyContent: 'space-around',
 marginBottom: 10,
 },
 controlIcon: {
 padding: 8,
 borderRadius: 25,
 backgroundColor: '#2A2A2A',
 borderWidth: 1,
 borderColor: '#7C3AED',
 },
 controlIconDisabled: {
 opacity: 0.5,
 },
 bottomActions: {
 flexDirection: 'row',
 justifyContent: 'space-around',
 width: '50%',
 },
 moodSelector: {
 backgroundColor: '#2A2A2A',
 padding: 15,
 borderRadius: 12,
 marginHorizontal: 15,
 marginBottom: 10,
 borderWidth: 1,
 borderColor: '#7C3AED',
 },
 moodSelectorTitle: {
 fontSize: 16,
 color: '#FFF',
 marginBottom: 10,
 },
 moodOptions: {
 flexDirection: 'row',
 justifyContent: 'space-around',
 width: '100%',
 },
 moodOption: {
 padding: 8,
 borderRadius: 8,
 backgroundColor: '#3A3A3A',
 },
 moodEmoji: {
 fontSize: 20,
 },
 bufferingIndicator: {
 marginHorizontal: 10,
 },
});