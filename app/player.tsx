// app/player.tsx
// Version 1
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
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Slider } from '@rneui/themed';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { usePlayback } from '../context/PlaybackContext';
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
  audio_url: string;
  mindmap: Mindmap;
}

interface Track {
  title: string;
  artist: string;
  audioUrl: string;
  thumbnail: any;
}

interface UserInputs {
  text?: string;
  mood?: string;
  image?: any;
  pdf?: any;
  url?: string;
}

const SAMPLE_RESPONSE = require('./data/sampleResponse.json');

// Simulated aura and vibe utilities
const getMotivationalQuote = (auraScore: number, host: string): string => {
  if (auraScore <= 20) return `${host} says: "Hey, let’s recharge your vibe! 🔋"`;
  if (auraScore <= 50) return `${host} says: "You’re starting to glow—keep it up! ✨"`;
  if (auraScore <= 80) return `${host} says: "Today’s vibe is brain fuel 💡"`;
  return `${host} says: "You’re absolutely slaying it! 🔥"`;
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

  const charWidth = fontSize * 0.6; // Approximate character width based on font size
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
  const svgWidth = 600; // Increased width for more horizontal space
  const mainWidth = 100;
  const mainHeight = 50;
  const branchWidth = 80;
  const branchHeight = 40;
  const subtopicWidth = 60;
  const subtopicHeight = 30;
  const cornerRadius = 8;
  const verticalSpacing = 60; // Space between vertically stacked subtopics

  const mainX = svgWidth / 2; // Center the main topic
  const mainY = 50; // Position at the top

  const branches = mindmap.branches;
  const branchCount = branches.length;
  const branchSpacing = svgWidth / (branchCount + 1); // Space branches evenly
  const branchY = mainY + 120; // Position branches below the main topic

  // Calculate the maximum number of subtopics for dynamic SVG height
  const maxSubtopics = Math.max(...branches.map(branch => branch.subtopics.length), 1);
  const svgHeight = 500 + (maxSubtopics - 1) * verticalSpacing; // Dynamic height based on subtopics

  // Zoom and Pan functionality with boundary constraints
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Container dimensions (approximated from mindmapContainer style)
  const containerWidth = svgWidth; // Match SVG width
  const containerHeight = 400; // Approximate height based on typical mindmapContainer rendering

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
            {/* Main Topic (Root Node) */}
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

            {/* Branches */}
            {branches.map((branch, index) => {
              const branchX = (index + 1) * branchSpacing;
              const subtopics = branch.subtopics;

              return (
                <React.Fragment key={index}>
                  {/* Line from Main Topic to Branch */}
                  <Line
                    x1={mainX}
                    y1={mainY + mainHeight / 2}
                    x2={branchX}
                    y2={branchY - branchHeight / 2}
                    stroke="#7C3AED"
                    strokeWidth="2"
                    opacity={0.7}
                  />
                  {/* Branch Topic Rectangle */}
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

                  {/* Subtopics (Arranged Vertically) */}
                  {subtopics.map((subtopic, subIndex) => {
                    const subtopicX = branchX; // Center subtopics under the branch
                    const subtopicY = branchY + 90 + subIndex * verticalSpacing; // Stack vertically
                    return (
                      <React.Fragment key={subIndex}>
                        {/* Line from Branch to Subtopic */}
                        <Line
                          x1={branchX}
                          y1={branchY + branchHeight / 2}
                          x2={subtopicX}
                          y2={subtopicY - subtopicHeight / 2}
                          stroke="#7C3AED"
                          strokeWidth="1"
                          opacity={0.5}
                        />
                        {/* Subtopic Rectangle */}
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
  const { track, setTrack, isPlaying, togglePlayback, position, duration, setPosition } = usePlayback();
  const [auraScore, setAuraScore] = useState(0);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<UserInputs>();
  const shareRef = useRef<View>(null);

  // Fetch aura score on mount
  useEffect(() => {
    const fetchAuraScore = async () => {
      try {
        const auraData = await AsyncStorage.getItem('VibeCastAuraData');
        if (auraData) {
          const { auraScore } = JSON.parse(auraData);
          setAuraScore(auraScore);
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

  // Call API to summarize and generate podcast
  useEffect(() => {
    if (hasFetchedData || !setTrack) return;

    const fetchPodcastData = async () => {
      setLoading(true);
      try {
        const payload: UserInputs = {
          text: params.text || 'Sample study content for podcast generation.',
          mood: params.mood || 'gen_z_podcast',
        };

        const response = await axios.post('https://BACKEND_ENDPOINT/generate', payload);
        const data: ApiResponse = response.data;

        setApiResponse(data);
        setHasFetchedData(true);

        setTrack({
          title: 'Generated Study Podcast',
          artist: 'VibeCast Host',
          audioUrl: data.audio_url,
          thumbnail: require('../assets/thumbnail.png'),
        });
      } catch (error) {
        console.error('Error calling API:', error);
        setApiResponse(SAMPLE_RESPONSE);
        setHasFetchedData(true);

        setTrack({
          title: 'Sample VibeCast Podcast',
          artist: 'Chill Nerd & Anime Girl',
          audioUrl: SAMPLE_RESPONSE.audio_url,
          thumbnail: require('../assets/thumbnail.png'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPodcastData();
  }, [setTrack, hasFetchedData, params]);

  // Check for playback completion
  useEffect(() => {
    if (position >= duration && duration > 0 && !showMoodSelector) {
      setShowMoodSelector(true);
    }
  }, [position, duration, showMoodSelector]);

  const handleSliderChange = (value: number) => {
    const newPosition = value * 1000;
    setPosition(newPosition);
  };

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

  const positionInSeconds = Math.floor(position / 1000);
  const durationInSeconds = Math.floor(duration / 1000);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const hostQuote = getMotivationalQuote(auraScore, track.artist);

  return (
    <View style={styles.container}>
      {/* Title Bar */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VibeCast</Text>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loaderText}>Generating your podcast...</Text>
        </View>
      ) : (
        <>
          {/* Aura Card (Reduced Size, now side by side) */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarGlow}>
              <Image source={require('../assets/avatar-base.png')} style={styles.avatar} />
            </View>
            <View style={styles.auraScoreCard}>
              <Text style={styles.auraScore}>🌈 Aura: {auraScore}</Text>
              <Text style={styles.auraStatus}>Laser Focused ⚡</Text>
            </View>
          </View>

          {/* Single Scrollable Section (Increased Size) */}
          <ScrollView style={styles.contentSection}>
            {/* Podcast Description */}
            <View style={styles.summaryContent}>
              <Text style={styles.episodeTitle}>{track.title}</Text>
              <Text style={styles.hosts}>Hosted by: {track.artist}</Text>
              <Text style={styles.summaryText}>
                A podcast generated to help you study smarter and vibe harder! 🎧
              </Text>
            </View>

            {/* Summary from API */}
            {apiResponse && (
              <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Summary:</Text>
                <Text style={styles.summaryText}>{apiResponse.summary}</Text>
              </View>
            )}

            {/* Key Points */}
            {apiResponse && (
              <View style={styles.keyPointsContainer}>
                <Text style={styles.sectionTitle}>Key Points:</Text>
                {apiResponse.mindmap.branches
                  .flatMap((branch) => branch.subtopics)
                  .map((point, index) => (
                    <Text key={index} style={styles.keyPoint}>
                      • {point}
                    </Text>
                  ))}
              </View>
            )}

            {/* Transcript */}
            {/* {apiResponse && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.sectionTitle}>Transcript:</Text>
                <Text style={styles.transcriptText}>
                  Welcome to VibeCast! Here’s a transcript of your generated podcast...
                </Text>
              </View>
            )} */}

            {/* Mindmap */}
            {apiResponse && (
              <View style={styles.mindmapContainer}>
                <Text style={styles.sectionTitle}>Mindmap:</Text>
                <MindmapComponent mindmap={apiResponse.mindmap} />
              </View>
            )}
          </ScrollView>

          {/* Playback Controls (Reduced Size) */}
          <View style={styles.playbackControls}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={durationInSeconds || 1}
              value={positionInSeconds}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#7C3AED"
              maximumTrackTintColor="#555"
              thumbTintColor="#7C3AED"
              step={1}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(positionInSeconds)}</Text>
              <Text style={styles.timeText}>{formatTime(durationInSeconds)}</Text>
            </View>
            <View style={styles.controlButtons}>
              <TouchableOpacity onPress={() => handleSliderChange(Math.max(positionInSeconds - 10, 0))}>
                <Icon name="replay-10" size={30} color="#FFF" style={styles.controlIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayback}>
                <Icon
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={40}
                  color="#FFF"
                  style={styles.controlIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSliderChange(Math.min(positionInSeconds + 10, durationInSeconds))}>
                <Icon name="forward-10" size={30} color="#FFF" style={styles.controlIcon} />
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
          </View>

          {/* Bottom spacer to add space below playback controls for easier access to the share button */}
          <View style={{
            height: 50,
            backgroundColor: '#1F1F1F',
          }} />

          {/* Mood Reaction Selector */}
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

          {/* Shareable Content */}
          <View ref={shareRef} style={styles.shareContainer} collapsable={false}>
            <Text style={styles.shareEpisodeTitle}>{track.title}</Text>
            <Text style={styles.shareHosts}>Hosted by: {track.artist}</Text>
            <Text style={styles.shareAuraScore}>Aura Score: {auraScore}</Text>
            <Text style={styles.shareQuote}>{hostQuote}</Text>
          </View>
        </>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFF',
  },
  avatarSection: {
    flexDirection: 'row', // Changed to row for side-by-side layout
    alignItems: 'center', // Align items vertically in the row
    justifyContent: 'center', // Center the items horizontally
    marginTop: 10,
    marginBottom: 10,
  },
  avatarGlow: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 10, // Add spacing between avatar and aura card
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  hosts: {
    fontSize: 14,
    color: '#BBB',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  keyPointsContainer: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 8,
  },
  keyPoint: {
    fontSize: 12,
    color: '#FFF',
    marginVertical: 2,
  },
  transcriptContainer: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    marginBottom: 15,
  },
  transcriptText: {
    fontSize: 12,
    color: '#FFF',
    lineHeight: 18,
  },
  mindmapContainer: {
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    marginBottom: 15,
  },
  mindmapClipContainer: {
    width: '100%',
    height: 400, // Fixed height to match typical mindmapContainer rendering
    overflow: 'hidden', // Clip content that exceeds the container
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
    width: '70%',
    marginBottom: 10,
  },
  controlIcon: {
    padding: 8,
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#7C3AED',
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
    alignItems: 'center',
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  navIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  navIconActive: {
    color: '#7C3AED',
  },
  shareContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    opacity: 0,
  },
  shareEpisodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  shareHosts: {
    fontSize: 16,
    color: '#BBB',
    marginBottom: 5,
  },
  shareAuraScore: {
    fontSize: 14,
    color: '#7C3AED',
    marginBottom: 5,
  },
  shareQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#FFF',
    textAlign: 'center',
  },
});